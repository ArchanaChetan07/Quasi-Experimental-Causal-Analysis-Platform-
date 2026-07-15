import { toneForPValue } from "@/components/StatusBadge";

describe("toneForPValue", () => {
  it("returns danger for highly significant p-values", () => {
    expect(toneForPValue(0.0001)).toBe("danger");
    expect(toneForPValue(0.009)).toBe("danger");
  });

  it("returns warn for marginally significant p-values", () => {
    expect(toneForPValue(0.011)).toBe("warn");
    expect(toneForPValue(0.049)).toBe("warn");
  });

  it("returns ok for non-significant p-values", () => {
    expect(toneForPValue(0.05)).toBe("ok");
    expect(toneForPValue(0.5)).toBe("ok");
    expect(toneForPValue(1)).toBe("ok");
  });
});
