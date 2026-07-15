from pathlib import Path

import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "output"
FIG = ROOT / "figures"
FIG.mkdir(parents=True, exist_ok=True)

before = pd.read_csv(OUT / "psm_balance_before.csv")
after = pd.read_csv(OUT / "psm_balance_after.csv")

fig, ax = plt.subplots(figsize=(8, 5))
y = range(len(before))
ax.scatter(before["std_mean_diff"], y, label="Before matching", color="#d62728", s=70, zorder=3)
ax.scatter(after["std_mean_diff"], y, label="After matching", color="#1f77b4", s=70, zorder=3)
for yi in y:
    ax.plot([before["std_mean_diff"][yi], after["std_mean_diff"][yi]], [yi, yi],
            color="gray", alpha=0.5, zorder=1)
ax.axvline(0.1, color="black", linestyle="--", alpha=0.5, label="±0.10 balance threshold")
ax.axvline(-0.1, color="black", linestyle="--", alpha=0.5)
ax.axvline(0, color="black", lw=0.8)
ax.set_yticks(list(y))
ax.set_yticklabels(before["covariate"])
ax.set_xlabel("Standardized mean difference (treated - control)")
ax.set_title("Covariate balance before vs. after propensity-score matching")
ax.legend()
fig.tight_layout()
fig.savefig(f"{FIG}/05_psm_balance.png")
plt.close(fig)
print("saved balance plot")
