import { MAX_AMOUNT, round2 } from "./money";

/**
 * Compare an actual amortising loan quotation using borrower cash flows.
 * Rates are nominal annual reducing-balance rates; the derived effective cost
 * includes upfront deductions and periodic instalments.
 *
 * The borrower receives principal minus fees/insurance withheld upfront.
 * Mandatory refundable SACCO shares and uncertain future charges are NOT
 * equivalent to fees and must be modelled separately, not guessed here.
 */
export interface LoanQuote {
  principal: number;
  annualRate: number;
  termMonths: number;
  upfrontFee: number;
  upfrontInsurance: number;
}

export interface LoanQuoteCost {
  netDisbursed: number;
  monthlyPayment: number;
  totalPayments: number;
  totalBorrowingCost: number;
  effectiveAnnualCost: number;
}

/** Stable bisection on the present value of monthly repayments. */
export function calculateQuotedLoanCost(quote: LoanQuote): LoanQuoteCost | null {
  const { principal, annualRate, termMonths, upfrontFee, upfrontInsurance } = quote;
  if (
    [principal, annualRate, upfrontFee, upfrontInsurance].some((n) => !Number.isFinite(n)) ||
    principal <= 0 || principal > MAX_AMOUNT ||
    annualRate < 0 || annualRate > 100 ||
    !Number.isSafeInteger(termMonths) || termMonths < 1 || termMonths > 600 ||
    upfrontFee < 0 || upfrontInsurance < 0 ||
    upfrontFee + upfrontInsurance >= principal
  ) return null;
  const netDisbursed = round2(principal - upfrontFee - upfrontInsurance);
  const monthlyRate = annualRate / 12;
  const payment = monthlyRate === 0
    ? principal / termMonths
    : principal * monthlyRate / (1 - Math.pow(1 + monthlyRate, -termMonths));
  if (!Number.isFinite(payment) || payment <= 0) return null;
  const monthlyPayment = round2(payment);
  // The last instalment may differ slightly from the rounded payment.
  // Compute the effective cost against the unrounded contractual annuity.
  const pv = (rate: number) =>
    rate === 0
      ? payment * termMonths
      : payment * (-Math.expm1(-termMonths * Math.log1p(rate))) / rate;
  let lo = 0;
  let hi = 1;
  while (pv(hi) > netDisbursed && hi < 1e8) hi *= 2;
  if (pv(hi) > netDisbursed) return null;
  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2;
    if (pv(mid) > netDisbursed) lo = mid;
    else hi = mid;
  }
  const effectiveAnnualCost = Math.expm1(12 * Math.log1p((lo + hi) / 2));
  const totalPayments = round2(payment * termMonths);
  const totalBorrowingCost = round2(totalPayments - netDisbursed);
  if (![effectiveAnnualCost, totalPayments, totalBorrowingCost].every(Number.isFinite)) return null;
  return { netDisbursed, monthlyPayment, totalPayments, totalBorrowingCost, effectiveAnnualCost };
}
