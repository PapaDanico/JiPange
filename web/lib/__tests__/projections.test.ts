import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  futureValueWithStepUp,
  buildRetirementComparison,
  futureValue,
  inflateToFutureCost,
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

describe("inflateToFutureCost", () => {
  it("leaves value unchanged when years is 0", () => {
    expect(inflateToFutureCost(100_000, 0)).toBe(100_000);
  });

  it("is the exact inverse of inflationAdjust", () => {
    const future = inflateToFutureCost(150_000, 20, 0.065);
    expect(inflationAdjust(future, 20, 0.065)).toBeCloseTo(150_000, 6);
  });

  it("grows the value at Kenya's default 6.5% inflation rate", () => {
    expect(inflateToFutureCost(1_000, 1)).toBeCloseTo(1_065, 2);
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
    expect(comparison!.currentTrajectory.nominalWealth).toBe(0);
    expect(comparison!.yearsToRetirement).toBe(30);
  });

  it("projects meaningfully more wealth with a 20%-savings plan at 10% return", () => {
    const comparison = buildRetirementComparison({
      currentAge: 30,
      netMonthlyIncome: 50_000,
    });
    expect(comparison!.withPlan.monthlySavings).toBe(10_000);
    expect(comparison!.withPlan.nominalWealth).toBeGreaterThan(
      comparison!.currentTrajectory.nominalWealth
    );
    // Sanity bound: 30 years of 10k/mo at 10% should be in the tens of millions of KES.
    expect(comparison!.withPlan.nominalWealth).toBeGreaterThan(10_000_000);
  });
});

describe("futureValueWithStepUp", () => {
  it("equals plain futureValue when step-up is zero", () => {
    const { total } = futureValueWithStepUp(100_000, 10_000, 0.1, 10, 0);
    expect(total).toBeCloseTo(futureValue(100_000, 10_000, 0.1, 10), 6);
  });

  it("grows contributions annually and counts them correctly", () => {
    const { total, totalContributed } = futureValueWithStepUp(0, 10_000, 0, 3, 0.1);
    // 120k + 132k + 145.2k contributed, zero return
    expect(totalContributed).toBeCloseTo(397_200, 0);
    expect(total).toBeCloseTo(397_200, 0);
  });

  it("handles fractional years", () => {
    const { total } = futureValueWithStepUp(0, 10_000, 0, 1.5, 0.1);
    expect(total).toBeCloseTo(120_000 + 11_000 * 6, 0);
  });
});

/**
 * A projection built on an unusable age must be refused, not printed.
 *
 * lib/storage.ts reads the stored profile with `JSON.parse(raw) as T` — a cast,
 * not a validation — so a profile written by an older schema, or by onboarding
 * that did not finish, arrives here with `age` undefined. Every figure
 * downstream then becomes NaN.
 *
 * It reached paper. The printed "My Pesa Picture" carried:
 *
 *     Current trajectory   Ksh 0
 *     With a plan          Ksh 0
 *     Assumes a 20% savings rate at 10% annual return over NaN years.
 *
 * A report is the artefact someone keeps, shows a spouse and takes to a SACCO.
 * NaN in it is worse than an absent card, because an absent card is obviously
 * missing and NaN looks like a computed result.
 */
describe("a retirement comparison refuses an age it cannot use", () => {
  const ok = { netMonthlyIncome: 83_511, withPlanSavingsRate: 0.2 };

  it("returns null rather than NaN for a missing age", () => {
    expect(
      buildRetirementComparison({ ...ok, currentAge: undefined as unknown as number })
    ).toBeNull();
  });

  it("returns null for NaN and Infinity, which a nullish default would let through", () => {
    /* `undefined ?? 60` is 60, but `NaN ?? 60` is NaN — so a nullish default
     * cannot fix this and Number.isFinite is the right test. */
    expect(buildRetirementComparison({ ...ok, currentAge: NaN })).toBeNull();
    expect(buildRetirementComparison({ ...ok, currentAge: Infinity })).toBeNull();
  });

  it("refuses an unusable income too, for the same reason", () => {
    expect(
      buildRetirementComparison({
        currentAge: 30,
        netMonthlyIncome: undefined as unknown as number,
        withPlanSavingsRate: 0.2,
      })
    ).toBeNull();
  });

  it("still answers normally for a real profile", () => {
    const c = buildRetirementComparison({ ...ok, currentAge: 30 });
    expect(c).not.toBeNull();
    expect(Number.isFinite(c!.yearsToRetirement)).toBe(true);
    expect(c!.yearsToRetirement).toBeGreaterThan(0);
    expect(Number.isFinite(c!.withPlan.nominalWealth)).toBe(true);
    expect(c!.withPlan.nominalWealth).toBeGreaterThan(0);
  });

  it("the report omits the card rather than blanking the page", () => {
    /* The whole-page guard must not include `retirement`: take-home pay, the
     * budget split and savings capacity are all still computable without an
     * age, and one missing input should cost one card, not the document. */
    const src = readFileSync("components/onboarding/MoneyPicture.tsx", "utf8");
    const guard = src.slice(src.indexOf("if (!profile"), src.indexOf("if (!profile") + 120);
    expect(guard, "the page still blanks itself when the age is missing").not.toMatch(
      /!retirement/
    );
    expect(src, "the wealth card is not conditional").toMatch(/\{retirement && \(/);
  });
});
