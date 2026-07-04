import { solveYearsToTarget } from "./goal-planner";

/**
 * 2026 Kenyan macro benchmarks (product-spec constants). These are quoted
 * baselines, not promises — every consuming UI says "check current rates".
 */
export const KENYAN_INFLATION = 0.064; // KNBS baseline
export const NOMINAL_RETIREMENT_YIELD = 0.115; // leading MMF/bond low-risk compounding
export const LOCAL_SAFE_WITHDRAWAL_RATE = 0.05; // localized SWR (net real return)
export const SACCO_LEVERAGE_MULTIPLIER = 3.0;
export const MAX_SALARY_DEBT_LIMIT = 0.33; // one-third gross pay rule
export const YIELD_91_DAY = 0.0883;
export const YIELD_182_DAY = 0.0896;
export const YIELD_364_DAY = 0.0899;
export const BANK_SAVINGS_BASELINE = 0.0323;

// ── Module 1: the localized FIRE engine ──

export interface LocalizedFire {
  yearsToRetirement: number;
  currentAnnualExpenses: number;
  /** 20× annual expenses — the 5% localized SWR multiplier, today's money. */
  todaysMoneyFireNumber: number;
  futureAnnualExpenses: number;
  /** The headline target: 20× expenses as they will actually be at retirement. */
  nominalFutureFireNumber: number;
}

export function localizedFire(params: {
  currentMonthlyExpenses: number;
  currentAge: number;
  targetRetirementAge: number;
}): LocalizedFire {
  const yearsToRetirement = Math.max(0, params.targetRetirementAge - params.currentAge);
  const currentAnnualExpenses = params.currentMonthlyExpenses * 12;
  const multiplier = 1 / LOCAL_SAFE_WITHDRAWAL_RATE; // 20×
  const futureAnnualExpenses =
    currentAnnualExpenses * Math.pow(1 + KENYAN_INFLATION, yearsToRetirement);
  return {
    yearsToRetirement,
    currentAnnualExpenses,
    todaysMoneyFireNumber: currentAnnualExpenses * multiplier,
    futureAnnualExpenses,
    nominalFutureFireNumber: futureAnnualExpenses * multiplier,
  };
}

/** Post-retirement structural allocation shown with the FIRE target. */
export const FIRE_ALLOCATION = [
  { share: 0.4, label: "CBK Infrastructure Bonds (IFBs)", why: "tax-free bi-annual income" },
  { share: 0.4, label: "Tier-1 Regulated Saccos", why: "high annual dividend rebates" },
  { share: 0.2, label: "High-Yield MMFs", why: "instant liquid emergency access" },
] as const;

// ── Module 2a: Sacco "Plot & Mjengo" milestones ──

export interface MjengoPlan {
  requiredDeposits: number;
  /** Months to build the deposit vault, compounding at the 11.5% baseline. */
  monthsToTarget: number | null;
  developmentLoan: number;
}

export function mjengoPlan(params: {
  targetPropertyValue: number;
  monthlyContribution: number;
}): MjengoPlan {
  const requiredDeposits = params.targetPropertyValue / SACCO_LEVERAGE_MULTIPLIER;
  const years = solveYearsToTarget({
    targetAmount: requiredDeposits,
    monthlyContribution: params.monthlyContribution,
    annualRate: NOMINAL_RETIREMENT_YIELD,
  });
  return {
    requiredDeposits,
    monthsToTarget: Number.isFinite(years) ? Math.max(1, Math.ceil(years * 12)) : null,
    developmentLoan: requiredDeposits * SACCO_LEVERAGE_MULTIPLIER,
  };
}

// ── Module 2b: DhowCSD treasury laddering ──

export const DHOWCSD_MINIMUM = 50_000;

export interface LadderBucket {
  label: string;
  days: 91 | 182 | 364;
  yieldRate: number;
  allocation: number;
  annualYieldKes: number;
}

export interface DhowcsdLadder {
  buckets: LadderBucket[];
  blendedYield: number;
  ladderAnnualKes: number;
  bankAnnualKes: number;
  advantageKes: number;
}

export function dhowcsdLadder(totalCapital: number): DhowcsdLadder {
  const third = totalCapital / 3;
  const buckets: LadderBucket[] = [
    { label: "Quarterly Liquidity Wheel", days: 91, yieldRate: YIELD_91_DAY, allocation: third, annualYieldKes: third * YIELD_91_DAY },
    { label: "Mid-Term Shield", days: 182, yieldRate: YIELD_182_DAY, allocation: third, annualYieldKes: third * YIELD_182_DAY },
    { label: "The Inflation Crusher", days: 364, yieldRate: YIELD_364_DAY, allocation: third, annualYieldKes: third * YIELD_364_DAY },
  ];
  const blendedYield = (YIELD_91_DAY + YIELD_182_DAY + YIELD_364_DAY) / 3;
  const ladderAnnualKes = totalCapital * blendedYield;
  const bankAnnualKes = totalCapital * BANK_SAVINGS_BASELINE;
  return {
    buckets,
    blendedYield,
    ladderAnnualKes,
    bankAnnualKes,
    advantageKes: ladderAnnualKes - bankAnnualKes,
  };
}
