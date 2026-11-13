import { describe, expect, it } from "vitest";
import { calculateQuotedLoanCost } from "../loan-quote";

describe("calculateQuotedLoanCost", () => {
  it("matches the effective annual rate of a zero-fee reducing balance loan", () => {
    const quote = calculateQuotedLoanCost({
      principal: 100_000, annualRate: 0.12, termMonths: 12,
      upfrontFee: 0, upfrontInsurance: 0,
    })!;
    expect(quote.netDisbursed).toBe(100_000);
    expect(quote.effectiveAnnualCost).toBeCloseTo(Math.pow(1.01, 12) - 1, 8);
  });

  it("captures origination and insurance fees in the effective borrowing cost", () => {
    const base = calculateQuotedLoanCost({
      principal: 100_000, annualRate: 0.12, termMonths: 12,
      upfrontFee: 0, upfrontInsurance: 0,
    })!;
    const charged = calculateQuotedLoanCost({
      principal: 100_000, annualRate: 0.12, termMonths: 12,
      upfrontFee: 3_000, upfrontInsurance: 2_000,
    })!;
    expect(charged.netDisbursed).toBe(95_000);
    expect(charged.monthlyPayment).toBe(base.monthlyPayment);
    expect(charged.totalBorrowingCost).toBeGreaterThan(base.totalBorrowingCost);
    expect(charged.effectiveAnnualCost).toBeGreaterThan(base.effectiveAnnualCost);
  });

  it("charges an effective borrowing cost even for a zero-interest loan with fees", () => {
    const result = calculateQuotedLoanCost({
      principal: 120_000, annualRate: 0, termMonths: 12,
      upfrontFee: 6_000, upfrontInsurance: 0,
    })!;
    expect(result.monthlyPayment).toBe(10_000);
    expect(result.totalBorrowingCost).toBe(6_000);
    expect(result.effectiveAnnualCost).toBeGreaterThan(0);
  });

  it("rejects negative fees, invalid principal, fractional terms and confiscatory deductions", () => {
    const valid = { principal: 100_000, annualRate: 0.1, termMonths: 12, upfrontFee: 0, upfrontInsurance: 0 };
    expect(calculateQuotedLoanCost({ ...valid, upfrontFee: -1 })).toBeNull();
    expect(calculateQuotedLoanCost({ ...valid, upfrontFee: 100_000 })).toBeNull();
    expect(calculateQuotedLoanCost({ ...valid, principal: Infinity })).toBeNull();
    expect(calculateQuotedLoanCost({ ...valid, termMonths: 12.5 })).toBeNull();
    expect(calculateQuotedLoanCost({ ...valid, annualRate: NaN })).toBeNull();
  });
});
