"""Run the full Python analysis pipeline in order (01 → 05)."""
from __future__ import annotations

import runpy
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
CODE = ROOT / "code"

STEPS = [
    "01_simulate_data.py",
    "02_did_analysis.py",
    "03_plots.py",
    "04_psm_analysis.py",
    "05_psm_plot.py",
]


def main() -> int:
    for name in STEPS:
        script = CODE / name
        print(f"\n=== Running {name} ===")
        runpy.run_path(str(script), run_name="__main__")
    print("\nAll analysis steps completed. Outputs in data/, output/, figures/")
    return 0


if __name__ == "__main__":
    sys.exit(main())
