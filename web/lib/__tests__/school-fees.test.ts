import { describe, expect, it } from "vitest";
import { mmfFeeSubsidy, termlyMonthlyTarget } from "../school-fees";

describe("termlyMonthlyTarget", () => {
  it("spreads the annual bill across 12 months per child", () => {
    expect(termlyMonthlyTarget(120_000, 1)).toBeCloseTo(10_000, 5);
    expect(termlyMonthlyTarget(100_000, 2)).toBeCloseTo(16_666.67, 1);
  });

  it("returns 0 for empty inputs", () => {
    expect(termlyMonthlyTarget(0, 2)).toBe(0);
    expect(termlyMonthlyTarget(100_000, 0)).toBe(0);
  });
});

describe("mmfFeeSubsidy", () => {
  it("computes one year of monthly-compounded interest on the contributions", () => {
    // m = 10,000/mo at 12%: FV = 10000 × ((1.01^12 − 1)/0.01) ≈ 126,825 → ~6,825 interest
    const subsidy = mmfFeeSubsidy(120_000, 1);
    expect(subsidy).toBeGreaterThan(6_500);
    expect(subsidy).toBeLessThan(7_200);
  });

  it("scales linearly with children", () => {
    expect(mmfFeeSubsidy(120_000, 2)).toBeCloseTo(mmfFeeSubsidy(120_000, 1) * 2, -1);
  });
});
