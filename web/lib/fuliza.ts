import { calculateLoanAmortization } from "./loans";
import { round2 } from "./money";
import { SACCO_MONTHLY_RATE } from "./loan-comparison";

/**
 * Fuliza costs what Safaricom actually charges, not a flat percentage.
 *
 * This module used to model Fuliza as 1.083% of the principal per day, every
 * day, from day one. Fuliza does not work that way and never has under the
 * current tariff:
 *
 *   - the daily maintenance fee is a FLAT SHILLING AMOUNT set by the size of
 *     the outstanding balance, not a percentage of it;
 *   - balances of Ksh 1,000 or less get THREE FREE DAYS. Repay inside them and
 *     you owe only the access fee;
 *   - there is a one-off 1% access fee the old model omitted entirely;
 *   - 20% excise duty applies to the access fee and to each daily fee.
 *
 * The old model overstated the cost roughly two- to three-fold across most of
 * the range. Ksh 1,000 for a week came out at Ksh 76 against a real Ksh 36.
 *
 * WHY THAT MATTERED MORE THAN THE ARITHMETIC
 *
 * Overstating a predatory product feels safe. It is not. Seventeen million
 * Kenyans use Fuliza, and a reader who checks this tool against their own
 * M-PESA statement finds it wrong by a factor of two — at which point the tool
 * has taught them to distrust the one number on the page that was always
 * right, that this is expensive credit. Being alarmist and being accurate are
 * not the same thing, and only one of them survives contact with a statement.
 *
 * And the flat-percentage model hid the product's actual shape. Because the
 * fee is a fixed sum per band, Fuliza is REGRESSIVE: borrow Ksh 150 and the
 * annualised cost is around 730%; borrow Ksh 10,000 and it is nearer 110%. The
 * smallest borrowers pay by far the most. A single "~400%" concealed that
 * completely — and the small borrower is who this tool is for.
 *
 * Tariff corroborated across Safaricom's own restructure announcement, NCBA's
 * Fuliza key-facts material and two independent trackers. If the bands move,
 * they move HERE, and the tests below will say what changed.
 */

/** One-off, charged on the amount drawn. */
export const FULIZA_ACCESS_FEE_RATE = 0.01;

/** Excise duty on the access fee and on every daily maintenance fee. */
export const FULIZA_EXCISE_RATE = 0.2;

/**
 * The largest Fuliza overdraft available.
 *
 * Worth exporting rather than leaving implicit in the top band: the loan
 * comparison table was offering Fuliza as an option on a Ksh 200,000 loan,
 * where the flat Ksh 25-a-day fee made it look CHEAPER than a SACCO. It is not
 * cheaper; it is unavailable. A facility you cannot draw is not a competitive
 * quote, and the flat-percentage model could never have shown that because it
 * scaled forever.
 */
export const FULIZA_MAX_LIMIT = 70_000;

/** Balances at or below this get FREE_DAYS before any daily fee applies. */
export const FULIZA_GRACE_BALANCE_CEILING = 1_000;
export const FULIZA_FREE_DAYS = 3;

/** Daily maintenance fee by outstanding balance, BEFORE excise duty. */
export const FULIZA_DAILY_FEE_BANDS: ReadonlyArray<{ upTo: number; fee: number }> = [
  { upTo: 100, fee: 0 },
  { upTo: 500, fee: 2.5 },
  { upTo: 1_000, fee: 5 },
  { upTo: 1_500, fee: 18 },
  { upTo: 2_500, fee: 20 },
  { upTo: 70_000, fee: 25 },
];

/** The daily maintenance fee for a balance, excise included. */
export function fulizaDailyFee(balance: number): number {
  if (balance <= 0) return 0;
  const band =
    FULIZA_DAILY_FEE_BANDS.find((b) => balance <= b.upTo) ??
    FULIZA_DAILY_FEE_BANDS[FULIZA_DAILY_FEE_BANDS.length - 1];
  return round2(band.fee * (1 + FULIZA_EXCISE_RATE));
}

/** The one-off access fee, excise included. */
export function fulizaAccessFee(principal: number): number {
  if (principal <= 0) return 0;
  return round2(principal * FULIZA_ACCESS_FEE_RATE * (1 + FULIZA_EXCISE_RATE));
}

/** Days on which a maintenance fee is actually charged. */
export function fulizaChargeableDays(principal: number, days: number): number {
  if (days <= 0) return 0;
  const free = principal <= FULIZA_GRACE_BALANCE_CEILING ? FULIZA_FREE_DAYS : 0;
  return Math.max(0, days - free);
}

export interface FulizaCost {
  /** Maintenance fee per chargeable day, excise included. */
  dailyFee: number;
  /** One-off access fee, excise included. */
  accessFee: number;
  /** Days on which a maintenance fee is charged (grace already deducted). */
  chargeableDays: number;
  totalFee: number;
  totalRepaid: number;
  percentOfPrincipal: number;
  /** Simple annualisation of THIS borrowing's cost. Band-dependent. */
  annualisedApr: number;
  saccoComparisonTotalRepaid: number;
}

/**
 * Cost of borrowing `principal` on Fuliza for `days`.
 *
 * The APR is computed for the amount actually borrowed rather than quoted as
 * one headline, because on a flat-fee-per-band tariff there is no single APR —
 * it falls as the principal rises, steeply.
 */
export function calculateFulizaCost(principal: number, days: number): FulizaCost {
  if (principal <= 0 || days <= 0) {
    return {
      dailyFee: 0,
      accessFee: 0,
      chargeableDays: 0,
      totalFee: 0,
      totalRepaid: 0,
      percentOfPrincipal: 0,
      annualisedApr: 0,
      saccoComparisonTotalRepaid: 0,
    };
  }

  const dailyFee = fulizaDailyFee(principal);
  const accessFee = fulizaAccessFee(principal);
  const chargeableDays = fulizaChargeableDays(principal, days);
  const totalFee = round2(accessFee + dailyFee * chargeableDays);
  const totalRepaid = round2(principal + totalFee);
  const percentOfPrincipal = round2((totalFee / principal) * 100);

  /* Annualised on the maintenance fee alone. The access fee is a one-off and
   * annualising it would make a one-day borrowing look like a 438% product on
   * the strength of a charge that is never repeated. */
  const annualisedApr = round2(((dailyFee * 365) / principal) * 100);

  const saccoEquivalent = calculateLoanAmortization({
    principal,
    annualRate: SACCO_MONTHLY_RATE * 12,
    termMonths: 1,
  });

  return {
    dailyFee,
    accessFee,
    chargeableDays,
    totalFee,
    totalRepaid,
    percentOfPrincipal,
    annualisedApr,
    saccoComparisonTotalRepaid: saccoEquivalent.totalPaid,
  };
}
