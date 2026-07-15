from pathlib import Path

import pandas as pd
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

plt.rcParams.update({"font.size": 11, "figure.dpi": 140})

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
OUT = ROOT / "output"
FIG = ROOT / "figures"
FIG.mkdir(parents=True, exist_ok=True)

# --- Raw trends by cohort (visual parallel-trends check) ---
df = pd.read_csv(DATA / "panel_data.csv")
trend = df.groupby(["cohort", "week"])["log_gmv"].mean().reset_index()

fig, ax = plt.subplots(figsize=(9, 5))
colors = {"early": "#d62728", "mid": "#1f77b4", "late": "#2ca02c", "never": "#7f7f7f"}
for cohort in ["never", "late", "mid", "early"]:
    sub = trend[trend["cohort"] == cohort]
    ax.plot(sub["week"], sub["log_gmv"], label=cohort, color=colors[cohort], lw=2)
for cohort, wk in [("early", 30), ("mid", 55), ("late", 75)]:
    ax.axvline(wk, color=colors[cohort], linestyle="--", alpha=0.4)
ax.set_xlabel("Week")
ax.set_ylabel("Mean log(GMV)")
ax.set_title("Raw market-level GMV trends by rollout cohort\n(dashed lines = launch week for that cohort)")
ax.legend(title="Cohort")
fig.tight_layout()
fig.savefig(f"{FIG}/01_raw_trends_by_cohort.png")
plt.close(fig)

# --- Pooled event study plot ---
ev = pd.read_csv(f"{OUT}/event_study_pooled.csv")
fig, ax = plt.subplots(figsize=(9, 5))
ax.errorbar(ev["rel_time"], ev["coef"], yerr=1.96 * ev["se"], fmt="o-", capsize=3, color="#333")
ax.axhline(0, color="black", lw=0.8)
ax.axvline(-0.5, color="red", linestyle="--", alpha=0.6, label="Launch")
ax.set_xlabel("Weeks relative to launch")
ax.set_ylabel("Effect on log(GMV) vs. never-treated (rel. to week -1)")
ax.set_title("Pooled event study (parallel-trends test)\nPre-period coefficients should be ~0 if parallel trends holds")
ax.legend()
fig.tight_layout()
fig.savefig(f"{FIG}/02_event_study_pooled.png")
plt.close(fig)

# --- Cohort-specific event studies ---
fig, axes = plt.subplots(1, 3, figsize=(15, 5), sharey=True)
for ax, cohort in zip(axes, ["early", "mid", "late"]):
    c = pd.read_csv(f"{OUT}/event_study_{cohort}.csv")
    ax.errorbar(c["rel_time"], c["coef"], yerr=1.96 * c["se"], fmt="o-", capsize=3,
                color=colors[cohort])
    ax.axhline(0, color="black", lw=0.8)
    ax.axvline(-0.5, color="red", linestyle="--", alpha=0.6)
    ax.set_title(f"{cohort.capitalize()} cohort vs. never-treated")
    ax.set_xlabel("Weeks relative to launch")
axes[0].set_ylabel("Effect on log(GMV)")
fig.suptitle("Cohort-specific event studies")
fig.tight_layout()
fig.savefig(f"{FIG}/03_event_study_by_cohort.png")
plt.close(fig)

# --- ATT comparison bar chart: naive TWFE vs clean cohort-robust estimates ---
cs = pd.read_csv(f"{OUT}/cohort_clean_att.csv")
with open(f"{OUT}/twfe_result.txt") as f:
    txt = f.read()
twfe_att = float([l for l in txt.splitlines() if "ATT estimate" in l][0].split(":")[1])

fig, ax = plt.subplots(figsize=(8, 5))
labels = list(cs["cohort"]) + ["Naive\npooled TWFE"]
vals = list(cs["att"]) + [twfe_att]
errs = list(1.96 * cs["se"]) + [0]
bar_colors = [colors[c] for c in cs["cohort"]] + ["black"]
ax.bar(labels, vals, yerr=errs, capsize=4, color=bar_colors, alpha=0.85)
ax.set_ylabel("ATT on log(GMV)")
ax.set_title("Treatment effect estimates:\ncohort-robust (not-yet-treated comparison) vs. naive TWFE")
ax.axhline(0, color="black", lw=0.8)
fig.tight_layout()
fig.savefig(f"{FIG}/04_att_comparison.png")
plt.close(fig)

print("Saved 4 figures to", FIG)
