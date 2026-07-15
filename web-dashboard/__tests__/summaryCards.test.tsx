import { render, screen } from "@testing-library/react";
import { SummaryCards } from "@/components/SummaryCards";

const summary = {
  twfe: { att: 0.1452, se: 0.0234, ci: [0.0992, 0.1911] as [number, number], impliedPct: 15.63 },
  parallelTrends: { fStat: 5.101, pValue: 0.0001, rejected: true },
  cohortPretrendPValues: [
    { cohort: "early", pValue: 0.0001 },
    { cohort: "mid", pValue: 0.0063 },
    { cohort: "late", pValue: 0.011 },
  ],
  psm: { att: 0.1102, se: 0.0765, ci: [-0.0396, 0.2601] as [number, number], impliedPct: 11.65 },
};

const cohortAtt = [
  { cohort: "early" as const, att: 0.2046, se: 0.0118, ci_low: 0.1814, ci_high: 0.2278, n_treated_mkts: 8, n_control_mkts: 16 },
  { cohort: "mid" as const, att: 0.0801, se: 0.0069, ci_low: 0.0665, ci_high: 0.0937, n_treated_mkts: 8, n_control_mkts: 16 },
  { cohort: "late" as const, att: 0.0612, se: 0.0096, ci_low: 0.0423, ci_high: 0.0801, n_treated_mkts: 8, n_control_mkts: 16 },
];

describe("SummaryCards", () => {
  it("renders the naive TWFE implied percent effect", () => {
    render(<SummaryCards summary={summary} cohortAtt={cohortAtt} />);
    expect(screen.getByText("+15.6%")).toBeInTheDocument();
  });

  it("renders the PSM implied percent effect", () => {
    render(<SummaryCards summary={summary} cohortAtt={cohortAtt} />);
    expect(screen.getByText("+11.7%")).toBeInTheDocument();
  });

  it("computes the mid/late cohort average from cohortAtt rather than hardcoding it", () => {
    render(<SummaryCards summary={summary} cohortAtt={cohortAtt} />);
    // mid ATT 0.0801 -> +8.34%, late ATT 0.0612 -> +6.31%; average ~7.3%
    expect(screen.getByText("~+7.3%")).toBeInTheDocument();
  });

  it("derives the recommended headline range from mid/late cohorts", () => {
    render(<SummaryCards summary={summary} cohortAtt={cohortAtt} />);
    expect(screen.getByText("+6.3% to +8.3%")).toBeInTheDocument();
  });

  it("shows a fallback when no mid/late cohorts are present", () => {
    const earlyOnly = cohortAtt.filter((c) => c.cohort === "early");
    render(<SummaryCards summary={summary} cohortAtt={earlyOnly} />);
    expect(screen.getAllByText("n/a").length).toBeGreaterThanOrEqual(1);
  });
});
