import { describe, expect, it } from "vitest";
import {
  buildRetirementComparison,
  futureValue,
  inflationAdjust,
  projectWealthAtRetirement,
} from "../projections";

describe("futureValue", () => {
  it("handles a 0% rate as simple linear accumulation", () => {
    expect(futureValue(1_000, 100, 0, 2)).toBe(3_400); // 1000 + 100*24
  });

  it("returns the present value unchanged for zero or negative years", () => {
    expect(futureValue(5_000, 100, 0.1, 0)).toBe(5_000);
    expect(futureValue(5_000, 100, 0.1, -1)).toBe(5_000);
  });

  it("compounds monthly contributions at a positive rate", () => {
    // PV=0, PMT=1000/mo, 12% annual (1%/mo), 1 year
    const result = futureValue(0, 1_000, 0.12, 1);
    const growth = Math.pow(1.01, 12);
    const expected = 1_000 * ((growth - 1) / 0.01);
    expect(result).toBeCloseTo(expected, 6);
    expect(result).toBeCloseTo(12_682.5, 1);
  });
});

describe("inflationAdjust", () => {
  it("leaves value unchanged when years is 0", () => {
    expect(inflationAdjust(100_000, 0)).toBe(100_000);
  });

  it("discounts nominal value by the compounded inflation rate", () => {
    expect(inflationAdjust(1_000, 1, 0.1)).toBeCloseTo(909.09, 2);
  });
});

describe("projectWealthAtRetirement", () => {
  it("projects zero years when already at retirement age", () => {
    const result = projectWealthAtRetirement({
      currentAge: 60,
      monthlyContribution: 5_000,
      annualReturnRate: 0.1,
      currentSavings: 200_000,
      retirementAge: 60,
    });
    expect(result.nominalWealth).toBe(200_000);
    expect(result.inflationAdjustedWealth).toBe(200_000);
  });
});

describe("buildRetirementComparison", () => {
  it("shows zero current-trajectory wealth when starting from nothing", () => {
    const comparison = buildRetirementComparison({
      currentAge: 30,
      netMonthlyIncome: 50_000,
    });
    expect(comparison.currentTrajectory.nominalWealth).toBe(0);
    expect(comparison.yearsToRetirement).toBe(30);
  });

  it("projects meaningfully more wealth with a 20%-savings plan at 10% return", () => {
    const comparison = buildRetirementComparison({
      currentAge: 30,
      netMonthlyIncome: 50_000,
    });
    expect(comparison.withPlan.monthlySavings).toBe(10_000);
    expect(comparison.withPlan.nominalWealth).toBeGreaterThan(
      comparison.currentTrajectory.nominalWealth
    );
    // Sanity bound: 30 years of 10k/mo at 10% should be in the tens of millions of KES.
    expect(comparison.withPlan.nominalWealth).toBeGreaterThan(10_000_000);
  });
});
