"""
01_simulate_data.py

Simulates a staggered geographic rollout of a marketplace feature (e.g., a new
"instant checkout" feature rolled out market-by-market over 2022-2023).

Design choices (documented so the analysis can reference them):
- 40 geographic markets, weekly panel, 104 weeks (2 years).
- 8 "early adopter" markets get the feature in week 30, 8 "mid" markets in week
  55, 8 "late" markets in week 75, and 16 markets never get it (control).
- True treatment effect on log(weekly GMV) is roughly +6 to +9%, ramping in
  over 4 weeks after go-live (dynamic effect), with mild heterogeneity by
  cohort.
- Markets are NOT randomly assigned to rollout wave. Early-adopter markets are
  deliberately chosen (by the simulated "product team") to be markets that
  were ALREADY trending up in GMV before rollout (PMs picked their
  best-performing markets to launch first). This bakes in a realistic
  parallel-trends violation for the early cohort that the analysis should be
  able to detect.
- Mid and late cohorts are assigned on an engineering-capacity schedule, not a
  performance-based one, so they should satisfy parallel trends reasonably
  well - this contrast is the pedagogical point of the project.
"""

from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
DATA.mkdir(parents=True, exist_ok=True)

rng = np.random.default_rng(42)

N_MARKETS = 40
N_WEEKS = 104
WAVE_TIMES = {"early": 30, "mid": 55, "late": 75}
COHORT_SIZE = 8  # early, mid, late each get 8 markets; remaining 16 = never-treated

markets = [f"mkt_{i:02d}" for i in range(N_MARKETS)]
rng.shuffle(markets)

early_markets = markets[0:COHORT_SIZE]
mid_markets = markets[COHORT_SIZE:2 * COHORT_SIZE]
late_markets = markets[2 * COHORT_SIZE:3 * COHORT_SIZE]
never_markets = markets[3 * COHORT_SIZE:]

cohort_map = {}
for m in early_markets:
    cohort_map[m] = ("early", WAVE_TIMES["early"])
for m in mid_markets:
    cohort_map[m] = ("mid", WAVE_TIMES["mid"])
for m in late_markets:
    cohort_map[m] = ("late", WAVE_TIMES["late"])
for m in never_markets:
    cohort_map[m] = ("never", np.inf)

market_fe = {m: rng.normal(9.0, 0.4) for m in markets}

week_shock = rng.normal(0, 0.02, size=N_WEEKS).cumsum() * 0.3
seasonality = 0.05 * np.sin(2 * np.pi * np.arange(N_WEEKS) / 52)

base_trend = {m: rng.normal(0.0015, 0.0008) for m in markets}
confound_boost = {m: rng.normal(0.006, 0.0015) for m in early_markets}

def true_effect(weeks_since_launch, cohort):
    if weeks_since_launch < 0:
        return 0.0
    base = {"early": 0.09, "mid": 0.08, "late": 0.06}[cohort]
    ramp = min(1.0, (weeks_since_launch + 1) / 4)
    return base * ramp

rows = []
for m in markets:
    cohort, launch_week = cohort_map[m]
    trend = base_trend[m] + confound_boost.get(m, 0.0)
    market_noise = rng.normal(0, 0.025, size=N_WEEKS)
    for w in range(N_WEEKS):
        weeks_since = w - launch_week if np.isfinite(launch_week) else -1
        treated_now = 1 if (np.isfinite(launch_week) and w >= launch_week) else 0
        effect = true_effect(weeks_since, cohort) if treated_now else 0.0
        log_gmv = (
            market_fe[m]
            + trend * w
            + week_shock[w]
            + seasonality[w]
            + effect
            + market_noise[w]
        )
        rows.append({
            "market": m,
            "cohort": cohort,
            "week": w,
            "launch_week": launch_week if np.isfinite(launch_week) else np.nan,
            "treated": treated_now,
            "weeks_since_launch": weeks_since if treated_now else np.nan,
            "log_gmv": log_gmv,
            "gmv": np.exp(log_gmv),
        })

df = pd.DataFrame(rows)

pre = df[df["week"] < 20].groupby("market").agg(
    pre_gmv_mean=("gmv", "mean"),
    pre_gmv_trend=("log_gmv", lambda x: np.polyfit(range(len(x)), x, 1)[0]),
    pre_gmv_vol=("log_gmv", "std"),
).reset_index()
pre["cohort"] = pre["market"].map(lambda m: cohort_map[m][0])
pre["ever_treated"] = pre["cohort"].apply(lambda c: 0 if c == "never" else 1)

df.to_csv(DATA / "panel_data.csv", index=False)
pre.to_csv(DATA / "market_covariates.csv", index=False)

print("Panel shape:", df.shape)
print("Cohort counts:", {"early": len(early_markets), "mid": len(mid_markets),
      "late": len(late_markets), "never": len(never_markets)})
print("Saved panel_data.csv and market_covariates.csv")
