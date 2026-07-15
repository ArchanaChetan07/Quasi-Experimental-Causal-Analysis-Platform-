/**
 * @jest-environment node
 */
import { getResults } from "@/lib/data";

describe("getResults", () => {
  it("loads and caches the results bundle", () => {
    const first = getResults();
    const second = getResults();
    expect(first).toBe(second); // same object reference => cached
    expect(first.cohortAtt.length).toBe(3);
    expect(first.eventStudy.pooled.length).toBeGreaterThan(0);
  });

  it("has internally consistent implied percent effects", () => {
    const { summary } = getResults();
    const expectedImplied = (Math.exp(summary.twfe.att) - 1) * 100;
    expect(summary.twfe.impliedPct).toBeCloseTo(expectedImplied, 1);
  });
});
