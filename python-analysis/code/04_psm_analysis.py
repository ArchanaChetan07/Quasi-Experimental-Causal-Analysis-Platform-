"""
04_psm_analysis.py

Propensity-score matching (PSM) as an alternative/robustness method.

Rationale: DiD requires panel data and a parallel-trends assumption. Suppose
instead we only had CROSS-SECTIONAL data at the market level (e.g., a
snapshot after rollout, no clean pre-period panel) -- a common real-world
constraint. Under that constraint, a natural alternative is PSM: match
"ever-treated" markets to "never-treated" markets on pre-period observable
characteristics, then compare post-period outcomes between matched pairs.

We use the market-level covariates built in 01_simulate_data.py
(pre_gmv_mean, pre_gmv_trend, pre_gmv_vol) to estimate a propensity score via
logistic regression, perform nearest-neighbor matching, check covariate
balance before/after matching, and estimate the ATT on post-period GMV.

This lets us document a DIFFERENT threat to validity than DiD's parallel
trends: SELECTION ON OBSERVABLES (matching only balances what we measured;
if early adopters were picked because of something we didn't measure -- e.g.
a subjective "this market's team is strong" judgment -- PSM's identifying
assumption fails, exactly analogous to the discovered pre-trend violation
in the DiD analysis for the early cohort).
"""

from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from scipy.spatial.distance import cdist

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
OUT = ROOT / "output"
OUT.mkdir(parents=True, exist_ok=True)

df = pd.read_csv(DATA / "panel_data.csv")
cov = pd.read_csv(DATA / "market_covariates.csv")

# Post-period outcome (weeks 90-104, well after all treated cohorts have launched)
post = df[df["week"] >= 90].groupby("market")["log_gmv"].mean().rename("post_log_gmv")
cov = cov.merge(post, on="market")

X_cols = ["pre_gmv_mean", "pre_gmv_trend", "pre_gmv_vol"]
X = cov[X_cols].copy()
# standardize
X = (X - X.mean()) / X.std()
y = cov["ever_treated"].values

logit = LogisticRegression()
logit.fit(X, y)
cov["pscore"] = logit.predict_proba(X)[:, 1]

treated = cov[cov["ever_treated"] == 1].reset_index(drop=True)
control = cov[cov["ever_treated"] == 0].reset_index(drop=True)

# --- Covariate balance BEFORE matching ---
def std_mean_diff(t, c):
    pooled_sd = np.sqrt((t.var(ddof=1) + c.var(ddof=1)) / 2)
    return (t.mean() - c.mean()) / pooled_sd if pooled_sd > 0 else np.nan

balance_before = []
for col in X_cols + ["pscore"]:
    smd = std_mean_diff(treated[col], control[col])
    balance_before.append({"covariate": col, "treated_mean": treated[col].mean(),
                            "control_mean": control[col].mean(), "std_mean_diff": smd})
balance_before_df = pd.DataFrame(balance_before)

# --- Nearest-neighbor matching on propensity score (1:2, with replacement) ---
dists = cdist(treated[["pscore"]].values, control[["pscore"]].values, metric="euclidean")
K = 2
matched_control_idx = np.argsort(dists, axis=1)[:, :K]

matched_rows = []
for i, t_row in treated.iterrows():
    ctrl_idxs = matched_control_idx[i]
    ctrl_matches = control.iloc[ctrl_idxs]
    matched_rows.append({
        "market": t_row["market"],
        "post_log_gmv_treated": t_row["post_log_gmv"],
        "post_log_gmv_matched_control": ctrl_matches["post_log_gmv"].mean(),
        "pscore_treated": t_row["pscore"],
        "pscore_matched_control_mean": ctrl_matches["pscore"].mean(),
    })
matched_df = pd.DataFrame(matched_rows)
matched_df["ind_att"] = matched_df["post_log_gmv_treated"] - matched_df["post_log_gmv_matched_control"]

att_psm = matched_df["ind_att"].mean()
se_psm = matched_df["ind_att"].std(ddof=1) / np.sqrt(len(matched_df))
ci_psm = (att_psm - 1.96 * se_psm, att_psm + 1.96 * se_psm)

# --- Covariate balance AFTER matching (using the matched control set, weighted) ---
used_ctrl_idx = np.unique(matched_control_idx.flatten())
matched_controls_full = control.iloc[used_ctrl_idx]

balance_after = []
for col in X_cols + ["pscore"]:
    smd = std_mean_diff(treated[col], matched_controls_full[col])
    balance_after.append({"covariate": col, "treated_mean": treated[col].mean(),
                           "matched_control_mean": matched_controls_full[col].mean(),
                           "std_mean_diff": smd})
balance_after_df = pd.DataFrame(balance_after)

# Save everything
balance_before_df.to_csv(OUT / "psm_balance_before.csv", index=False)
balance_after_df.to_csv(OUT / "psm_balance_after.csv", index=False)
matched_df.to_csv(OUT / "psm_matched_pairs.csv", index=False)

with open(OUT / "psm_summary.txt", "w") as f:
    f.write("PROPENSITY SCORE MATCHING RESULTS\n\n")
    f.write("Covariate balance BEFORE matching (standardized mean difference):\n")
    f.write(balance_before_df.to_string(index=False))
    f.write("\n\nCovariate balance AFTER matching (standardized mean difference):\n")
    f.write(balance_after_df.to_string(index=False))
    f.write(f"\n\nATT (post-period log GMV), 1:{K} nearest-neighbor PS matching: {att_psm:.4f}\n")
    f.write(f"SE: {se_psm:.4f}, 95%% CI: [{ci_psm[0]:.4f}, {ci_psm[1]:.4f}]\n")
    f.write(f"Implied %% effect: {(np.exp(att_psm)-1)*100:.2f}%%\n")
    n_bad_before = (balance_before_df["std_mean_diff"].abs() > 0.1).sum()
    n_bad_after = (balance_after_df["std_mean_diff"].abs() > 0.1).sum()
    f.write(f"\nCovariates with |SMD| > 0.10 (common balance threshold): "
            f"{n_bad_before} before matching, {n_bad_after} after matching.\n")

print(balance_before_df)
print(balance_after_df)
print(f"PSM ATT: {att_psm:.4f} (SE {se_psm:.4f})")
