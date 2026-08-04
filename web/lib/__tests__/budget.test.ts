import { describe, expect, it } from "vitest";
import {
  calculate502525Split,
  calculateBudgetSplit,
  calculateFinancials,
  savingsRateBand,
} from "../budget";

describe("calculateBudgetSplit", () => {
  it("splits net pay into the 50/15/15/20 Kenya-calibrated allocation", () => {
    const split = calculateBudgetSplit(100_000);
    expect(split.needs).toBe(50_000);
    expect(split.socialObligations).toBe(15_000);
    expect(split.wants).toBe(15_000);
    expect(split.savings).toBe(20_000);
  });
});

describe("calculate502525Split", () => {
  it("splits net pay into the 50/25/25 household/savings/investments allocation", () => {
    const split = calculate502525Split(100_000);
    expect(split.household).toBe(50_000);
    expect(split.savingsEmergency).toBe(25_000);
    expect(split.investments).toBe(25_000);
  });

  it("adds up to the full net amount", () => {
    const split = calculate502525Split(83_450);
    expect(split.household + split.savingsEmergency + split.investments).toBeCloseTo(83_450, 6);
  });
});

/**
 * The band must be decided by the rate, not by floating-point representation.
 *
 * The suite below passes clean literals — 0.25, 0.2, 0.15, 0.05 — and was green
 * throughout. Production does not pass literals. calculateFinancials computes
 * `netMonthly * 0.2 / netMonthly`, which is exactly 0.2 at a Ksh 50,000 salary
 * and 0.20000000000000004 at Ksh 120,000. Against a bare `> 0.2` the first is
 * amber and the second green, so two users on an identical 20% rate saw
 * different colours and nothing in the app could explain why.
 *
 * This drives the REAL function with REAL salaries, which is the only way the
 * defect was ever going to surface.
 */
describe("the band survives the arithmetic that feeds it", () => {
  const SALARIES = [20_000, 50_000, 75_000, 120_000, 300_000, 1_000_000];

  it("gives every salary on the same allocation the same band", () => {
    const bands = SALARIES.map((g) => savingsRateBand(calculateFinancials(g).savingsRate));
    expect(
      new Set(bands).size,
      `identical 20% rates banded differently across salaries: ${SALARIES.map(
        (g, i) => `${g}:${bands[i]}`
      ).join(", ")}`
    ).toBe(1);
  });

  it("does not depend on which side of 0.2 the float lands", () => {
    /* The two values production actually produces, asserted directly. */
    expect(savingsRateBand(0.2)).toBe(savingsRateBand(0.20000000000000004));
  });

  it("still separates genuinely different rates", () => {
    /* The epsilon must not have flattened the bands into one answer — that
     * would "fix" the inconsistency by making the function useless. */
    expect(savingsRateBand(0.35)).toBe("green");
    expect(savingsRateBand(0.12)).toBe("amber");
    expect(savingsRateBand(0.02)).toBe("red");
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
