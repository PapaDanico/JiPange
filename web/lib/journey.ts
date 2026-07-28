import { fulizaDailyFee } from "./fuliza";
import { currentInflation } from "./rates-feed";
import { assumedMmfYield } from "./mmf-assumption";

/**
 * The 90-second journey funnel: 5 tap-only questions → a deterministic
 * mapping engine (rule blocks A-C) → a tailored action dashboard.
 * Everything here is pure data + pure functions so the same engine runs
 * server-side (/api/journey-map) and client-side (instant fallback).
 */

export type PrimaryGoal =
  | "home_deposit"
  | "education"
  | "emergency_fund"
  | "business_capital"
  | "clear_debt";
export type IncomeBracket = "under_50k" | "50k_120k" | "120k_250k" | "above_250k";
export type LiquidityLeak = "mobile_loans" | "credit_card" | "friends_family" | "active_savings";
export type AssetLocation = "mpesa_bank" | "mmf" | "sacco" | "chama" | "none";
export type Timeline = "short_term" | "mid_term" | "long_term";

export interface JourneyAnswers {
  primary_goal: PrimaryGoal;
  income_bracket: IncomeBracket;
  liquidity_leak: LiquidityLeak;
  /** Q4 is multi-select. */
  current_vehicle: AssetLocation[];
  timeline: Timeline;
}

// ── The 5 core questions (single source of truth for the wizard UI) ──

export interface JourneyOption {
  value: string;
  label: string;
  emoji: string;
}

export interface JourneyQuestion {
  key: keyof JourneyAnswers;
  title: string;
  multi?: boolean;
  options: JourneyOption[];
}

export const JOURNEY_QUESTIONS: JourneyQuestion[] = [
  {
    key: "primary_goal",
    title: "What is your primary financial focus right now?",
    options: [
      { value: "home_deposit", label: "Building a home deposit / buying a plot", emoji: "🏠" },
      { value: "education", label: "Securing future school fees", emoji: "🎓" },
      { value: "emergency_fund", label: "Building an emergency cushion", emoji: "🛟" },
      { value: "business_capital", label: "Accumulating business capital", emoji: "🚀" },
      { value: "clear_debt", label: "Clearing expensive mobile / app debt", emoji: "⛓️" },
    ],
  },
  {
    key: "income_bracket",
    title: "Roughly what is your total predictable monthly take-home pay?",
    options: [
      { value: "under_50k", label: "Under Ksh 50,000", emoji: "🌱" },
      { value: "50k_120k", label: "Ksh 50,000 – 120,000", emoji: "🌿" },
      { value: "120k_250k", label: "Ksh 120,000 – 250,000", emoji: "🌳" },
      { value: "above_250k", label: "Above Ksh 250,000", emoji: "🌲" },
    ],
  },
  {
    key: "liquidity_leak",
    title: "How do you typically cover unexpected expenses before the next payday?",
    options: [
      { value: "mobile_loans", label: "Mobile overdrafts / apps (Fuliza, M-Shwari…)", emoji: "📱" },
      { value: "credit_card", label: "Credit card", emoji: "💳" },
      { value: "friends_family", label: "Borrow from friends / family", emoji: "🤝" },
      { value: "active_savings", label: "Dip into an active savings cache", emoji: "🏦" },
    ],
  },
  {
    key: "current_vehicle",
    title: "Where does your leftover money sit right now?",
    multi: true,
    options: [
      { value: "mpesa_bank", label: "Standard bank account / M-Pesa wallet", emoji: "🏧" },
      { value: "mmf", label: "Money Market Fund", emoji: "📈" },
      { value: "sacco", label: "Sacco shares / deposits", emoji: "🏛️" },
      { value: "chama", label: "Chama account", emoji: "👥" },
      { value: "none", label: "What leftover money?", emoji: "🤷" },
    ],
  },
  {
    key: "timeline",
    title: "When do you ideally need to hit your primary goal?",
    options: [
      { value: "short_term", label: "Within 6 to 12 months", emoji: "⚡" },
      { value: "mid_term", label: "In 1 to 3 years", emoji: "🗓️" },
      { value: "long_term", label: "3 or more years from now", emoji: "🧭" },
    ],
  },
];

