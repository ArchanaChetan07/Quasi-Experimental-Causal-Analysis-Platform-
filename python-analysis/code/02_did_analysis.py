"""
02_did_analysis.py

Difference-in-Differences analysis of the staggered feature rollout.

Steps:
1. Naive two-way fixed effects (TWFE) DiD estimate (the "simple" approach,
   known to be biased under staggered adoption + heterogeneous/dynamic
   effects - we report it for comparison, then show why it's biased).
2. Event-study specification (leads and lags around launch) -> the actual
   parallel-trends test. Pre-treatment leads should be ~0 and jointly
   insignificant if parallel trends holds.
3. Cohort-by-cohort event studies to show that "early" cohort violates
   parallel trends (as designed) while "mid"/"late" look fine.
4. A heterogeneity-robust estimate using a simple stacked/callaway-santanna-
   style approach: for each cohort, compare only to not-yet-treated units,
   average per-cohort ATT into an overall ATT. This is the "correct" modern
   estimator and is contrasted with naive TWFE.
"""

from pathlib import Path

import numpy as np
import pandas as pd
import statsmodels.formula.api as smf

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
OUT = ROOT / "output"
OUT.mkdir(parents=True, exist_ok=True)

df = pd.read_csv(DATA / "panel_data.csv")

# ---------------------------------------------------------------
# 1. Naive TWFE DiD
# ---------------------------------------------------------------
twfe = smf.ols("log_gmv ~ treated + C(market) + C(week)", data=df).fit(
    cov_type="cluster", cov_kwds={"groups": df["market"]}
)
twfe_att = twfe.params["treated"]
twfe_ci = twfe.conf_int().loc["treated"].values
twfe_se = twfe.bse["treated"]

with open(OUT / "twfe_result.txt", "w") as f:
    f.write("NAIVE TWFE DiD (biased under staggered adoption)\n")
    f.write(f"ATT estimate (log points): {twfe_att:.4f}\n")
    f.write(f"SE (clustered by market): {twfe_se:.4f}\n")
    f.write(f"95% CI: [{twfe_ci[0]:.4f}, {twfe_ci[1]:.4f}]\n")
    f.write(f"Implied % effect on GMV: {(np.exp(twfe_att)-1)*100:.2f}%\n")

print("TWFE ATT:", twfe_att, "CI:", twfe_ci)

# ---------------------------------------------------------------
# 2. Event-study spec (pooled, relative event time, treated units only vs
#    never-treated as clean control) -> primary parallel-trends test
# ---------------------------------------------------------------
ev = df.copy()
ev["rel_time"] = np.where(ev["treated"] == 1, ev["weeks_since_launch"],
                           np.where(ev["cohort"] != "never",
                                     ev["week"] - ev["launch_week"], np.nan))
# For never-treated, rel_time undefined -> they act as pure controls (all leads/lags = 0 dummy baseline)
ev["rel_time"] = ev["rel_time"].round().astype("Int64")

# bin relative time to [-12, 12], with endpoints as catch-alls, drop -1 as baseline
LO, HI = -12, 12
ev["rel_bin"] = ev["rel_time"].clip(lower=LO, upper=HI)
ev.loc[ev["cohort"] == "never", "rel_bin"] = pd.NA  # never-treated: no bin, pure control group

bins = [b for b in range(LO, HI + 1) if b != -1]
for b in bins:
    col = f"rt_{b}".replace("-", "m")
    ev[col] = (ev["rel_bin"] == b).fillna(False).astype(int)

rhs = " + ".join([f"rt_{b}".replace("-", "m") for b in bins])
formula = f"log_gmv ~ {rhs} + C(market) + C(week)"
event_model = smf.ols(formula, data=ev).fit(cov_type="cluster", cov_kwds={"groups": ev["market"]})

event_results = []
for b in bins:
    col = f"rt_{b}".replace("-", "m")
    coef = event_model.params.get(col, np.nan)
    se = event_model.bse.get(col, np.nan)
    event_results.append({"rel_time": b, "coef": coef, "se": se,
                           "ci_low": coef - 1.96 * se, "ci_high": coef + 1.96 * se})
