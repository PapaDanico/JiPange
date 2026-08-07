import { assumedMmfYield } from "./mmf-assumption";
import { RATES, tbillRate, type BondBand } from "./rates-feed";
import type { SavedGoal } from "./storage";
import type { Calculations } from "./types";

/**
 * One consolidated view of the money: where it goes each month, and where the
 * committed part should sit.
 *
 * WHY THIS EXISTS — THE PLANNERS EACH BELIEVE THEY HAVE THE WHOLE CAPACITY
 *
 * Every goal planner grades feasibility by comparing its own requiredMonthly
 * against `Calculations.savingsCapacity`. That is the FULL capacity, and it is
 * the same full capacity for all five of them. So a reader can plan school
 * fees ("comfortable"), a home deposit ("comfortable"), an emergency fund
 * ("comfortable"), retirement ("comfortable") and business capital
 * ("comfortable"), and be over-committed by a factor of three while every
 * screen they saw told them they were fine.
 *
 * MyGoals on the Pesa Picture already sums the commitments and flags the
 * overshoot — but only AFTER the fact, and only if the reader scrolls to it.
 * The grade they acted on, inside the planner, was computed against money four
 * other goals had already claimed. `remainingCapacity` below is what fixes
 * that, and it is the reason this module is not merely a rendering helper.
 *
 * WHY BUCKETS BY HORIZON RATHER THAN A PIE CHART
 *
 * Goals do not differ by category so much as by WHEN the money is needed, and
 * when it is needed is what decides where it can sit. Money wanted in eight
 * months cannot be in a twelve-year bond at any yield. The map below therefore
 * buckets by years-to-need and names the vehicle each bucket can actually use.
 *
 * EVERY YIELD HERE IS READ, NOT TYPED
 *
 * The bucket yields come from lib/rates-feed (bills, bond auction bands) and
 * lib/mmf-assumption (itself derived from the 91-day bill). Nothing in this
 * file states a rate of its own, and a bucket whose benchmark the feed refuses
 * to quote — `medianClearingRate: null`, which is a deliberate refusal when
 * too few auctions fell in the band — carries a null yield rather than
 * borrowing a neighbouring band's figure.
 *
 * WHAT THIS MAP DOES NOT SEE, STATED RATHER THAN IMPLIED
 *
 * Only the five goal planners and the termly-fee smoother write into
 * `jipange:goals`, so only they appear here. The Cycle Venture Planner smooths
 * a lumpy payout into a monthly draw — it is an INCOME shape, not a claim on
 * savings capacity, and folding it in would double-count. Debt service is
 * likewise absent: the debt tools persist nothing shared, so a reader with a
 * loan has a real outflow this waterfall does not deduct, and the unallocated
 * figure is therefore an upper bound. Both are gaps in the inputs, not
 * rounding — do not present the bottom line as the last word.
 */

// ── Net cash flow ──

export interface CashFlow {
  /** Take-home pay after PAYE, NSSF, SHIF and the housing levy. */
  netMonthly: number;
  /** Needs + social obligations + wants — everything the budget spends. */
  livingCost: number;
  /** What the budget model leaves for saving. The denominator for everything below. */
  savingsCapacity: number;
  /** Sum of every saved goal's required monthly contribution. */
  committed: number;
  /** Capacity not yet claimed by a goal. Zero when over-committed. */
  unallocated: number;
  /** How far commitments exceed capacity. Zero when they fit. */
  shortfall: number;
  /**
   * committed / savingsCapacity. Null when capacity is zero or unknown —
   * a share of nothing is not 0% and not Infinity, it is unanswerable, and
   * rendering either would be a claim we cannot support.
   */
  commitmentShare: number | null;
  overCommitted: boolean;
}

export function buildCashFlow(
  calculations: Calculations | null,
  goals: readonly SavedGoal[]
): CashFlow | null {
  if (!calculations || !Number.isFinite(calculations.netMonthly)) return null;

  const { netMonthly, savingsCapacity, budgetSplit } = calculations;
  const livingCost = budgetSplit.needs + budgetSplit.socialObligations + budgetSplit.wants;
  const committed = totalCommitted(goals);

  // NOT gated on `savingsCapacity > 0`. That gate meant a reader with zero
  // capacity and Ksh 5,000 of commitments — the most over-committed reader on
  // the site — saw the calm green "Unallocated Ksh 0" row and a mild footnote.
  // The share below is still refused at zero, because a ratio to zero is not a
  // percentage; the verdict does not depend on being able to quote one.
  const overCommitted = committed > savingsCapacity;

  return {
    netMonthly,
    livingCost,
    savingsCapacity,
    committed,
    unallocated: Math.max(0, savingsCapacity - committed),
    shortfall: Math.max(0, committed - savingsCapacity),
    commitmentShare: savingsCapacity > 0 ? committed / savingsCapacity : null,
    overCommitted,
  };
}

