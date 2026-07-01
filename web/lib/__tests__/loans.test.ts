import { describe, expect, it } from "vitest";
import { calculateLoanAmortization } from "../loans";

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

  it("matches the classic textbook EMI for KES 1,000 at 12% APR over 12 months", () => {
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
