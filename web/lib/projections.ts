import { finiteOr, isSaneRate } from "./money";

/**
 * Kenya-calibrated wealth projection maths.
 * FV = PV × (1 + r)^n + PMT × ((1 + r)^n − 1) / r, compounded monthly.
 */

/**
 * A LONG-RUN assumption, deliberately not the current published rate.
 *
 * lib/journey.ts's CURRENT_INFLATION now reads the tracked CPI print from the
 * rates feed, because a page saying "inflation runs at X%" is making a claim
 * about today, and today is knowable. This constant answers a different
 * question: what should a thirty-year projection assume?
 *
 * One month's year-on-year print is a poor answer to that. Kenyan inflation
 * ran above 9% in 2023 and below 5% in 2024; anchoring a retirement plan to
 * whichever month the user happened to open the app would let the plan swing
 * on noise. So this stays a separate, user-overridable long-run average, and
 * the divergence from CURRENT_INFLATION is deliberate rather than an oversight.
 */
export const DEFAULT_INFLATION_RATE = 0.065; // long-run Kenya CPI average, per annum

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
  /* A projection built from a number that is not a number is not a
     projection. Refused here rather than propagated, because this is the
     shared compounding primitive: chama, savings-goal, school-fees,
     goal-planner and tool-stats all route through it, so one NaN escaping
     becomes "Ksh NaN" in five calculators at once. */
  if (
    !Number.isFinite(presentValue) ||
    !Number.isFinite(monthlyContribution) ||
    !Number.isFinite(annualRate) ||
    !Number.isFinite(years)
  ) {
    return 0;
  }
  if (years <= 0) return presentValue;

  const months = years * 12;
  const monthlyRate = annualRate / 12;

  if (monthlyRate === 0) {
    return presentValue + monthlyContribution * months;
  }

  const growthFactor = Math.pow(1 + monthlyRate, months);

  /* THE OVERFLOW, WHICH IS NOT THEORETICAL.
   *
   * (1+r)^n runs to Infinity well before the inputs look absurd on screen,
   * and the expression below then reads `0 * Infinity` for a zero present
   * value — which is NaN, not Infinity. The chama investment projection was
   * returning NaN for its three- and five-year figures while the one-year
   * figure beside them looked fine, so the failure was partial and therefore
   * easy to miss.
   *
   * A projection that has overflowed has no meaning to report, so this
   * declines to answer rather than emitting a number made of Infinity — the
   * same choice calculateLoanAmortization makes for an absurd rate, and the
   * same one the calculators make when they render nothing rather than
   * something wrong. */
  if (!Number.isFinite(growthFactor)) return 0;

  /* Two guards, and each independently catches the case above — verified by
     mutation: removing either alone leaves the sweep green, removing both
     turns it red. Kept deliberately rather than pruned to one. They fail
     differently: this one refuses before the arithmetic, the one below
     catches a product that overflows even when the factor did not. Neither
     is dead code for the other's reason. */

  const result =
    presentValue * growthFactor +
    monthlyContribution * ((growthFactor - 1) / monthlyRate);
  return Number.isFinite(result) ? result : 0;
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
  if (!isSaneRate(annualRate) || !isSaneRate(annualStepUpRate)) {
    return { total: 0, totalContributed: 0 };
  }
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
  return { total: finiteOr(total), totalContributed: finiteOr(totalContributed) };
}

/** Converts a nominal future Ksh amount to today's purchasing power. */
export function inflationAdjust(
  nominalValue: number,
  years: number,
  annualInflationRate: number = DEFAULT_INFLATION_RATE
): number {
  /* At exactly -100% the divisor is zero and this returned Infinity in a
     shilling figure. Outside the sane band there is no deflator to apply —
     see MIN/MAX_ANNUAL_RATE in money.ts. */
  if (!Number.isFinite(nominalValue) || !Number.isFinite(years)) return 0;
  if (!isSaneRate(annualInflationRate)) return 0;
  if (years <= 0) return nominalValue;
  return finiteOr(nominalValue / Math.pow(1 + annualInflationRate, years));
}

/** The nominal Ksh amount, N years from now, that has the same purchasing power as `todaysValue` today. */
export function inflateToFutureCost(
  todaysValue: number,
  years: number,
  annualInflationRate: number = DEFAULT_INFLATION_RATE
): number {
  if (!Number.isFinite(todaysValue) || !Number.isFinite(years)) return 0;
  if (!isSaneRate(annualInflationRate)) return 0;
  if (years <= 0) return todaysValue;
  return finiteOr(todaysValue * Math.pow(1 + annualInflationRate, years));
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
}): RetirementComparison | null {
  /* An unusable age is answered with null, not with arithmetic on it.
   *
   * `currentAge` arrives from a stored profile, and lib/storage.ts reads that
   * with `JSON.parse(raw) as T` — a CAST, not a validation. A profile written
   * by an older schema, or by an onboarding run that did not finish, therefore
   * reaches here with `age` undefined, and every figure downstream becomes NaN.
   *
   * That is not theoretical and it did not stay on screen. The printed "My Pesa
   * Picture" carried it to paper:
   *
   *     Current trajectory   Ksh 0
   *     With a plan          Ksh 0
   *     Assumes a 20% savings rate at 10% annual return over NaN years.
   *
   * A report is the artefact a reader keeps, shows a spouse, and takes to a
   * SACCO. Printing NaN into it is worse than printing nothing, because
   * nothing is obviously missing and NaN looks like a computed result.
   *
   * `?? DEFAULT` cannot help here: `undefined ?? 60` gives 60, but
   * `NaN ?? 60` gives NaN, and an age that is present but not a number is
   * exactly the case a partial profile produces. The check is therefore
   * Number.isFinite, not a nullish default — the same correction this codebase
   * already had to make once in the FIRE calculator. */
  if (!Number.isFinite(params.currentAge) || !Number.isFinite(params.netMonthlyIncome)) {
    return null;
  }

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
