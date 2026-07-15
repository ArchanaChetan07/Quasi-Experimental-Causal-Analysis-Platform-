# Python causal analysis

Staggered geographic feature rollout analyzed with DiD (TWFE, event studies,
parallel-trends tests, not-yet-treated cohort ATTs) and propensity score matching.

## Setup

```bash
pip install -r requirements.txt
```

SciPy must be `<1.16` for compatibility with current statsmodels builds.

## Run

```bash
# Full pipeline (recommended)
python run_all.py

# Or step-by-step
python code/01_simulate_data.py
python code/02_did_analysis.py
python code/03_plots.py
python code/04_psm_analysis.py
python code/05_psm_plot.py
```

Outputs land in `data/`, `output/`, and `figures/`.

## Optional Word report

```bash
npm install
npm run build-report   # writes output/Causal_Inference_Report.docx
```

Requires figures from steps 03 and 05.

## Hand off to the dashboard

Copy `output/*.csv` and `output/*.txt` into `../web-dashboard/analysis-source/`, then:

```bash
cd ../web-dashboard
npm run prepare-data
```