// ── Engine constants (Rule Block B, per spec) ──

export const ASSUMED_CURRENT_YIELD = 0.0323; // bank savings average
/**
 * Derived from the live 91-day bill — see lib/mmf-assumption.ts for why a
 * hand-typed MMF yield is a promise the market stops keeping the moment rates
 * move, and why three calculators held three different ones.
 */
export const TARGET_MMF_YIELD = assumedMmfYield();
/**
 * The published inflation rate, read from the rates feed.
 *
 * This was 0.067 and the FIRE calculator's was 0.064 — each hardcoded, each
 * rendered to the reader as "inflation runs at X%". Two pages, two answers,
 * the same month, neither sourced or dated. Both now read one tracked figure;
 * see lib/rates-feed.ts for why we consume this rather than assume it.
 */
export const CURRENT_INFLATION = currentInflation();
/**
 * The MMF-over-bank gap in percentage points, truncated to one decimal.
 *
 * The original spec stated "+8.2%", which was 11.5 − 3.23 truncated to match a
 * figure written when bills paid far more. With the MMF assumption anchored to
 * the live 91-day rate this moves with the market, as it always should have —
 * the gap between a fund and a bank account is not a constant of nature.
 */
export const YIELD_UPSIDE_POINTS =
  Math.floor((TARGET_MMF_YIELD - ASSUMED_CURRENT_YIELD) * 1000) / 10;

// ── Income-tier tables (documented assumptions, all user-visible copy says "estimated") ──

/** Rule A: micro-emergency fund target, Ksh 10k-30k indexed progressively. */
const MICRO_FUND_TARGET: Record<IncomeBracket, number> = {
  under_50k: 10_000,
  "50k_120k": 18_000,
  "120k_250k": 25_000,
  above_250k: 30_000,
};

/** Estimated typical mobile-overdraft balance carried, by income tier. */
const FULIZA_EST_OUTSTANDING: Record<IncomeBracket, number> = {
  under_50k: 3_000,
  "50k_120k": 8_000,
  "120k_250k": 15_000,
  above_250k: 25_000,
};

/** Days per month the overdraft is typically carried before payday clears it. */
const FULIZA_CARRIED_DAYS_PER_MONTH = 20;

/** Rule B: estimated median idle savings sitting in a bank/M-Pesa, by tier. */
const SAVINGS_MEDIAN: Record<IncomeBracket, number> = {
  under_50k: 20_000,
  "50k_120k": 80_000,
  "120k_250k": 200_000,
  above_250k: 500_000,
};

// ── Vehicles (Rule Block C matrix) ──

export type VehicleId = "mmf" | "sacco" | "ifb";

export interface Vehicle {
  id: VehicleId;
  name: string;
  examples: string[];
  minEntry: string;
  liquidity: string;
  yieldRange: string;
  valueProps: string[];
}

export const VEHICLES: Record<VehicleId, Vehicle> = {
  mmf: {
    id: "mmf",
    name: "High-Liquidity Money Market Fund",
    examples: ["Britam", "ICEA Lion", "Sanlam"],
    minEntry: "From ~Ksh 500",
    liquidity: "T+1 withdrawals to M-Pesa",
    yieldRange: "~11.5% local index baseline (varies)",
    valueProps: [
      "Instant liquidity — money back on M-Pesa next business day",
      "Daily compounding interest",
      "Capital preservation while you build",
    ],
  },
  sacco: {
    id: "sacco",
    name: "Regulated Tier-1 Sacco",
    examples: ["Stima", "Kenya Police", "Safaricom Sacco"],
    minEntry: "From ~Ksh 1,000/month",
    liquidity: "Notice period (30–60 days typical)",
    yieldRange: "~10–15% annual dividends / rebates",
    valueProps: [
      "3× deposit multiplier for development loans",
      "Competitive annual dividends and rebates",
      "Forced discipline via monthly contributions",
    ],
  },
  ifb: {
    id: "ifb",
    name: "CBK Infrastructure Bond (IFB)",
    examples: ["Via CBK DhowCSD", "Sacco shares"],
    minEntry: "Typically from Ksh 50,000 (DhowCSD)",
    liquidity: "Locked to term; secondary-market exit possible",
    yieldRange: "Tax-free coupons — check current auction rates at CBK",
    valueProps: [
      "Completely tax-free interest distributions",
      "Locked-in, predictable bi-annual cash flow",
      "Long-horizon compounding",
    ],
  },
};

