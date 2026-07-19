import { calculateLoanAmortization } from "./loans";
import { round2 } from "./money";
import { SACCO_MONTHLY_RATE } from "./loan-comparison";

/** ~1.083% per day — Safaricom's Fuliza rates change periodically; verify the current rate in-app. */
export const FULIZA_DAILY_RATE = 0.01083;

export interface FulizaCost {
  dailyFee: number;
  totalFee: number;
  totalRepaid: number;
  percentOfPrincipal: number;
  annualisedApr: number;
  saccoComparisonTotalRepaid: number;
}

/** Cost of borrowing `principal` on Fuliza for `days`, plus a same-amount 30-day SACCO comparison. */
export function calculateFulizaCost(principal: number, days: number): FulizaCost {
  if (principal <= 0 || days <= 0) {
    return {
      dailyFee: 0,
      totalFee: 0,
      totalRepaid: 0,
      percentOfPrincipal: 0,
      annualisedApr: Math.pow(1 + FULIZA_DAILY_RATE, 365) - 1,
      saccoComparisonTotalRepaid: 0,
    };
  }

  const dailyFee = round2(principal * FULIZA_DAILY_RATE);
  const totalFee = round2(dailyFee * days);
  const totalRepaid = round2(principal + totalFee);
  const percentOfPrincipal = round2((totalFee / principal) * 100);

  const saccoEquivalent = calculateLoanAmortization({
    principal,
    annualRate: SACCO_MONTHLY_RATE * 12,
    termMonths: 1,
  });

  return {
    dailyFee,
    totalFee,
    totalRepaid,
    percentOfPrincipal,
    annualisedApr: Math.pow(1 + FULIZA_DAILY_RATE, 365) - 1,
    saccoComparisonTotalRepaid: saccoEquivalent.totalPaid,
  };
}
