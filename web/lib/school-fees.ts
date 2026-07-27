/**
 * Termly fee smoothing: Kenyan school fees land as three lumpy termly bills
 * (January, May, September). Smoothing them into a monthly MMF contribution
 * turns the cash-flow spike problem into a flat, plannable amount — and the
 * fund's interest quietly pays part of the bill.
 */

import { futureValue } from "./projections";
import { assumedMmfYield } from "./mmf-assumption";

/**
 * The same anchored assumption every other calculator now uses.
 *
 * This used to be 0.12 with a comment calling the divergence from
 * TARGET_MMF_YIELD "a product call rather than a mechanical fix". It was
 * neither: three calculators carried three MMF rates because three people
 * typed one, and the comment made that look intentional. The displayed subsidy
 * does change, and it should — it was quoting a return the market no longer
 * offers.
 */
export const SMOOTHER_MMF_RATE = assumedMmfYield();

/** Recommended floating buffer per child for ad-hoc CBC project costs. */
export const CBC_CUSHION_PER_CHILD = 5_000;

export function termlyMonthlyTarget(annualFees: number, children: number): number {
  if (annualFees <= 0 || children <= 0) return 0;
  return (annualFees * children) / 12;
}

/**
 * Interest earned over one year of equal monthly contributions at `rate`,
 * compounded monthly — the "the fund pays part of the fees" bonus.
 */
export function mmfFeeSubsidy(
  annualFees: number,
  children: number,
  rate: number = SMOOTHER_MMF_RATE
): number {
  const monthly = termlyMonthlyTarget(annualFees, children);
  if (monthly <= 0) return 0;
  const fv = futureValue(0, monthly, rate, 1);
  return Math.round(fv - monthly * 12);
}
