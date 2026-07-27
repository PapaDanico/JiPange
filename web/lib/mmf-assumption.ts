import { tbillRate } from "./rates-feed";

/**
 * One assumed money market fund yield, derived rather than typed.
 *
 * There were four. `TARGET_MMF_YIELD` said 11.5%, `MMF_ANNUAL_RATE` in the debt
 * tool said 11.8%, `SMOOTHER_MMF_RATE` in the school-fee planner said 12%, and
 * the product directory quoted its own numbers again. Two of those carried a
 * comment explaining that harmonising them was "a product call, not a
 * mechanical fix" — which reads as a decision and was not one. Nobody chose
 * three values a few basis points apart for three calculators; three people
 * typed a plausible number on three different days, and the comment made the
 * drift look deliberate enough to survive review.
 *
 * The deeper problem is that all four were hand-typed at all. A money market
 * fund holds Treasury bills and bank deposits, so its yield is not an
 * independent fact about the world — it is the short bill plus a thin spread.
 * When bills moved from 16% to 9%, every hardcoded MMF figure in this codebase
 * stayed exactly where it was and quietly became a promise the market could no
 * longer keep. A reader was being told an MMF pays 11.5% while the paper inside
 * it paid 9.30%.
 *
 * So the assumption is anchored to the one number here that cannot be typed in
 * wrong: the 91-day rate from the published CBK feed. The spread is small and
 * deliberately conservative — funds add a little through bank deposits and take
 * a little back in management fees, and the two roughly offset. Being slightly
 * pessimistic about a projected return is the safe direction to be wrong in.
 */
export const MMF_SPREAD_OVER_TBILL_PCT = 1.0;

/**
 * Used only when the feed carries no 91-day bill.
 *
 * Deliberately below every figure it replaces: if the anchor is missing, the
 * honest move is to under-promise rather than to fall back on the stale
 * optimism this module exists to remove.
 */
export const MMF_FALLBACK_YIELD = 0.1;

/** Assumed MMF yield as a decimal (0.103 = 10.3%), gross of withholding tax. */
export function assumedMmfYield(): number {
  const bill = tbillRate(91);
  if (!bill) return MMF_FALLBACK_YIELD;
  return (bill.grossEAY + MMF_SPREAD_OVER_TBILL_PCT) / 100;
}
