import { tbillRate } from "./rates-feed";
import { assumedMmfYield, MMF_SPREAD_OVER_TBILL_PCT } from "./mmf-assumption";

/**
 * Money market fund or Treasury bill — and how much the answer is worth.
 *
 * The obvious version of this comparison prints two net yields and declares a
 * winner. On today's figures that would say the MMF wins by 31 basis points,
 * and it would be an irresponsible thing to publish, because:
 *
 *     assumed MMF gross      10.30%   = 91-day bill + 1.00 assumed spread
 *     364-day bill gross      9.94%
 *     gap between the bills   0.63pp  (91-day 9.30 -> 364-day 9.94)
 *
 * The verdict rests entirely on a spread this project ASSUMES. That assumption
 * is worth 1.00pp; the answer it produces is worth 0.31pp. Move the assumption
 * by two thirds of itself and the winner changes. A confident ranking built on
 * that is a number pretending to be a fact.
 *
 * So this returns the comparison AND the assumption's leverage over it, and the
 * card says plainly when the two are too close to separate on yield. Which they
 * are today — and that is genuinely useful, because it moves the decision to
 * the things that are actually known: the lock-up and the minimum.
 *
 * WHAT IS ACTUALLY CERTAIN
 * ------------------------
 * Below the bill's minimum there is no comparison to make. A Treasury bill
 * cannot be bought for less than Ksh 100,000, so under that figure the MMF is
 * not the better option — it is the only one. That fact needs no assumption and
 * is the single most useful thing to tell most readers.
 */

/** Withholding tax on interest, both instruments. Kenya, Income Tax Act. */
export const WHT_ON_INTEREST = 0.15;

/**
 * How far the assumed spread can move before the ranking flips.
 * Below this, the comparison is decided by an assumption rather than by data.
 */
export const SPREAD_CONFIDENCE_PP = 0.35;

export interface Comparison {
  /** Net of withholding tax, in percent. */
  mmfNetPct: number;
  billNetPct: number;
  billGrossPct: number;
  billTenorDays: number;
  billMinimumKES: number;
  /** mmfNet - billNet, in percentage points. Positive means the MMF is ahead. */
  edgePp: number;
  /**
   * The spread this comparison assumed, and the spread at which the two would
   * tie. The distance between them is how much the verdict is worth.
   */
  assumedSpreadPp: number;
  breakEvenSpreadPp: number;
  /** True when the edge is smaller than the assumption is reliable to. */
  tooCloseToCall: boolean;
}

export function compareAt(tenorDays: number): Comparison | null {
  const bill = tbillRate(tenorDays);
  const anchor = tbillRate(91);
  if (!bill || !anchor) return null;

  const mmfGrossPct = assumedMmfYield() * 100;
  const mmfNetPct = mmfGrossPct * (1 - WHT_ON_INTEREST);
  const billNetPct = bill.netEAY;

  /* The spread at which the two instruments tie.
   *
   * MMF gross is the 91-day bill plus the spread, so the MMF's NET equals this
   * bill's NET exactly when the spread closes the gap between the two bills.
   * Both are taxed at the same rate, so the tax cancels and the break-even is
   * simply the difference in gross yields. */
  const breakEvenSpreadPp = bill.grossEAY - anchor.grossEAY;

  const edgePp = mmfNetPct - billNetPct;
  return {
    mmfNetPct,
    billNetPct,
    billGrossPct: bill.grossEAY,
    billTenorDays: tenorDays,
    billMinimumKES: bill.minInvestmentKES ?? 100_000,
    edgePp,
    assumedSpreadPp: MMF_SPREAD_OVER_TBILL_PCT,
    breakEvenSpreadPp,
    tooCloseToCall: Math.abs(edgePp) < SPREAD_CONFIDENCE_PP,
  };
}

/**
 * What to tell a reader holding this much money.
 *
 * Ordered by how certain the reason is. The minimum is a rule; the lock-up is a
 * fact about the instrument; the yield is an estimate. A reader deserves the
 * certain reasons first, and most readers never need to reach the third.
 */
export type Verdict =
  | { kind: "below-minimum"; minimumKES: number }
  | { kind: "too-close"; comparison: Comparison }
  | { kind: "mmf-ahead"; comparison: Comparison }
  | { kind: "bill-ahead"; comparison: Comparison };

export function verdictFor(amountKES: number, tenorDays = 364): Verdict | null {
  const c = compareAt(tenorDays);
  if (!c) return null;
  if (amountKES > 0 && amountKES < c.billMinimumKES) {
    return { kind: "below-minimum", minimumKES: c.billMinimumKES };
  }
  if (c.tooCloseToCall) return { kind: "too-close", comparison: c };
  return c.edgePp > 0
    ? { kind: "mmf-ahead", comparison: c }
    : { kind: "bill-ahead", comparison: c };
}