/** Sum of requiredMonthly across goals, ignoring any that stored a non-number. */
export function totalCommitted(goals: readonly SavedGoal[]): number {
  return goals.reduce(
    (sum, g) => sum + (Number.isFinite(g.requiredMonthly) ? g.requiredMonthly : 0),
    0
  );
}

/**
 * Capacity left for ONE goal, once the reader's other commitments are taken
 * off the top.
 *
 * `excludingGoalType` is what makes this usable inside a planner: re-planning
 * the home deposit must not count the home deposit's own existing commitment
 * against itself, or every saved goal would grade as unaffordable the moment
 * you reopened it.
 *
 * Never negative — an over-committed reader has zero left, not minus twelve
 * thousand, and a negative capacity fed to the goal engine would produce
 * nonsense feasibility grades rather than the honest "beyond reach".
 */
export function remainingCapacity(
  savingsCapacity: number,
  goals: readonly SavedGoal[],
  excludingGoalType?: string
): number {
  if (!Number.isFinite(savingsCapacity) || savingsCapacity <= 0) return 0;
  const others = goals.filter((g) => g.goalType !== excludingGoalType);
  return Math.max(0, savingsCapacity - totalCommitted(others));
}

// ── Liquidity allocation map ──

export type HorizonKey = "now" | "short" | "medium" | "long";

export interface Horizon {
  key: HorizonKey;
  label: string;
  /** Inclusive lower bound in years. */
  fromYears: number;
  /** Exclusive upper bound in years; Infinity for the last bucket. */
  toYears: number;
  vehicle: string;
  /** Why this bucket can't use the next one along. */
  why: string;
}

/**
 * The bands are set by what the money must be able to do, not by round
 * numbers. Under a year the capital has to come back intact and on demand, so
 * price risk is not available at any yield. Past ten years the reader is being
 * paid for term and the long bond is the instrument that pays it.
 */
export const HORIZONS: readonly Horizon[] = [
  {
    key: "now",
    label: "Within a year",
    fromYears: 0,
    toYears: 1,
    vehicle: "Money market fund or 91-day Treasury bill",
    why: "The money is spent before any longer paper matures, so it has to stay liquid and at par.",
  },
  {
    key: "short",
    label: "1 to 3 years",
    fromYears: 1,
    toYears: 3,
    vehicle: "182 or 364-day Treasury bill, rolled",
    why: "Long enough to earn the bill rate, short enough that a roll always lands before the goal date.",
  },
  {
    key: "medium",
    label: "3 to 10 years",
    fromYears: 3,
    toYears: 10,
    vehicle: "Medium-tenor Treasury bond held to maturity",
    why: "Held to maturity the price swings do not matter, and the coupon beats rolling bills.",
  },
  {
    key: "long",
    label: "10 years or more",
    fromYears: 10,
    toYears: Infinity,
    vehicle: "Long Treasury bond or infrastructure bond",
    why: "Only this horizon can be paid for term — and an IFB's coupon is free of withholding tax.",
  },
] as const;

const DAYS_PER_YEAR = 365.25;

/** Today as an ISO date, so callers can pin it in tests. */
function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * When a goal's money is needed — from the stored date, or derived from
 * `savedAt + years` for goals saved before the field existed.
 *
 * Derived rather than migrated. Those goals live in readers' browsers and
 * there is no server to rewrite them from; a write-on-read migration would
 * mutate somebody's data to fix a display bug, and is a code path that can
 * half-run on a tab that closes. This gives the same answer, rewrites nothing,
 * and has no half-state.
 *
 * Null when neither is usable, so callers fall back to the frozen `years`
 * rather than inventing a date.
 */
/**
 * The ISO date `years` from now — what a planner stores at the moment of
 * saving, so the goal counts down instead of standing still.
 */
export function targetDateIn(years: number, from: Date = new Date()): string {
  const safe = Number.isFinite(years) ? Math.max(0, years) : 0;
  return new Date(from.getTime() + safe * DAYS_PER_YEAR * 86_400_000)
    .toISOString()
    .slice(0, 10);
}

