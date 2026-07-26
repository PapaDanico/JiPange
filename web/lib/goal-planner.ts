import { DEFAULT_INFLATION_RATE, futureValue, inflateToFutureCost } from "./projections";
import { solveMonthlyContribution } from "./savings-goal";

/**
 * Goal planner engine — reverse-engineers a life goal into a monthly plan.
 *
 * Given a target amount and date, it solves for the required monthly
 * contribution, grades that against what the user can actually afford, and —
 * when the goal doesn't fit — computes the two honest levers instead of a
 * dead end: how long the goal takes at full capacity, and how much of the
 * goal is reachable by the original date.
 */

export type GoalType = "education" | "home" | "emergency" | "business" | "retirement";

export type Feasibility = "comfortable" | "tight" | "stretch" | "beyond-reach" | "unknown";

export interface GoalPlanInput {
  /** Ksh needed at the target date (nominal — inflate first if planning in today's prices). */
  targetAmount: number;
  /** Years until the money is needed. */
  years: number;
  /** Ksh already set aside toward this goal. */
  currentSavings?: number;
  /** Assumed net annual return on the savings vehicle, e.g. 0.08. */
  annualReturn: number;
  /** The user's total monthly savings capacity in KES, when known. */
  monthlyCapacity?: number;
  /**
   * Set when the goal is quoted in today's prices and its real cost inflates
   * with time (school fees, home prices). `targetAmount` must still be the
   * nominal cost at `years`; this lets the extend-the-timeline lever solve
   * against a target that keeps moving as the horizon stretches.
   */
  targetInflation?: {
    todayValue: number;
    annualRate?: number;
  };
}

export interface GoalPlanResult {
  /** KES per month needed to hit the target on time. 0 when already funded. */
  requiredMonthly: number;
  /** How the required amount compares to the user's capacity. */
  feasibility: Feasibility;
  /** requiredMonthly / monthlyCapacity, null when capacity is unknown. */
  capacityShare: number | null;
  /**
   * Lever 1 — extend the timeline: years to reach the target saving the full
   * monthly capacity. null when capacity is unknown or the target is
   * unreachable even then (zero capacity and insufficient growth).
   */
  yearsAtCapacity: number | null;
  /**
   * Lever 2 — shrink the target: Ksh accumulated by the original date saving
   * the full monthly capacity. null when capacity is unknown.
   */
  amountAtCapacityByTargetDate: number | null;
}

/**
 * Months needed for `presentValue` plus monthly contributions to grow to
 * `targetAmount` at the given annual rate. Returns Infinity when the target
 * can never be reached (no contributions and no/insufficient growth).
 */
export function solveYearsToTarget(params: {
  targetAmount: number;
  presentValue?: number;
  monthlyContribution: number;
  annualRate: number;
}): number {
  const { targetAmount, monthlyContribution, annualRate } = params;
  const presentValue = params.presentValue ?? 0;

  if (targetAmount <= presentValue) return 0;

  const monthlyRate = annualRate / 12;

  if (monthlyRate === 0) {
    if (monthlyContribution <= 0) return Infinity;
    return (targetAmount - presentValue) / monthlyContribution / 12;
  }

  // FV = PV·g + PMT·(g−1)/r with g=(1+r)^n  →  g = (FV + PMT/r) / (PV + PMT/r)
  const pmtOverRate = monthlyContribution / monthlyRate;
  const denominator = presentValue + pmtOverRate;
  if (denominator <= 0) return Infinity;

  const growthFactor = (targetAmount + pmtOverRate) / denominator;
  if (growthFactor <= 1) return Infinity;

  const months = Math.log(growthFactor) / Math.log(1 + monthlyRate);
  return months / 12;
}

/**
 * Years until savings catch an inflating target: solves
 * futureValue(n) >= todayValue·(1+i)^n by bisection. The plain closed form
 * in `solveYearsToTarget` can't be used because the target moves with n —
 * extending a school-fees timeline also inflates the fees.
 */
export function solveYearsToInflatingTarget(params: {
  todayValue: number;
  inflationRate?: number;
  presentValue?: number;
  monthlyContribution: number;
  annualRate: number;
}): number {
  const { todayValue, monthlyContribution, annualRate } = params;
  const inflationRate = params.inflationRate ?? DEFAULT_INFLATION_RATE;
  const presentValue = params.presentValue ?? 0;

  const reaches = (n: number) =>
    futureValue(presentValue, monthlyContribution, annualRate, n) >=
    inflateToFutureCost(todayValue, n, inflationRate);

  if (reaches(0)) return 0;

  const MAX_YEARS = 60;
  if (!reaches(MAX_YEARS)) return Infinity;

  let lo = 0;
  let hi = MAX_YEARS;
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    if (reaches(mid)) {
      hi = mid;
    } else {
      lo = mid;
    }
  }
  return hi;
}

