import { render } from "@testing-library/react";
import { EventStudyChart } from "@/components/EventStudyChart";
import { CohortAttChart } from "@/components/CohortAttChart";
import { BalanceChart } from "@/components/BalanceChart";

// Recharts' ResponsiveContainer needs real layout dimensions to render its
// children in jsdom; these are smoke tests confirming the components mount
// without throwing, not pixel-level rendering assertions.

const eventData = [
  { rel_time: -2, coef: -0.01, se: 0.01, ci_low: -0.03, ci_high: 0.01 },
  { rel_time: -1, coef: 0, se: 0.01, ci_low: -0.02, ci_high: 0.02 },
  { rel_time: 0, coef: 0.03, se: 0.01, ci_low: 0.01, ci_high: 0.05 },
];

const cohortAtt = [
  {
    cohort: "early" as const,
    att: 0.2,
    se: 0.01,
    ci_low: 0.18,
    ci_high: 0.22,
    n_treated_mkts: 8,
    n_control_mkts: 16,
  },
  {
    cohort: "mid" as const,
    att: 0.08,
    se: 0.01,
    ci_low: 0.06,
    ci_high: 0.1,
    n_treated_mkts: 8,
    n_control_mkts: 16,
  },
];

const balance = [
  { covariate: "pre_gmv_mean", treated_mean: 100, control_mean: 90, std_mean_diff: 0.38 },
];

describe("chart components", () => {
  it("EventStudyChart renders without throwing", () => {
    expect(() => render(<EventStudyChart data={eventData} />)).not.toThrow();
  });

  it("CohortAttChart renders without throwing", () => {
    expect(() =>
      render(<CohortAttChart data={cohortAtt} twfeAtt={0.14} twfeCi={[0.1, 0.18]} />),
    ).not.toThrow();
  });

  it("BalanceChart renders without throwing", () => {
    expect(() => render(<BalanceChart before={balance} after={balance} />)).not.toThrow();
  });
});
