import { render, screen } from "@testing-library/react";
import { BalanceTable } from "@/components/BalanceTable";

const before = [
  { covariate: "pre_gmv_mean", treated_mean: 100, control_mean: 90, std_mean_diff: 0.38 },
  { covariate: "pre_gmv_trend", treated_mean: 0.005, control_mean: 0.002, std_mean_diff: 1.1 },
];

const afterBalanced = [
  { covariate: "pre_gmv_mean", treated_mean: 100, matched_control_mean: 99, std_mean_diff: 0.05 },
  { covariate: "pre_gmv_trend", treated_mean: 0.005, matched_control_mean: 0.0048, std_mean_diff: 0.08 },
];

const afterUnbalanced = [
  { covariate: "pre_gmv_mean", treated_mean: 100, matched_control_mean: 92, std_mean_diff: 0.26 },
  { covariate: "pre_gmv_trend", treated_mean: 0.005, matched_control_mean: 0.0026, std_mean_diff: 1.03 },
];

describe("BalanceTable", () => {
  it("renders one row per covariate with before/after SMD values", () => {
    render(<BalanceTable before={before} after={afterBalanced} />);
    expect(screen.getByText("pre_gmv_mean")).toBeInTheDocument();
    expect(screen.getByText("pre_gmv_trend")).toBeInTheDocument();
    expect(screen.getByText("0.380")).toBeInTheDocument();
    expect(screen.getByText("0.050")).toBeInTheDocument();
  });

  it("marks a covariate as balanced when |SMD after| < 0.10", () => {
    render(<BalanceTable before={before} after={afterBalanced} />);
    const yesCells = screen.getAllByText("Yes");
    expect(yesCells.length).toBe(2);
  });

  it("marks a covariate as not balanced when |SMD after| >= 0.10", () => {
    render(<BalanceTable before={before} after={afterUnbalanced} />);
    const noCells = screen.getAllByText("No");
    expect(noCells.length).toBe(2);
  });
});
