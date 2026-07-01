import { SAFE_WITHDRAWAL_RATE } from "./projections";

/** The "FIRE number": invested wealth needed so a safe withdrawal rate covers annual expenses forever. */
export function calculateFireNumber(
  annualExpenses: number,
  safeWithdrawalRate: number = SAFE_WITHDRAWAL_RATE
): number {
  if (safeWithdrawalRate <= 0) return Infinity;
  return annualExpenses / safeWithdrawalRate;
}

/**
 * Solves for years-to-FIRE — the closed-form inverse of futureValue solved for n:
 *   x = (1+r)^n = (FV·r + PMT) / (PV·r + PMT)  →  n = ln(x) / ln(1+r)
 */
export function calculateYearsToFire(params: {
  fireNumber: number;
  currentSavings?: number;
  monthlyContribution: number;
  annualReturnRate: number;
}): number {
  const { fireNumber, monthlyContribution, annualReturnRate } = params;
  const currentSavings = params.currentSavings ?? 0;

  if (currentSavings >= fireNumber) return 0;

  const monthlyRate = annualReturnRate / 12;

  if (monthlyRate === 0) {
    if (monthlyContribution <= 0) return Infinity;
    return (fireNumber - currentSavings) / monthlyContribution / 12;
  }

  const numerator = fireNumber * monthlyRate + monthlyContribution;
  const denominator = currentSavings * monthlyRate + monthlyContribution;

  if (denominator <= 0 || numerator <= 0) return Infinity;

  const months = Math.log(numerator / denominator) / Math.log(1 + monthlyRate);
  return months > 0 ? months / 12 : 0;
}