export function targetDateFor(
  goal: Pick<SavedGoal, "targetDate" | "savedAt" | "years">
): string | null {
  if (goal.targetDate && !Number.isNaN(Date.parse(goal.targetDate))) return goal.targetDate;
  const saved = Date.parse(goal.savedAt);
  if (Number.isNaN(saved) || !Number.isFinite(goal.years)) return null;
  return new Date(saved + goal.years * DAYS_PER_YEAR * 86_400_000).toISOString().slice(0, 10);
}

/**
 * Years from TODAY until the money is needed. Every horizon decision must use
 * this rather than `goal.years`.
 *
 * `goal.years` is the horizon as planned and does not count down, so the
 * liquidity map aged silently: a goal saved four years out stayed four years
 * out forever. Money due next spring kept being routed to a medium-tenor bond,
 * the goal list kept saying "in 4 yrs", and nothing on the page revealed that
 * the map had been drawn years earlier.
 *
 * Never negative. A goal whose date has passed needs its money NOW — the most
 * liquid bucket — and a negative would land there by accident rather than on
 * purpose, via the junk guard in horizonFor.
 */
export function yearsRemaining(
  goal: Pick<SavedGoal, "targetDate" | "savedAt" | "years">,
  today: string = todayIso()
): number {
  const fallback = Number.isFinite(goal.years) ? Math.max(0, goal.years) : 0;
  const target = targetDateFor(goal);
  if (target === null) return fallback;
  const days = (Date.parse(target) - Date.parse(today)) / 86_400_000;
  return Number.isNaN(days) ? fallback : Math.max(0, days / DAYS_PER_YEAR);
}

/**
 * Time LEFT, phrased so it stays true as it shrinks.
 *
 * "in 4 yrs" on a goal saved four years ago was the visible half of the same
 * bug that mis-bucketed it: the stored `years` is the plan, not the countdown.
 *
 * Lives here, exported, because it was briefly written TWICE — once in the map
 * and once in the Pesa Picture goal list — which is precisely how two pages
 * come to disagree about the same date. One copy, or this comment is a lie.
 */
export function formatRemaining(years: number): string {
  if (years < 1 / 12) return "due now";
  if (years < 1) {
    const months = Math.max(1, Math.round(years * 12));
    return `in ${months} ${months === 1 ? "month" : "months"}`;
  }
  const rounded = Math.round(years * 10) / 10;
  const shown = rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1);
  return `in ${shown} ${rounded === 1 ? "yr" : "yrs"}`;
}

export function horizonFor(years: number): Horizon {
  // NaN and negatives are junk and fall to the nearest bucket. Infinity does
  // NOT: an infinitely distant goal is the furthest horizon, and the blanket
  // isFinite guard used to route it to "within a year" — telling a reader to
  // hold it liquid, the opposite of the truth.
  if (Number.isNaN(years) || years < 0) return HORIZONS[0];
  return HORIZONS.find((h) => years >= h.fromYears && years < h.toYears) ?? HORIZONS[HORIZONS.length - 1];
}

/**
 * A benchmark yield with its BASIS attached.
 *
 * The basis is not decoration. Bill figures in the feed are `netEAY` — after
 * 15% withholding — while the bond bands are gross clearing rates the feed
 * publishes untaxed. Showing 9.1% beside 13.0% without saying that one is net
 * and the other gross invites exactly the comparison the reader should not
 * make, and computing a net bond figure here would mean picking a withholding
 * band (0% IFB, 10% at ten years or more, 15% below) that the feed does not
 * tell us. So we quote what is published and label it.
 */
export interface BenchmarkYield {
  /** Annual rate as a fraction, e.g. 0.0908. Low end when a range applies. */
  low: number;
  /** Equals `low` when a single instrument or band covers the horizon. */
  high: number;
  basis: "net" | "gross";
  label: string;
}

export interface AllocationBucket {
  horizon: Horizon;
  goals: SavedGoal[];
  /** Sum of requiredMonthly for the goals in this bucket. */
  monthly: number;
  /** Share of all committed monthly savings, 0–1. Null when nothing is committed. */
  share: number | null;
  /** Null when the feed has no figure for this vehicle — never a borrowed one. */
  benchmark: BenchmarkYield | null;
}