// ── Dashboard model ──

export interface FulizaTax {
  estOutstanding: number;
  dailyFee: number;
  estMonthlyCost: number;
  estAnnualCost: number;
}

export interface InflationDrag {
  medianSavings: number;
  /** Ksh of purchasing power lost per year at the assumed bank yield. */
  netLossAnnual: number;
  /** Percentage-point yield swing available by moving to an MMF. */
  upsidePoints: number;
  /** Ksh gained per year at the target MMF yield vs the bank yield. */
  mmfExtraAnnual: number;
}

export interface DashboardModel {
  theme: "recovery" | "growth";
  priority1: string;
  microFundTarget: number | null;
  fulizaTax: FulizaTax | null;
  inflationDrag: InflationDrag | null;
  match: Vehicle;
  alternatives: Vehicle[];
  /** Present when Rule A suppressed long-lock vehicles. */
  suppressedNote: string | null;
}

const GOAL_PRIORITY: Record<PrimaryGoal, string> = {
  home_deposit: "Build your home deposit",
  education: "Secure the school fees",
  emergency_fund: "Build your emergency cushion",
  business_capital: "Accumulate your business capital",
  clear_debt: "Clear the expensive debt",
};

/** Rule Block C: goal × timeline → matched vehicle. */
export function matchVehicle(
  goal: PrimaryGoal,
  timeline: Timeline,
  recovery: boolean
): { match: Vehicle; alternatives: Vehicle[]; suppressed: VehicleId[] } {
  const suppressed: VehicleId[] = recovery ? ["ifb"] : [];

  let matchId: VehicleId;
  if (goal === "emergency_fund" || goal === "clear_debt" || timeline === "short_term") {
    // Emergency fund (any timeline), debt recovery cushions, or any goal ≤ 12 months.
    matchId = "mmf";
  } else if (timeline === "mid_term") {
    // Asset/milestone goals over 1-3 years.
    matchId = "sacco";
  } else {
    // Wealth generation, 3+ years.
    matchId = suppressed.includes("ifb") ? "sacco" : "ifb";
  }

  const alternatives = (Object.keys(VEHICLES) as VehicleId[])
    .filter((id) => id !== matchId && !suppressed.includes(id))
    .map((id) => VEHICLES[id]);

  return { match: VEHICLES[matchId], alternatives, suppressed };
}

