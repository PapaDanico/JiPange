/**
 * Kenya-calibrated wealth projection maths.
 * FV = PV × (1 + r)^n + PMT × ((1 + r)^n − 1) / r, compounded monthly.
 */

export const DEFAULT_INFLATION_RATE = 0.065; // Kenya CPI average, per annum
/**
 * Bengen (1994) 4% safe withdrawal rate. This was calibrated on US market
 * and inflation history — JiPange surfaces it as a rough guide only, not
 * a Kenya-specific guarantee.
 */
export const SAFE_WITHDRAWAL_RATE = 0.04;
export const SAFE_WITHDRAWAL_RATE_NOTE =
  "The 4% rule is based on US historical market data (Bengen, 1994). Kenyan inflation and market returns differ — treat this as a rough guide, not a guarantee.";

export const DEFAULT_RETIREMENT_AGE = 60;
export const DEFAULT_WITH_PLAN_RETURN_RATE = 0.1;
export const DEFAULT_WITH_PLAN_SAVINGS_RATE = 0.2;

/**
 * Future value of a present lump sum plus a stream of monthly contributions,
 * compounded monthly at the given annual rate over the given number of years.
 */
export function futureValue(
  presentValue: number,
  monthlyContribution: number,
  annualRate: number,
  years: number
): number {
  if (years <= 0) return presentValue;

  const months = years * 12;
  const monthlyRate = annualRate / 12;

  if (monthlyRate === 0) {
    return presentValue + monthlyContribution * months;
  }

  const growthFactor = Math.pow(1 + monthlyRate, months);
  return (
    presentValue * growthFactor +
    monthlyContribution * ((growthFactor - 1) / monthlyRate)
  );
}

/**
 * Future value where the monthly contribution steps up once a year (e.g. +10%
 * as salary grows). Computed year by year; equals futureValue when stepUp = 0.
 */
export function futureValueWithStepUp(
  presentValue: number,
  firstYearMonthly: number,
  annualRate: number,
  years: number,
  annualStepUpRate: number
): { total: number; totalContributed: number } {
  let total = presentValue;
  let totalContributed = presentValue;
  let monthly = firstYearMonthly;
  for (let year = 0; year < Math.floor(years); year++) {
    total = futureValue(total, monthly, annualRate, 1);
    totalContributed += monthly * 12;
    monthly *= 1 + annualStepUpRate;
  }
  const remainder = years - Math.floor(years);
  if (remainder > 0) {
    total = futureValue(total, monthly, annualRate, remainder);
    totalContributed += monthly * 12 * remainder;
  }
  return { total, totalContributed };
}

/** Converts a nominal future KES amount to today's purchasing power. */
export function inflationAdjust(
  nominalValue: number,
  years: number,
  annualInflationRate: number = DEFAULT_INFLATION_RATE
): number {
  if (years <= 0) return nominalValue;
  return nominalValue / Math.pow(1 + annualInflationRate, years);
}

/** The nominal KES amount, N years from now, that has the same purchasing power as `todaysValue` today. */
export function inflateToFutureCost(
  todaysValue: number,
  years: number,
  annualInflationRate: number = DEFAULT_INFLATION_RATE
): number {
  if (years <= 0) return todaysValue;
  return todaysValue * Math.pow(1 + annualInflationRate, years);
}

export interface WealthProjection {
  nominalWealth: number;
  inflationAdjustedWealth: number;
}

export function projectWealthAtRetirement(params: {
  currentAge: number;
  monthlyContribution: number;
  annualReturnRate: number;
  currentSavings?: number;
  retirementAge?: number;
  inflationRate?: number;
}): WealthProjection {
  const retirementAge = params.retirementAge ?? DEFAULT_RETIREMENT_AGE;
  const years = Math.max(0, retirementAge - params.currentAge);
  const nominalWealth = futureValue(
    params.currentSavings ?? 0,
    params.monthlyContribution,
    params.annualReturnRate,
    years
  );

  return {
    nominalWealth,
    inflationAdjustedWealth: inflationAdjust(
      nominalWealth,
      years,
      params.inflationRate ?? DEFAULT_INFLATION_RATE
    ),
  };
}

export interface RetirementComparison {
  yearsToRetirement: number;
  currentTrajectory: WealthProjection;
  withPlan: WealthProjection & { monthlySavings: number; savingsRate: number };
}

/**
 * "Current trajectory" assumes zero intentional savings — the gap between
 * it and "with a plan" is meant to be emotionally visible, not a real forecast
 * of someone saving literally nothing.
 */
export function buildRetirementComparison(params: {
  currentAge: number;
  netMonthlyIncome: number;
  currentSavings?: number;
  retirementAge?: number;
  withPlanSavingsRate?: number;
  withPlanReturnRate?: number;
  inflationRate?: number;
}): RetirementComparison {
  const retirementAge = params.retirementAge ?? DEFAULT_RETIREMENT_AGE;
  const inflationRate = params.inflationRate ?? DEFAULT_INFLATION_RATE;
  const savingsRate =
    params.withPlanSavingsRate ?? DEFAULT_WITH_PLAN_SAVINGS_RATE;
  const monthlySavings = params.netMonthlyIncome * savingsRate;

  const currentTrajectory = projectWealthAtRetirement({
    currentAge: params.currentAge,
    monthlyContribution: 0,
    annualReturnRate: 0,
    currentSavings: params.currentSavings,
    retirementAge,
    inflationRate,
  });

  const withPlanProjection = projectWealthAtRetirement({
    currentAge: params.currentAge,
    monthlyContribution: monthlySavings,
    annualReturnRate: params.withPlanReturnRate ?? DEFAULT_WITH_PLAN_RETURN_RATE,
    currentSavings: params.currentSavings,
    retirementAge,
    inflationRate,
  });

  return {
    yearsToRetirement: Math.max(0, retirementAge - params.currentAge),
    currentTrajectory,
    withPlan: { ...withPlanProjection, monthlySavings, savingsRate },
  };
}