/**
 * The bond bands that actually OVERLAP a horizon.
 *
 * The horizons here are set by what the money must be able to do — money
 * wanted in eight months cannot be in a twelve-year bond at any yield — and
 * the feed's auction bands are set by how CBK groups its auctions. The two
 * were chosen independently and do not line up, which is fine until something
 * has to pick one for the other.
 *
 * The first version picked by hardcoded label: "3–7y" for the 3-to-10 bucket
 * and "12–20y" for 10-plus. Both were wrong at the edges. An eight-year goal
 * was quoted a 3–7y rate for a bond it would not be buying, a ten-year goal
 * was quoted a 12–20y rate for the same reason, and "7–12y" — the deepest
 * sample in the feed at fifteen auctions — was never used at all.
 *
 * The horizons win, because they describe the reader's constraint rather than
 * our data's shape. So the BANDS bend: every band overlapping the horizon is
 * taken, and when several do, the answer is a range rather than a point. A
 * bucket spanning three auction bands does not have one rate, and inventing a
 * midpoint would be a precision the auctions never had.
 *
 * Bands the feed refuses to quote — `medianClearingRate: null`, too few
 * auctions — drop out here rather than being interpolated from neighbours.
 */
function bandsOverlapping(horizon: Horizon): BondBand[] {
  const bands = RATES.bondAuctionBenchmarks?.bands ?? [];
  return bands.filter(
    (b) =>
      b.medianClearingRate !== null &&
      b.fromYears < horizon.toYears &&
      b.toYears > horizon.fromYears
  );
}

/** "a", "a and b", "a, b and c" — three bands joined with "and" thrice read as a stutter. */
function joinLabels(labels: string[]): string {
  if (labels.length <= 1) return labels[0] ?? "";
  return `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}`;
}

function benchmarkFor(horizon: Horizon): BenchmarkYield | null {
  const key = horizon.key;
  if (key === "now") {
    // assumedMmfYield() is built from the 91-day bill's GROSS effective annual
    // yield with a zero spread (lib/mmf-assumption.ts), so it is gross too —
    // MMF distributions carry the same 15% withholding. This was labelled
    // "net" until the unit test read the figure it was quoting.
    const rate = assumedMmfYield();
    return Number.isFinite(rate) && rate > 0
      ? { low: rate, high: rate, basis: "gross", label: "assumed money market yield" }
      : null;
  }
  if (key === "short") {
    // THE FEED PUBLISHES PERCENTAGE POINTS, NOT FRACTIONS. netEAY is 7.6651,
    // meaning 7.67%. Quoting it unscaled beside the MMF's 0.0908 would have
    // rendered "766.5%" next to "9.1%" on the same card.
    const bill = tbillRate(364);
    return bill && Number.isFinite(bill.netEAY)
      ? { low: bill.netEAY / 100, high: bill.netEAY / 100, basis: "net", label: "364-day Treasury bill" }
      : null;
  }
  const bands = bandsOverlapping(horizon);
  // Every overlapping band was refused by the feed, or there are none. We
  // refuse too rather than reach outside the horizon for a term the reader
  // would not be buying.
  if (bands.length === 0) return null;
  const medians = bands.map((b) => b.medianClearingRate! / 100);
  return {
    low: Math.min(...medians),
    high: Math.max(...medians),
    basis: "gross",
    label: `${joinLabels(bands.map((b) => b.label))} bond auctions, median clearing rate`,
  };
}

/**
 * Every horizon bucket, always all four, with the goals that fall in each.
 *
 * Empty buckets are kept deliberately: the gap in a reader's plan is a finding,
 * not whitespace. Somebody with four long-dated goals and nothing inside a year
 * has no emergency money, and a map that quietly dropped the empty row would
 * be hiding the most useful thing on the page.
 */
export function buildAllocationMap(
  goals: readonly SavedGoal[],
  today: string = todayIso()
): AllocationBucket[] {
  const total = totalCommitted(goals);
  return HORIZONS.map((horizon) => {
    // yearsRemaining, not g.years — see its docstring. Bucketing on the frozen
    // planned horizon is what let this map age silently.
    const inBucket = goals.filter((g) => horizonFor(yearsRemaining(g, today)).key === horizon.key);
    const monthly = totalCommitted(inBucket);
    return {
      horizon,
      goals: inBucket,
      monthly,
      share: total > 0 ? monthly / total : null,
      benchmark: benchmarkFor(horizon),
    };
  });
}
