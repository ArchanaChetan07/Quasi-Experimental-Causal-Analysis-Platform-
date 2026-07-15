# Causal Inference Project

This repo has two parts:

## 1. `python-analysis/`

The original causal-inference analysis: a simulated staggered geographic
feature rollout, analyzed with difference-in-differences (event studies,
parallel-trends testing, heterogeneity-robust cohort ATTs) and propensity
score matching as a robustness check. Includes the Python source
(`code/`), generated data (`data/`), figures (`figures/`), and the
write-up (`Causal_Inference_Report.docx`).

Start here if you want to see or rerun the actual statistics.

```bash
cd python-analysis
pip install pandas numpy statsmodels scikit-learn matplotlib --break-system-packages
python3 code/01_simulate_data.py
python3 code/02_did_analysis.py
python3 code/03_plots.py
python3 code/04_psm_analysis.py
python3 code/05_psm_plot.py
```

## 2. `web-dashboard/`

A production Next.js dashboard that turns the analysis outputs above into
an interactive, tested, deployable web app (charts, balance tables, CI,
Docker, observability, security headers, accessibility — see its own
README for the full breakdown).

```bash
cd web-dashboard
make install
make prepare-data   # regenerates data/results.json from analysis-source/
make dev            # http://localhost:3000
```

`web-dashboard/analysis-source/` holds a copy of `python-analysis`'s CSV/TXT
outputs — that's the hand-off point between the two halves of this repo.
Re-run the Python pipeline, copy its `output/*.csv` and `output/*.txt` into
`web-dashboard/analysis-source/`, then `make prepare-data` to refresh the
dashboard.

`web-dashboard/.git-history.bundle` is the dashboard's git history (with
the v1.1.0 tag) if you want to restore real commit history:

```bash
cd web-dashboard
git clone .git-history.bundle restored-repo
```

## Full command reference

See `web-dashboard/README.md` (architecture, deployment) and
`web-dashboard/CONTRIBUTING.md` (dev workflow) for everything past this
quick start.