export function gradeFeasibility(capacityShare: number | null): Feasibility {
  if (capacityShare === null) return "unknown";
  if (capacityShare <= 0.5) return "comfortable";
  if (capacityShare <= 0.8) return "tight";
  if (capacityShare <= 1.0) return "stretch";
  return "beyond-reach";
}

export function buildGoalPlan(input: GoalPlanInput): GoalPlanResult {
  const { targetAmount, years, annualReturn, monthlyCapacity } = input;
  const currentSavings = input.currentSavings ?? 0;

  const requiredMonthly = Math.max(
    0,
    solveMonthlyContribution({
      targetFutureValue: targetAmount,
      presentValue: currentSavings,
      annualRate: annualReturn,
      years,
    })
  );

  const hasCapacity = monthlyCapacity !== undefined && monthlyCapacity > 0;
  const capacityShare =
    hasCapacity && Number.isFinite(requiredMonthly) ? requiredMonthly / monthlyCapacity : null;

  let yearsAtCapacity: number | null = null;
  let amountAtCapacityByTargetDate: number | null = null;

  if (hasCapacity) {
    const solved = input.targetInflation
      ? solveYearsToInflatingTarget({
          todayValue: input.targetInflation.todayValue,
          inflationRate: input.targetInflation.annualRate,
          presentValue: currentSavings,
          monthlyContribution: monthlyCapacity,
          annualRate: annualReturn,
        })
      : solveYearsToTarget({
          targetAmount,
          presentValue: currentSavings,
          monthlyContribution: monthlyCapacity,
          annualRate: annualReturn,
        });
    yearsAtCapacity = Number.isFinite(solved) ? solved : null;
    amountAtCapacityByTargetDate = futureValue(
      currentSavings,
      monthlyCapacity,
      annualReturn,
      years
    );
  }

  return {
    requiredMonthly,
    feasibility:
      requiredMonthly === 0 ? "comfortable" : gradeFeasibility(capacityShare),
    capacityShare,
    yearsAtCapacity,
    amountAtCapacityByTargetDate,
  };
}

export interface PlanItemInput {
  /** KES in today's prices (inflated internally when `inflates` is set). */
  todayValue: number;
  years: number;
}

export interface PlannedItem extends GoalPlanResult {
  nominalTarget: number;
  years: number;
}

export interface MultiGoalPlan {
  items: PlannedItem[];
  totalRequiredMonthly: number;
  feasibility: Feasibility;
  capacityShare: number | null;
  /** Longest horizon across the items. */
  maxYears: number;
  totalNominalTarget: number;
}

/**
 * Plans several sub-goals as one commitment — e.g. school fees for 2-3
 * children on different timelines. Each item is solved independently;
 * shared current savings are allocated proportionally to each item's
 * nominal target, and feasibility is graded on the combined monthly total.
 */
export function buildMultiGoalPlan(
  inputs: PlanItemInput[],
  opts: {
    inflates: boolean;
    currentSavings?: number;
    annualReturn: number;
    monthlyCapacity?: number;
  }
): MultiGoalPlan {
  const currentSavings = opts.currentSavings ?? 0;
  const nominalTargets = inputs.map((item) =>
    opts.inflates ? inflateToFutureCost(item.todayValue, item.years) : item.todayValue
  );
  const totalNominal = nominalTargets.reduce((sum, t) => sum + t, 0);

  const items: PlannedItem[] = inputs.map((item, i) => {
    const savingsShare =
      totalNominal > 0 ? currentSavings * (nominalTargets[i] / totalNominal) : 0;
    const plan = buildGoalPlan({
      targetAmount: nominalTargets[i],
      years: item.years,
      currentSavings: savingsShare,
      annualReturn: opts.annualReturn,
      monthlyCapacity: opts.monthlyCapacity,
      ...(opts.inflates ? { targetInflation: { todayValue: item.todayValue } } : {}),
    });
    return { ...plan, nominalTarget: nominalTargets[i], years: item.years };
  });

  const totalRequiredMonthly = items.reduce((sum, item) => sum + item.requiredMonthly, 0);
  const hasCapacity = opts.monthlyCapacity !== undefined && opts.monthlyCapacity > 0;
  const capacityShare =
    hasCapacity && Number.isFinite(totalRequiredMonthly)
      ? totalRequiredMonthly / opts.monthlyCapacity!
      : null;

  return {
    items,
    totalRequiredMonthly,
    feasibility: totalRequiredMonthly === 0 ? "comfortable" : gradeFeasibility(capacityShare),
    capacityShare,
    maxYears: inputs.reduce((max, item) => Math.max(max, item.years), 0),
    totalNominalTarget: totalNominal,
  };
}

