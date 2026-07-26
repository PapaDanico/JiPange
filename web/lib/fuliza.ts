import { calculateLoanAmortization } from "./loans";
import { round2 } from "./money";
import { SACCO_MONTHLY_RATE } from "./loan-comparison";

/** ~1.083% per day — Safaricom's Fuliza rates change periodically; verify the current rate in-app. */
export const FULIZA_DAILY_RATE = 0.01083;

/**
 * WHICH ANNUALISATION, AND WHY IT MATTERS
 * ---------------------------------------
 * This module used to report a single `annualisedApr` of
 * `(1 + 0.01083)^365 − 1` — about 4,999% — while the tool's own headline card
 * said "~400%". Both numbers were on one screen, twelve times apart, and the
 * calculator's share message broadcast the larger one to WhatsApp.
 *
 * They are answers to different questions, and only one of them is an APR:
 *
 *   - `annualisedApr` (simple, ~395%) is the periodic rate times the number of
 *     periods in a year. It is the standard APR disclosure, and it is the
 *     correct one for Fuliza because the daily fee is a maintenance charge on
 *     the outstanding balance — it does not capitalise, so tomorrow's fee is
 *     not charged on today's fee.
 *   - `rolledAnnualCost` (compounded, ~4,999%) answers "what if I never
 *     cleared it and the fees kept accruing on the growing balance for a year".
 *     It is a real and alarming figure, but calling it the APR overstates the
 *     product's contractual cost, and an overstatement is still an inaccuracy
 *     even when it points at something genuinely expensive.
 *
 * Both are returned, separately named, so a caller has to choose deliberately.
 */

export interface FulizaCost {
  dailyFee: number;
  totalFee: number;
  totalRepaid: number;
  percentOfPrincipal: number;
  /** Simple annualisation: daily rate x 365. The standard APR disclosure. */
  annualisedApr: number;
  /** Compounded over a year if the balance is never cleared. NOT an APR. */
  rolledAnnualCost: number;
  saccoComparisonTotalRepaid: number;
}

/** Simple (nominal) APR — the daily maintenance fee does not capitalise. */
export const FULIZA_APR = FULIZA_DAILY_RATE * 365;

/** What a year of never clearing the balance would cost, if fees did compound. */
export const FULIZA_ROLLED_ANNUAL_COST = Math.pow(1 + FULIZA_DAILY_RATE, 365) - 1;

/** Cost of borrowing `principal` on Fuliza for `days`, plus a same-amount 30-day SACCO comparison. */
export function calculateFulizaCost(principal: number, days: number): FulizaCost {
  if (principal <= 0 || days <= 0) {
    return {
      dailyFee: 0,
      totalFee: 0,
      totalRepaid: 0,
      percentOfPrincipal: 0,
      annualisedApr: FULIZA_APR,
      rolledAnnualCost: FULIZA_ROLLED_ANNUAL_COST,
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
    annualisedApr: FULIZA_APR,
    rolledAnnualCost: FULIZA_ROLLED_ANNUAL_COST,
    saccoComparisonTotalRepaid: saccoEquivalent.totalPaid,
  };
}