event_df = pd.DataFrame(event_results)
event_df.to_csv(OUT / "event_study_pooled.csv", index=False)

# Joint F-test on pre-period leads (parallel trends test)
pre_cols = [f"rt_{b}".replace("-", "m") for b in bins if b < -1]
hyp = " = ".join(pre_cols) + " = 0"
try:
    ftest = event_model.f_test(hyp)
    pval = float(ftest.pvalue)
    fstat = float(ftest.fvalue)
except Exception as e:
    pval, fstat = np.nan, np.nan

with open(OUT / "parallel_trends_test.txt", "w") as f:
    f.write("POOLED EVENT-STUDY PARALLEL TRENDS TEST\n")
    f.write("Joint test that all pre-treatment lead coefficients = 0\n")
    f.write(f"F-statistic: {fstat:.3f}\n")
    f.write(f"p-value: {pval:.4f}\n")
    if pval < 0.05:
        f.write("=> REJECT parallel trends at 5% level (pooled sample). "
                "Pre-trends are NOT flat - pooled naive DiD is suspect.\n")
    else:
        f.write("=> Cannot reject parallel trends at 5% level (pooled sample).\n")

print("Pooled pre-trend F-test p-value:", pval)

# ---------------------------------------------------------------
# 3. Cohort-specific event studies (early vs mid vs late vs never)
# ---------------------------------------------------------------
cohort_event_frames = {}
for cohort in ["early", "mid", "late"]:
    sub = df[df["cohort"].isin([cohort, "never"])].copy()
    sub["rel_time"] = np.where(sub["treated"] == 1, sub["weeks_since_launch"],
                                np.where(sub["cohort"] == cohort,
                                          sub["week"] - sub["launch_week"], np.nan))
    sub["rel_time"] = sub["rel_time"].round().astype("Int64")
    sub["rel_bin"] = sub["rel_time"].clip(lower=LO, upper=HI)
    sub.loc[sub["cohort"] == "never", "rel_bin"] = pd.NA
    for b in bins:
        col = f"rt_{b}".replace("-", "m")
        sub[col] = (sub["rel_bin"] == b).fillna(False).astype(int)
    formula_c = f"log_gmv ~ {rhs} + C(market) + C(week)"
    m = smf.ols(formula_c, data=sub).fit(cov_type="cluster", cov_kwds={"groups": sub["market"]})
    rows = []
    for b in bins:
        col = f"rt_{b}".replace("-", "m")
        coef = m.params.get(col, np.nan)
        se = m.bse.get(col, np.nan)
        rows.append({"rel_time": b, "coef": coef, "se": se,
                      "ci_low": coef - 1.96 * se, "ci_high": coef + 1.96 * se})
    cohort_event_frames[cohort] = pd.DataFrame(rows)
    pre_cols_c = [f"rt_{b}".replace("-", "m") for b in bins if b < -1]
    hyp_c = " = ".join(pre_cols_c) + " = 0"
    try:
        ft = m.f_test(hyp_c)
        p_c = float(ft.pvalue)
    except Exception:
        p_c = np.nan
    cohort_event_frames[cohort].attrs["pretrend_pvalue"] = p_c
    cohort_event_frames[cohort].to_csv(
        OUT / f"event_study_{cohort}.csv", index=False)
    print(f"Cohort {cohort}: pre-trend joint p-value = {p_c:.4f}")

with open(OUT / "cohort_pretrend_pvalues.txt", "w") as f:
    for cohort in ["early", "mid", "late"]:
        p_c = cohort_event_frames[cohort].attrs["pretrend_pvalue"]
        f.write(f"{cohort}: pre-trend joint p-value = {p_c:.4f}\n")