export interface GoalConfig {
  type: GoalType;
  title: string;
  emoji: string;
  tagline: string;
  /** Default assumed net annual return for the typical vehicle for this goal. */
  defaultAnnualReturn: number;
  /**
   * Suggested target-amount presets shown as quick-picks, in KES.
   * `startAge` (education stages) is the typical age fees for that stage
   * begin under CBC — used to derive a child's timeline from their age.
   */
  amountPresets: { label: string; amount: number; startAge?: number }[];
  defaultYears: number;
  /** Upper bound of the timeline slider. Defaults to 25 when omitted. */
  maxYears?: number;
  /**
   * Which variable-builder UI drives the target amount:
   * - "children": one row per child, each with a stage and timeline (education)
   * - "expenses-months": monthly expenses × months of cover (emergency)
   * - "price-deposit": property price × deposit % (home)
   * - "income": desired monthly income × 300 via the 4% rule (retirement)
   * - "presets": plain quick-pick amounts (business)
   */
  builder: "children" | "expenses-months" | "price-deposit" | "income" | "presets";
  /** Whether the target is naturally quoted in today's prices (inflate before solving). */
  inflatesWithTime: boolean;
  /**
   * When set, the default timeline becomes (retireAtAge − profile age) for
   * users with a stored profile. Plain data, not a function — GoalConfig
   * crosses the server→client component boundary.
   */
  retireAtAge?: number;
}

/**
 * Return defaults are deliberately conservative and user-adjustable in the
 * UI; JiPange never promises a rate, it plans against an assumption the
 * user can see and change.
 */
export const GOAL_CONFIGS: Record<GoalType, GoalConfig> = {
  education: {
    type: "education",
    title: "Education Planner",
    emoji: "🎓",
    tagline: "From nursery to university — fund school fees before they're due.",
    defaultAnnualReturn: 0.09,
    amountPresets: [
      // CBC stage entry ages: JSS ≈ Grade 7 at 12, SSS ≈ Grade 10 at 15, university ≈ 18.
      { label: "Junior Secondary (3 yrs, day)", amount: 150_000, startAge: 12 },
      { label: "Senior Secondary (3 yrs, boarding)", amount: 400_000, startAge: 15 },
      { label: "University degree (4 yrs, public)", amount: 800_000, startAge: 18 },
      { label: "University degree (4 yrs, private)", amount: 2_000_000, startAge: 18 },
    ],
    builder: "children",
    defaultYears: 8,
    inflatesWithTime: true,
  },
  home: {
    type: "home",
    title: "Home Deposit Planner",
    emoji: "🏠",
    tagline: "Reverse-engineer the deposit on your first home or plot.",
    defaultAnnualReturn: 0.09,
    amountPresets: [
      { label: "Plot deposit", amount: 500_000 },
      { label: "10% on a Ksh 5M home", amount: 500_000 },
      { label: "10% on a Ksh 8M home", amount: 800_000 },
      { label: "20% on a Ksh 8M home", amount: 1_600_000 },
    ],
    builder: "price-deposit",
    defaultYears: 5,
    inflatesWithTime: true,
  },
  emergency: {
    type: "emergency",
    title: "Emergency Fund Planner",
    emoji: "🛟",
    tagline: "Build a cushion so one bad month doesn't become a Fuliza spiral.",
    defaultAnnualReturn: 0.07,
    amountPresets: [
      { label: "1 month of expenses", amount: 50_000 },
      { label: "3 months of expenses", amount: 150_000 },
      { label: "6 months of expenses", amount: 300_000 },
    ],
    builder: "expenses-months",
    defaultYears: 1,
    inflatesWithTime: false,
  },
  business: {
    type: "business",
    title: "Business Capital Planner",
    emoji: "🚀",
    tagline: "Save the seed capital for your side hustle or biashara.",
    defaultAnnualReturn: 0.08,
    amountPresets: [
      { label: "Kiosk / small stock", amount: 100_000 },
      { label: "Boda or equipment", amount: 250_000 },
      { label: "Shop / serious stock", amount: 500_000 },
      { label: "Bigger venture", amount: 1_000_000 },
    ],
    builder: "presets",
    defaultYears: 3,
    inflatesWithTime: false,
  },
  retirement: {
    type: "retirement",
    title: "Retirement Planner",
    emoji: "🌴",
    tagline: "Reverse-engineer the pot that pays you a monthly income for life.",
    defaultAnnualReturn: 0.1,
    // Pot sizes derived from the 4% rule: monthly income × 12 ÷ 0.04
    // (i.e. × 300). A rough guide from US data — the planner copy says so.
    amountPresets: [
      { label: "Ksh 30k/month for life", amount: 9_000_000 },
      { label: "Ksh 50k/month for life", amount: 15_000_000 },
      { label: "Ksh 100k/month for life", amount: 30_000_000 },
      { label: "Ksh 150k/month for life", amount: 45_000_000 },
    ],
    builder: "income",
    defaultYears: 25,
    maxYears: 40,
    inflatesWithTime: true,
    // Kenya's typical retirement age; timeline defaults to 60 − user's age.
    retireAtAge: 60,
  },
};

export const GOAL_TYPES = Object.keys(GOAL_CONFIGS) as GoalType[];
