import { describe, expect, it } from "vitest";
import { calculateBudgetSplit, calculateFinancials, savingsRateBand } from "../budget";

describe("calculateBudgetSplit", () => {
  it("splits net pay into the 50/15/15/20 Kenya-calibrated allocation", () => {
    const split = calculateBudgetSplit(100_000);
    expect(split.needs).toBe(50_000);
    expect(split.socialObligations).toBe(15_000);
    expect(split.wants).toBe(15_000);
    expect(split.savings).toBe(20_000);
  });
});

describe("savingsRateBand", () => {
  it("bands savings rate into green/amber/red", () => {
    expect(savingsRateBand(0.25)).toBe("green");
    expect(savingsRateBand(0.2)).toBe("amber");
    expect(savingsRateBand(0.15)).toBe("amber");
    expect(savingsRateBand(0.05)).toBe("red");
  });
});

describe("calculateFinancials", () => {
  it("derives net pay, budget split and a 20% savings rate by construction", () => {
    const result = calculateFinancials(50_000);
    expect(result.netMonthly).toBeCloseTo(39_029.15, 2);
    expect(result.savingsRate).toBeCloseTo(0.2, 10);
    expect(result.savingsCapacity).toBeCloseTo(result.netMonthly * 0.2, 6);
  });
});
