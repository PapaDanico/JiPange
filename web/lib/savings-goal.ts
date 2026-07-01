/**
 * Solves for the monthly contribution needed to reach a savings target —
 * the algebraic inverse of `futureValue` in projections.ts:
 *   FV = PV(1+r)^n + PMT((1+r)^n - 1)/r  →  PMT = (FV - PV(1+r)^n) / ((1+r)^n - 1)/r
 */
export function solveMonthlyContribution(params: {
  targetFutureValue: number;
  presentValue?: number;
  annualRate: number;
  years: number;
}): number {
  const { targetFutureValue, annualRate, years } = params;
  const presentValue = params.presentValue ?? 0;
  const months = years * 12;

  if (months <= 0) {
    return targetFutureValue > presentValue ? Infinity : 0;
  }

  const monthlyRate = annualRate / 12;

  if (monthlyRate === 0) {
    const shortfall = targetFutureValue - presentValue;
    return shortfall <= 0 ? 0 : shortfall / months;
  }

  const growthFactor = Math.pow(1 + monthlyRate, months);
  const shortfall = targetFutureValue - presentValue * growthFactor;
  if (shortfall <= 0) return 0;

  return shortfall / ((growthFactor - 1) / monthlyRate);
}
