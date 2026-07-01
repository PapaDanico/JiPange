import { describe, expect, it } from "vitest";
import { solveMonthlyContribution } from "../savings-goal";
import { futureValue } from "../projections";

describe("solveMonthlyContribution", () => {
  it("handles a 0% rate as simple division", () => {
    const pmt = solveMonthlyContribution({
      targetFutureValue: 100_000,
      annualRate: 0,
      years: 1,
    });
    expect(pmt).toBeCloseTo(8_333.33, 1);
  });

  it("round-trips against futureValue for a positive rate", () => {
    const target = futureValue(0, 1_000, 0.12, 1);
    const pmt = solveMonthlyContribution({
      targetFutureValue: target,
      annualRate: 0.12,
      years: 1,
    });
    expect(pmt).toBeCloseTo(1_000, 6);
  });

  it("accounts for an existing present value", () => {
    const target = futureValue(50_000, 500, 0.1, 5);
    const pmt = solveMonthlyContribution({
      targetFutureValue: target,
      presentValue: 50_000,
      annualRate: 0.1,
      years: 5,
    });
    expect(pmt).toBeCloseTo(500, 6);
  });

  it("returns 0 when the target is already met", () => {
    expect(
      solveMonthlyContribution({
        targetFutureValue: 10_000,
        presentValue: 50_000,
        annualRate: 0.08,
        years: 3,
      })
    ).toBe(0);
  });

  it("returns Infinity when there is no time left to save", () => {
    expect(
      solveMonthlyContribution({
        targetFutureValue: 100_000,
        annualRate: 0.1,
        years: 0,
      })
    ).toBe(Infinity);
  });
});
