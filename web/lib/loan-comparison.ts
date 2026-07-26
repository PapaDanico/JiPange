import { calculateLoanAmortization } from "./loans";
import { round2 } from "./money";
import { FULIZA_APR, FULIZA_DAILY_RATE } from "./fuliza";

export type LoanProductTier = "green" | "amber" | "red";

export interface LoanProductComparison {
  name: string;
  /** Null for short-term facility-fee products that don't amortize monthly (Fuliza, M-Shwari). */
  monthlyPayment: number | null;
  totalRepaid: number;
  totalInterest: number;
  /** Annualised true APR as a decimal (e.g. 0.12 for 12%). Estimated for mobile lenders. */
  apr: number;
  tier: LoanProductTier;
  estimated: boolean;
}

export const SACCO_MONTHLY_RATE = 0.01; // 1% per month, reducing balance
const BANK_ANNUAL_RATE = 0.15; // ~15% p.a., reducing balance
const MOBILE_LENDER_MONTHLY_FLAT_RATE = 0.15; // Tala/Branch-style: ~15% per month, flat (not reducing)
const MSHWARI_FACILITY_FEE_PER_CYCLE = 0.075; // 7.5% per 30-day cycle — Safaricom rates change; verify in-app

/**
 * Compares a SACCO loan, a bank personal loan, a mobile-lender-style flat-rate
 * loan, and Fuliza/M-Shwari facility fees for the same principal and term.
 * Fuliza and M-Shwari are short-term products, not monthly-amortizing loans —
 * their rows are scaled to the same term for rough comparability only.
 */
export function compareLoanProducts(principal: number, termMonths: number): LoanProductComparison[] {
  if (principal <= 0 || termMonths <= 0) return [];

  const sacco = calculateLoanAmortization({
    principal,
    annualRate: SACCO_MONTHLY_RATE * 12,
    termMonths,
  });

  const bank = calculateLoanAmortization({
    principal,
    annualRate: BANK_ANNUAL_RATE,
    termMonths,
  });

  const mobileTotalInterest = round2(principal * MOBILE_LENDER_MONTHLY_FLAT_RATE * termMonths);
  const mobileTotalRepaid = round2(principal + mobileTotalInterest);

  const termDays = termMonths * 30;
  const fulizaTotalInterest = round2(principal * FULIZA_DAILY_RATE * termDays);
  const fulizaTotalRepaid = round2(principal + fulizaTotalInterest);

  const mshwariTotalInterest = round2(principal * MSHWARI_FACILITY_FEE_PER_CYCLE * termMonths);
  const mshwariTotalRepaid = round2(principal + mshwariTotalInterest);

  return [
    {
      name: "SACCO loan (1% pm reducing)",
      monthlyPayment: sacco.monthlyPayment,
      totalRepaid: sacco.totalPaid,
      totalInterest: sacco.totalInterest,
      apr: Math.pow(1 + SACCO_MONTHLY_RATE, 12) - 1,
      tier: "green",
      estimated: false,
    },
    {
      name: "Bank personal loan (~15% p.a.)",
      monthlyPayment: bank.monthlyPayment,
      totalRepaid: bank.totalPaid,
      totalInterest: bank.totalInterest,
      apr: BANK_ANNUAL_RATE,
      tier: "amber",
      estimated: true,
    },
    {
      name: "Digital lender (Tala/Branch-style, ~15% pm flat)",
      monthlyPayment: round2(mobileTotalRepaid / termMonths),
      totalRepaid: mobileTotalRepaid,
      totalInterest: mobileTotalInterest,
      // Reducing-balance equivalent of a flat-rate loan: 2·n·r_flat·12/(n+1)
      apr: (2 * termMonths * MOBILE_LENDER_MONTHLY_FLAT_RATE * 12) / (termMonths + 1),
      tier: "red",
      estimated: true,
    },
    {
      name: "Fuliza (1.083% per day)",
      monthlyPayment: null,
      totalRepaid: fulizaTotalRepaid,
      totalInterest: fulizaTotalInterest,
      // Simple annualisation, matching this row's totalInterest (which is
      // computed on the non-compounding daily fee just above). The compounded
      // figure used to sit here, so the table showed a 30-day repayment of
      // 1.32x principal beside an APR of 4,999% that could not produce it.
      apr: FULIZA_APR,
      tier: "red",
      estimated: true,
    },
    {
      name: "M-Shwari (7.5% facility fee)",
      monthlyPayment: null,
      totalRepaid: mshwariTotalRepaid,
      totalInterest: mshwariTotalInterest,
      apr: Math.pow(1 + MSHWARI_FACILITY_FEE_PER_CYCLE, 12) - 1,
      tier: "red",
      estimated: true,
    },
  ];
}
