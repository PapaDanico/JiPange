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
 *
 * THE SPREAD WAS 1.00, AND THE MARKET SAYS IT IS ABOUT ZERO
 * --------------------------------------------------------
 * The paragraph above argues that the pickup and the fees roughly offset, and
 * then adds a full percentage point anyway. Nobody checked which was right
 * until now, and the argument was the accurate half.
 *
 * Measured, July 2026:
 *
 *   MMF industry average, 32 funds, June 2026   9.10% gross EAY
 *   91-day bill, gross EAY, this feed           9.08%
 *   measured spread                             0.02pp
 *
 * So a fund on average returns what a rolled 91-day bill returns, which is
 * unsurprising: bills are most of what it holds, the bank-deposit pickup is
 * thin, and the management fee eats it. Assuming +1.00 overstated every
 * projection in this app by about a percentage point — compounded over the
 * horizons the FIRE and goal tools work in, that is not a rounding detail.
 *
 * Set to zero rather than to 0.02, because 0.02 is a spurious precision on a
 * figure sampled once from an equal-weighted table. Zero states the finding
 * honestly: there is no reliable pickup to assume.
 *
 * The dispersion is real and is NOT what this constant is for. The strongest
 * funds were around 11.4% net in mid-2026 while the weakest sit below the
 * bill. This is the conservative default a plan should be built on; a reader
 * who has chosen a specific fund should enter its own rate, which every
 * calculator here allows.
 *
 * Sources: CMA Collective Investment Schemes quarterly reporting and the
 * published industry yield tables, cross-checked against this feed's own
 * 91-day figure. Re-check when the CBR moves — the whole relationship is
 * downstream of it.
 */
export const MMF_SPREAD_OVER_TBILL_PCT = 0.0;

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

/**
 * The assumed MMF yield as a percentage string, for labels and preset values.
 *
 * assumedMmfYield() exists because a hand-typed MMF rate is a promise the
 * market stops keeping the moment rates move, and this module's own opening
 * note records the symptom: "a reader was being told an MMF pays 11.5% while
 * the paper inside it paid 9.30%."
 *
 * The constant was fixed and eight surfaces were not. Two rate dropdowns
 * offered "MMF ~11.5%" and fed 11.5 straight into a projection; three insight
 * cards printed 11.5% as a fact; the journey's vehicle summary quoted it as a
 * baseline. So the calculators were computing from the live anchor while the
 * page around them advertised a figure a percentage point and a half higher,
 * and a reader who picked the preset got the old number back.
 *
 * A formatter rather than a constant, because a label and a preset value must
 * be the same number by construction — they drifted precisely because they
 * were two literals that happened to agree.
 */
export function assumedMmfYieldPct(dp = 1): string {
  return (assumedMmfYield() * 100).toFixed(dp);
}

/**
 * Future value of a level monthly contribution, compounded monthly.
 *
 * Here rather than in a page because the figure it produces is quoted on a
 * page as a fact, and a fact quoted on a page should be computed somewhere a
 * test can reach.
 */
export function monthlyContributionFV(monthly: number, annualRate: number, years: number): number {
  const r = annualRate / 12;
  const n = Math.round(years * 12);
  if (r === 0) return monthly * n;
  return monthly * ((Math.pow(1 + r, n) - 1) / r);
}
