import { DEFAULT_INFLATION_RATE, SAFE_WITHDRAWAL_RATE, inflateToFutureCost } from "./projections";

/**
 * The standard 4% rule was calibrated on US market and inflation history.
 * Kenya's inflation runs hotter (~6.5% average) and the shilling isn't a
 * reserve currency, so a lower withdrawal rate is the more honest planning
 * assumption here — JiPange surfaces both, not just the US-calibrated one.
 */
export const KENYA_ADJUSTED_SAFE_WITHDRAWAL_RATE = 0.0275;

/** The "FIRE number": invested wealth needed so a safe withdrawal rate covers annual expenses forever. */
export function calculateFireNumber(
  annualExpenses: number,
  safeWithdrawalRate: number = SAFE_WITHDRAWAL_RATE
): number {
  if (safeWithdrawalRate <= 0) return Infinity;
  return annualExpenses / safeWithdrawalRate;
}

/**
 * The FIRE number needed if today's monthly expenses keep pace with inflation
 * until retirement — the "honest" number, since a fixed nominal target
 * understates what retirement will actually cost that many years out.
 */
export function calculateInflationAdjustedFireNumber(params: {
  currentMonthlyExpenses: number;
  yearsToRetirement: number;
  safeWithdrawalRate?: number;
  annualInflationRate?: number;
}): number {
  const {
    currentMonthlyExpenses,
    yearsToRetirement,
    safeWithdrawalRate = KENYA_ADJUSTED_SAFE_WITHDRAWAL_RATE,
    annualInflationRate = DEFAULT_INFLATION_RATE,
  } = params;

  const inflatedMonthlyExpenses = inflateToFutureCost(
    currentMonthlyExpenses,
    yearsToRetirement,
    annualInflationRate
  );
  return calculateFireNumber(inflatedMonthlyExpenses * 12, safeWithdrawalRate);
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
