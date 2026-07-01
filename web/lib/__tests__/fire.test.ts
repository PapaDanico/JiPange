import { describe, expect, it } from "vitest";
import { calculateFireNumber, calculateYearsToFire } from "../fire";
import { futureValue, SAFE_WITHDRAWAL_RATE } from "../projections";

describe("calculateFireNumber", () => {
  it("divides annual expenses by the safe withdrawal rate", () => {
    expect(calculateFireNumber(600_000, 0.04)).toBe(15_000_000);
  });

  it("defaults to the shared SAFE_WITHDRAWAL_RATE constant", () => {
    expect(calculateFireNumber(600_000)).toBeCloseTo(600_000 / SAFE_WITHDRAWAL_RATE, 6);
  });
});

describe("calculateYearsToFire", () => {
  it("round-trips against futureValue for a positive rate", () => {
    const fireNumber = futureValue(0, 10_000, 0.1, 20);
    const years = calculateYearsToFire({
      fireNumber,
      monthlyContribution: 10_000,
      annualReturnRate: 0.1,
    });
    expect(years).toBeCloseTo(20, 3);
  });

  it("returns 0 when already at or past the FIRE number", () => {
    expect(
      calculateYearsToFire({
        fireNumber: 10_000_000,
        currentSavings: 12_000_000,
        monthlyContribution: 0,
        annualReturnRate: 0.08,
      })
    ).toBe(0);
  });

  it("handles a 0% return rate as simple division", () => {
    const years = calculateYearsToFire({
      fireNumber: 1_200_000,
      monthlyContribution: 10_000,
      annualReturnRate: 0,
    });
    expect(years).toBeCloseTo(10, 6);
  });

  it("returns Infinity when there is no contribution and the goal isn't met", () => {
    expect(
      calculateYearsToFire({
        fireNumber: 10_000_000,
        currentSavings: 0,
        monthlyContribution: 0,
        annualReturnRate: 0.08,
      })
    ).toBe(Infinity);
  });
});
