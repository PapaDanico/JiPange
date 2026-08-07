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

  const overCommitted = savingsCapacity > 0 && committed > savingsCapacity;

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
  /** Annual rate as a fraction, e.g. 0.0908. */
  rate: number;
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

function bandNamed(label: string): BondBand | null {
  return RATES.bondAuctionBenchmarks?.bands.find((b) => b.label === label) ?? null;
}

function benchmarkFor(key: HorizonKey): BenchmarkYield | null {
  if (key === "now") {
    // assumedMmfYield() is built from the 91-day bill's GROSS effective annual
    // yield with a zero spread (lib/mmf-assumption.ts), so it is gross too —
    // MMF distributions carry the same 15% withholding. This was labelled
    // "net" until the unit test read the figure it was quoting.
    const rate = assumedMmfYield();
    return Number.isFinite(rate) && rate > 0
      ? { rate, basis: "gross", label: "assumed money market yield" }
      : null;
  }
  if (key === "short") {
    // THE FEED PUBLISHES PERCENTAGE POINTS, NOT FRACTIONS. netEAY is 7.6651,
    // meaning 7.67%. Quoting it unscaled beside the MMF's 0.0908 would have
    // rendered "766.5%" next to "9.1%" on the same card.
    const bill = tbillRate(364);
    return bill && Number.isFinite(bill.netEAY)
      ? { rate: bill.netEAY / 100, basis: "net", label: "364-day Treasury bill" }
      : null;
  }
  const band = bandNamed(key === "medium" ? "3–7y" : "12–20y");
  // medianClearingRate is null when too few auctions fell in the band. The
  // feed calls that a refusal, so we refuse too rather than reach for the
  // neighbouring band and quote a term the reader is not buying.
  if (!band || band.medianClearingRate === null) return null;
  return {
    rate: band.medianClearingRate / 100,
    basis: "gross",
    label: `${band.label} bond auctions, median clearing rate`,
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
export function buildAllocationMap(goals: readonly SavedGoal[]): AllocationBucket[] {
  const total = totalCommitted(goals);
  return HORIZONS.map((horizon) => {
    const inBucket = goals.filter((g) => horizonFor(g.years).key === horizon.key);
    const monthly = totalCommitted(inBucket);
    return {
      horizon,
      goals: inBucket,
      monthly,
      share: total > 0 ? monthly / total : null,
      benchmark: benchmarkFor(horizon.key),
    };
  });
}
