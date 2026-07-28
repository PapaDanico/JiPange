import { describe, expect, it } from "vitest";
import { calculateLoanAmortization, MAX_TERM_MONTHS } from "../loans";

describe("calculateLoanAmortization", () => {
  it("splits principal evenly with zero interest", () => {
    const result = calculateLoanAmortization({
      principal: 12_000,
      annualRate: 0,
      termMonths: 12,
    });
    expect(result.monthlyPayment).toBe(1_000);
    expect(result.totalInterest).toBe(0);
    expect(result.totalPaid).toBe(12_000);
    expect(result.schedule).toHaveLength(12);
    expect(result.schedule[11].remainingBalance).toBe(0);
  });

  it("matches the classic textbook EMI for Ksh 1,000 at 12% APR over 12 months", () => {
    const result = calculateLoanAmortization({
      principal: 1_000,
      annualRate: 0.12,
      termMonths: 12,
    });
    expect(result.monthlyPayment).toBeCloseTo(88.85, 1);
  });

  it("fully amortizes to zero balance regardless of rounding", () => {
    const result = calculateLoanAmortization({
      principal: 1_200_000,
      annualRate: 0.13,
      termMonths: 24,
    });
    expect(result.schedule).toHaveLength(24);
    expect(result.schedule[23].remainingBalance).toBe(0);

    const principalSum = result.schedule.reduce((sum, e) => sum + e.principalPaid, 0);
    expect(principalSum).toBeCloseTo(1_200_000, 1);

    expect(result.totalPaid - result.totalInterest).toBeCloseTo(1_200_000, 1);
  });

  it("handles a zero/negative principal or term gracefully", () => {
    expect(calculateLoanAmortization({ principal: 0, annualRate: 0.1, termMonths: 12 }).schedule).toEqual([]);
    expect(calculateLoanAmortization({ principal: 1000, annualRate: 0.1, termMonths: 0 }).schedule).toEqual([]);
  });
});

/**
 * A text box is an iteration count, and nobody thought of it that way.
 *
 * `termMonths` comes straight from "Repayment period (years)" and the schedule
 * loop pushes one object per month. An extra digit — 999999999999 instead of
 * 9 — asks for twelve trillion objects, and the tab locks solid: no error, no
 * result, nothing to cancel, force-quit the browser on a phone. Found by
 * driving every calculator with an implausible value and watching which ones
 * stopped answering.
 *
 * Three of twenty-five froze this way, two of them through this function.
 */
describe("a term nobody could repay", () => {
  it("refuses a schedule longer than fifty years", () => {
    const r = calculateLoanAmortization({ principal: 1_000_000, annualRate: 0.13, termMonths: MAX_TERM_MONTHS + 1 });
    expect(r.schedule).toHaveLength(0);
    expect(r.monthlyPayment).toBe(0);
  });

  it("still answers at the boundary", () => {
    // The mutation check: a function that refused everything would satisfy the
    // assertion above while quietly breaking every real loan.
    const r = calculateLoanAmortization({ principal: 1_000_000, annualRate: 0.13, termMonths: MAX_TERM_MONTHS });
    expect(r.schedule).toHaveLength(MAX_TERM_MONTHS);
    expect(r.monthlyPayment).toBeGreaterThan(0);
  });

  it("returns promptly on an absurd term instead of hanging", () => {
    // The actual symptom, asserted as time. Without the guard this does not
    // fail — it never finishes.
    const started = performance.now();
    const r = calculateLoanAmortization({ principal: 500_000, annualRate: 0.14, termMonths: 999_999_999_999 });
    expect(performance.now() - started).toBeLessThan(250);
    expect(r.schedule).toHaveLength(0);
  });

  it("leaves an ordinary Kenyan loan untouched", () => {
    const r = calculateLoanAmortization({ principal: 500_000, annualRate: 0.14, termMonths: 36 });
    expect(r.schedule).toHaveLength(36);
    expect(r.schedule.at(-1)!.remainingBalance).toBe(0);
  });
});
