import { solveYearsToTarget } from "./goal-planner";
import { TARGET_MMF_YIELD } from "./journey";
import { TBILL_RATES } from "./rates-feed";

/**
 * 2026 Kenyan macro benchmarks (product-spec constants). These are quoted
 * baselines, not promises — every consuming UI says "check current rates".
 */
// Independently-set from the journey funnel's own inflation assumption
// (lib/journey.ts CURRENT_INFLATION, 0.067) — both are "quoted baseline,
// check current rates" estimates rather than a single tracked figure, so
// they aren't merged here; harmonizing them is a product call, not a
// mechanical fix.
export const KENYAN_INFLATION = 0.064; // KNBS baseline
// Same real-world assumption as lib/journey.ts's TARGET_MMF_YIELD — kept as
// one shared constant so the FIRE calculator and the journey funnel never
// silently disagree on the MMF baseline they're both quoting.
export const NOMINAL_RETIREMENT_YIELD = TARGET_MMF_YIELD;
export const LOCAL_SAFE_WITHDRAWAL_RATE = 0.05; // localized SWR (net real return)
export const SACCO_LEVERAGE_MULTIPLIER = 3.0;
export const MAX_SALARY_DEBT_LIMIT = 0.33; // one-third gross pay rule
/**
 * T-bill yields are no longer constants here.
 *
 * They used to be three hardcoded numbers — 0.0883 / 0.0896 / 0.0899 — copied
 * from CBK's published quotes and then multiplied by capital as though a quote
 * were a return. It is not. CBK quotes a DISCOUNT rate: the discount is earned
 * on a smaller outlay (so the true gross yield is higher) and 15% withholding
 * tax then applies (so the net is lower). Using the quote was wrong in both
 * directions at once and overstated a KES 300,000 ladder by about KES 2,300 a
 * year.
 *
 * The live, correctly computed figures now come from lib/rates-feed.ts, which
 * reads the feed published by Mwangaza Yield — the sister tool that derives
 * these conventions from CBK data and verifies them against real broker
 * contract notes. See that file for why we read an answer instead of copying
 * a formula.
 */
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

/**
 * The minimum that makes a THREE-TENOR LADDER executable, not the minimum for
 * a single bill.
 *
 * This was 50,000, which was wrong twice. CBK's minimum for a Treasury bill is
 * KES 100,000 (bonds are 50,000 — the two were conflated), and the ladder
 * splits capital into thirds, so a reader following this tool at the old
 * threshold would have tried to bid ~16,667 per tenor and had every bid
 * rejected. The figure now comes from the published feed and is multiplied by
 * the number of rungs, so the tool cannot again advertise a plan that CBK will
 * not accept.
 */
export const DHOWCSD_BILL_MINIMUM = TBILL_RATES[0]?.minInvestmentKES ?? 100_000;
export const DHOWCSD_MINIMUM = DHOWCSD_BILL_MINIMUM * TBILL_RATES.length;

export interface LadderBucket {
  label: string;
  days: 91 | 182 | 364;
  /** NET effective annual yield, after 15% withholding tax. Project from this. */
  yieldRate: number;
  /** CBK's published quote, for showing the reader the gap. Never project from it. */
  quotedRate: number;
  /** Effective annual yield before tax. */
  grossRate: number;
  allocation: number;
  annualYieldKes: number;
}

export interface DhowcsdLadder {
  buckets: LadderBucket[];
  /** Weighted by allocation, not a plain average of the three tenors. */
  blendedYield: number;
  ladderAnnualKes: number;
  bankAnnualKes: number;
  advantageKes: number;
  /** Capital that could not be placed because a rung fell below the minimum. */
  unallocatedKes: number;
  /** True when the reader set the weights themselves. */
  tailored: boolean;
}

/**
 * How capital is split across the three tenors, as weights.
 *
 * Equal thirds is a reasonable default and a poor answer to most real
 * questions. Somebody holding a deposit they may need in a hurry wants the
 * 91-day rung heavy; somebody parking a bonus for a year wants the 364-day
 * rung heavy, because it pays the most. Forcing thirds on both was the tool
 * deciding a trade-off that belongs to the reader.
 *
 * Weights are relative, not percentages — {91: 2, 182: 1, 364: 1} means half
 * in the 91-day. They are normalised here so the UI never has to make them
 * sum to anything.
 */