/** The full mapping engine: rule blocks A, B and C over one answer payload. */
export function mapJourney(answers: JourneyAnswers): DashboardModel {
  // Rule Block A — the Debt Intercept (high-priority override).
  const recovery = answers.liquidity_leak === "mobile_loans";

  let fulizaTax: FulizaTax | null = null;
  let microFundTarget: number | null = null;
  if (recovery) {
    microFundTarget = MICRO_FUND_TARGET[answers.income_bracket];
    const estOutstanding = FULIZA_EST_OUTSTANDING[answers.income_bracket];
    // Flat fee for the band the balance falls in, not a percentage of it.
    const dailyFee = fulizaDailyFee(estOutstanding);
    const estMonthlyCost = Math.round(dailyFee * FULIZA_CARRIED_DAYS_PER_MONTH);
    fulizaTax = {
      estOutstanding,
      dailyFee: Math.round(dailyFee),
      estMonthlyCost,
      estAnnualCost: estMonthlyCost * 12,
    };
  }

  // Rule Block B — the Inflation Drag calculator.
  let inflationDrag: InflationDrag | null = null;
  if (answers.current_vehicle.includes("mpesa_bank") && answers.income_bracket !== "under_50k") {
    const medianSavings = SAVINGS_MEDIAN[answers.income_bracket];
    inflationDrag = {
      medianSavings,
      netLossAnnual: Math.round(medianSavings * (CURRENT_INFLATION - ASSUMED_CURRENT_YIELD)),
      upsidePoints: YIELD_UPSIDE_POINTS,
      mmfExtraAnnual: Math.round(medianSavings * (TARGET_MMF_YIELD - ASSUMED_CURRENT_YIELD)),
    };
  }

  // Rule Block C — the Vehicle Matchmaker matrix.
  const { match, alternatives, suppressed } = matchVehicle(
    answers.primary_goal,
    answers.timeline,
    recovery
  );

  return {
    theme: recovery ? "recovery" : "growth",
    priority1: recovery
      ? "Debt Paydown & Micro-Emergency Fund"
      : GOAL_PRIORITY[answers.primary_goal],
    microFundTarget,
    fulizaTax,
    inflationDrag,
    match,
    alternatives,
    suppressedNote: suppressed.length
      ? "Long-lock vehicles (like infrastructure bonds) are hidden until the expensive debt is cleared — liquidity comes first."
      : null,
  };
}

// ── Pesa Engine Persona (the /picture diagnostic) ──

export interface Persona {
  name: string;
  blurb: string;
}

/**
 * Persona precedence: debt stress dominates everything; real growth vehicles
 * beat idle bank money; idle bank money beats nothing tracked.
 */
export function derivePersona(answers: JourneyAnswers): Persona {
  if (answers.liquidity_leak === "mobile_loans") {
    return {
      name: "The Debt-Stressed Striver",
      blurb: "Hustling hard, but short-term credit keeps skimming the gains.",
    };
  }
  if (answers.current_vehicle.includes("sacco") || answers.current_vehicle.includes("mmf")) {
    return {
      name: "The Budding Wealth Builder",
      blurb: "Your money already works in real vehicles — now compound it.",
    };
  }
  if (answers.current_vehicle.includes("mpesa_bank")) {
    return {
      name: "The Casual Saver (Leaking Yield)",
      blurb: "You save — but where it sits, inflation eats faster than it grows.",
    };
  }
  return {
    name: "The Clean-Slate Builder",
    blurb: "No leaks, no baggage — the perfect moment to pick the right vehicle first.",
  };
}

/** Survival status for the /picture header card, keyed off the liquidity leak. */
export type SurvivalState = "high_risk" | "optimized" | "exposed";

export function deriveSurvivalState(leak: LiquidityLeak): SurvivalState {
  if (leak === "mobile_loans") return "high_risk";
  if (leak === "active_savings") return "optimized";
  return "exposed";
}

// ── Micro-milestone (the /plan first-target generator) ──

/** Yield assumption for the milestone slider (Serrari KES MMF leaders baseline). */
export const MILESTONE_YIELD = TARGET_MMF_YIELD;

const MILESTONE_BASE: Record<PrimaryGoal, number> = {
  home_deposit: 100_000,
  business_capital: 100_000,
  education: 50_000,
  emergency_fund: 50_000,
  clear_debt: 30_000,
};

const MILESTONE_BRACKET_MULTIPLIER: Record<IncomeBracket, number> = {
  under_50k: 0.5,
  "50k_120k": 1,
  "120k_250k": 1.5,
  above_250k: 2,
};

/** A manageable first target: goal base × income multiplier, rounded to 5k. */
export function microMilestoneTarget(answers: JourneyAnswers): number {
  const raw =
    MILESTONE_BASE[answers.primary_goal] * MILESTONE_BRACKET_MULTIPLIER[answers.income_bracket];
  return Math.max(5_000, Math.round(raw / 5_000) * 5_000);
}
