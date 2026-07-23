/**
 * Termly fee smoothing: Kenyan school fees land as three lumpy termly bills
 * (January, May, September). Smoothing them into a monthly MMF contribution
 * turns the cash-flow spike problem into a flat, plannable amount — and the
 * fund's interest quietly pays part of the bill.
 */

import { futureValue } from "./projections";

// Independently-set from lib/journey.ts's TARGET_MMF_YIELD (0.115) — both
// quote a "Serrari-style" MMF baseline but for different calculators;
// harmonizing them would change this tool's displayed subsidy numbers, so
// that's a product call rather than a mechanical fix.
/** Serrari-style KES MMF average used for the fee-smoothing subsidy maths. */
export const SMOOTHER_MMF_RATE = 0.12;

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