export type TenorWeights = Record<number, number>;

export const EVEN_WEIGHTS: TenorWeights = { 91: 1, 182: 1, 364: 1 };

const BUCKET_LABELS: Record<number, string> = {
  91: "Quarterly Liquidity Wheel",
  182: "Mid-Term Shield",
  364: "The Inflation Crusher",
};

/**
 * Capital split evenly across the three tenors, projected on NET yields.
 *
 * Every rate here is after 15% withholding tax, because that is the money that
 * reaches the holder — and because the bank baseline it is compared against is
 * a headline rate a saver would also be taxed on. Quoting a gross ladder
 * against a bank rate would flatter the ladder for free; it wins on the honest
 * comparison anyway.
 */
export function dhowcsdLadder(
  totalCapital: number,
  weights: TenorWeights = EVEN_WEIGHTS
): DhowcsdLadder {
  // A rung weighted to zero is a rung the reader removed. Dropping it entirely
  // beats showing a KES 0 bill they cannot buy.
  const active = TBILL_RATES.filter((r) => (weights[r.tenorDays] ?? 0) > 0);
  const totalWeight = active.reduce((sum, r) => sum + (weights[r.tenorDays] ?? 0), 0);

  const raw = active.map((rate) => ({
    rate,
    share: totalWeight > 0 ? (weights[rate.tenorDays] ?? 0) / totalWeight : 0,
  }));

  /*
   * ROUNDING DOWN, AND WHY IT IS NOT PEDANTRY
   *
   * CBK takes a bid of KES 100,000 and then multiples of 50,000. A weighted
   * split lands on figures like 133,333, which is not a bid anybody can place,
   * so each rung is floored to a placeable amount. A rung that cannot reach
   * the 100,000 minimum is dropped rather than shown — this tool used to
   * advertise KES 16,667 bids that CBK would have rejected outright, and the
   * fix is worth nothing if a custom weighting reintroduces it.
   *
   * What the rounding leaves over is reported as unallocatedKes instead of
   * being quietly folded into a rung, because the reader's weights are then
   * no longer the weights being shown.
   */
  const STEP = 50_000;
  const placeable: { rate: (typeof TBILL_RATES)[number]; allocation: number }[] = [];
  for (const { rate, share } of raw) {
    const target = totalCapital * share;
    const floored = Math.floor(target / STEP) * STEP;
    if (floored >= DHOWCSD_BILL_MINIMUM) placeable.push({ rate, allocation: floored });
  }

  const buckets: LadderBucket[] = placeable.map(({ rate, allocation }) => ({
    label: BUCKET_LABELS[rate.tenorDays] ?? `${rate.tenorDays}-day`,
    days: rate.tenorDays as 91 | 182 | 364,
    yieldRate: rate.netEAY / 100,
    quotedRate: rate.quotedDiscountRate / 100,
    grossRate: rate.grossEAY / 100,
    allocation,
    annualYieldKes: (allocation * rate.netEAY) / 100,
  }));

  const placed = buckets.reduce((sum, b) => sum + b.allocation, 0);
  const ladderAnnualKes = buckets.reduce((sum, b) => sum + b.annualYieldKes, 0);
  // Weighted by money, not a plain mean: with 90% in the 364-day rung the
  // blended yield must sit near that rung's, and an unweighted average would
  // report the same figure whatever the reader chose.
  const blendedYield = placed > 0 ? ladderAnnualKes / placed : 0;
  const bankAnnualKes = totalCapital * BANK_SAVINGS_BASELINE;

  const tailored = TBILL_RATES.some(
    (r) => (weights[r.tenorDays] ?? 0) !== (EVEN_WEIGHTS[r.tenorDays] ?? 0)
  );

  return {
    buckets,
    blendedYield,
    ladderAnnualKes,
    bankAnnualKes,
    advantageKes: ladderAnnualKes - bankAnnualKes,
    unallocatedKes: Math.max(0, totalCapital - placed),
    tailored,
  };
}