# ---------------------------------------------------------------
# 4. Heterogeneity-robust "clean" estimator: per-cohort ATT using only
#    not-yet-treated / never-treated as comparison, then aggregate.
#    (Simplified Callaway & Sant'Anna style: compare each cohort's average
#    post-launch change to the average change of never-treated units over
#    the same calendar window, i.e. a clean 2x2 DiD per cohort.)
# ---------------------------------------------------------------
def clean_cohort_att(df, cohort, launch_week, post_window=20, pre_window=20):
    treat_mkts = df[df["cohort"] == cohort]["market"].unique()
    # Not-yet-treated controls: never-treated + cohorts that launch later
    # (simplified Callaway–Sant'Anna style comparison group).
    never = df["cohort"] == "never"
    later = df["launch_week"].notna() & (df["launch_week"] > launch_week)
    ctrl_mkts = df.loc[never | later, "market"].unique()
    pre = df[(df["week"] >= launch_week - pre_window) & (df["week"] < launch_week)]
    post = df[(df["week"] >= launch_week) & (df["week"] < launch_week + post_window)]

    def grp_mean(frame, mkts):
        return frame[frame["market"].isin(mkts)]["log_gmv"].mean()

    treat_pre, treat_post = grp_mean(pre, treat_mkts), grp_mean(post, treat_mkts)
    ctrl_pre, ctrl_post = grp_mean(pre, ctrl_mkts), grp_mean(post, ctrl_mkts)
    att = (treat_post - treat_pre) - (ctrl_post - ctrl_pre)

    # simple SE via market-level 2x2 diffs (treat and control), Welch-style
    def unit_diffs(frame_pre, frame_post, mkts):
        out = []
        for m in mkts:
            a = frame_pre[frame_pre["market"] == m]["log_gmv"].mean()
            b = frame_post[frame_post["market"] == m]["log_gmv"].mean()
            out.append(b - a)
        return np.array(out)

    treat_diffs = unit_diffs(pre, post, treat_mkts)
    ctrl_diffs = unit_diffs(pre, post, ctrl_mkts)
    se = np.sqrt(treat_diffs.var(ddof=1) / len(treat_diffs) + ctrl_diffs.var(ddof=1) / len(ctrl_diffs))
    return att, se, len(treat_mkts), len(ctrl_mkts)

cs_rows = []
for cohort, lw in [("early", 30), ("mid", 55), ("late", 75)]:
    att, se, n_t, n_c = clean_cohort_att(df, cohort, lw)
    cs_rows.append({"cohort": cohort, "att": att, "se": se,
                     "ci_low": att - 1.96 * se, "ci_high": att + 1.96 * se,
                     "n_treated_mkts": n_t, "n_control_mkts": n_c})
cs_df = pd.DataFrame(cs_rows)

# simple average ATT across cohorts (equal-weighted, as a summary "overall" effect)
overall_att = cs_df["att"].mean()
overall_se = np.sqrt((cs_df["se"] ** 2).sum()) / len(cs_df)
cs_df.to_csv(OUT / "cohort_clean_att.csv", index=False)

with open(OUT / "clean_estimator_summary.txt", "w") as f:
    f.write("HETEROGENEITY-ROBUST (NOT-YET-TREATED COMPARISON) ATT BY COHORT\n\n")
    for _, r in cs_df.iterrows():
        f.write(f"{r['cohort']}: ATT = {r['att']:.4f} (SE={r['se']:.4f}), "
                f"95% CI [{r['ci_low']:.4f}, {r['ci_high']:.4f}]  "
                f"(implied %: {(np.exp(r['att'])-1)*100:.2f}%)\n")
    f.write(f"\nEqual-weighted average ATT across cohorts: {overall_att:.4f} "
            f"(implied {(np.exp(overall_att)-1)*100:.2f}%), approx SE={overall_se:.4f}\n")
    f.write(f"\nFor comparison, naive pooled TWFE ATT = {twfe_att:.4f} "
            f"(implied {(np.exp(twfe_att)-1)*100:.2f}%)\n")

print("Clean cohort ATTs:\n", cs_df)
print("Overall (equal-weighted) ATT:", overall_att, "vs naive TWFE:", twfe_att)

print("\nDone. Results written to output/")
