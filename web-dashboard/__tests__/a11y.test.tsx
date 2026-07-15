import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { SummaryCards } from "@/components/SummaryCards";
import { BalanceTable } from "@/components/BalanceTable";
import { StatusBadge } from "@/components/StatusBadge";

expect.extend(toHaveNoViolations);

const summary = {
  twfe: { att: 0.1452, se: 0.0234, ci: [0.0992, 0.1911] as [number, number], impliedPct: 15.63 },
  parallelTrends: { fStat: 5.101, pValue: 0.0001, rejected: true },
  cohortPretrendPValues: [{ cohort: "mid", pValue: 0.0063 }],
  psm: { att: 0.1102, se: 0.0765, ci: [-0.0396, 0.2601] as [number, number], impliedPct: 11.65 },
};

const cohortAtt = [
  {
    cohort: "mid" as const,
    att: 0.0801,
    se: 0.0069,
    ci_low: 0.0665,
    ci_high: 0.0937,
    n_treated_mkts: 8,
    n_control_mkts: 16,
  },
];

const balance = [
  { covariate: "pre_gmv_mean", treated_mean: 100, control_mean: 90, std_mean_diff: 0.38 },
];
const balanceAfter = [
  { covariate: "pre_gmv_mean", treated_mean: 100, matched_control_mean: 95, std_mean_diff: 0.08 },
];

describe("accessibility", () => {
  it("SummaryCards has no detectable a11y violations", async () => {
    const { container } = render(<SummaryCards summary={summary} cohortAtt={cohortAtt} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("BalanceTable has no detectable a11y violations", async () => {
    const { container } = render(<BalanceTable before={balance} after={balanceAfter} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("StatusBadge has no detectable a11y violations", async () => {
    const { container } = render(
      <StatusBadge tone="ok">Cannot reject parallel trends</StatusBadge>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
