/**
 * The whole cost of educating one child, year by year, to the end of school.
 *
 * WHY THIS EXISTS
 * ---------------
 * Both education tools in this codebase model school fees as ONE OR TWO FUTURE
 * LUMP SUMS. The education-savings calculator asks for "Junior Secondary total
 * fees" and "Senior Secondary total fees" and solves a future-value equation
 * for each. The termly smoother takes this year's fees and divides by twelve.
 *
 * Both are correct for the family they were written for: one on the public
 * track, where Junior Secondary is capitated and the only real bill is three
 * years of Senior School at the Ministry's uniform rate. For that family the
 * liability genuinely is a lump some years away, and a future-value solve is
 * the right instrument.
 *
 * A private-school family is in a different situation, and not by a margin:
 *
 *   1. THE BILL HAS ALREADY STARTED. Fees are due this January and every
 *      January until Grade 12. There is no accumulation phase to solve for —
 *      saving and spending overlap for the entire fourteen years. A
 *      future-value solve assumes an untouched fund and structurally cannot
 *      express this.
 *
 *   2. IT COMPOUNDS FOR FOURTEEN YEARS. Escalation is the dominant term over
 *      that horizon, not a detail. The smoother has an escalation slider but
 *      applies it to ONE year ahead; the savings calculator has none at all,
 *      so a parent typing today's fee against a nine-year horizon understates
 *      the bill by roughly half.
 *
 *   3. THE TOTAL IS NEVER SHOWN ANYWHERE. Not in either tool, not on the
 *      dashboard. "What does this child cost me between now and Grade 12" is
 *      the question a parent is actually asking, and the honest answer is a
 *      number neither tool can currently produce.
 *
 *   4. SIBLINGS OVERLAP. What breaks a household is not the average year, it
 *      is the peak year when two children are both in senior school. The
 *      smoother multiplies by a child count, which assumes every child costs
 *      the same and is in the same grade — true of neither.
 *
 * This module answers those four. It is deliberately a pure schedule-and-solve
 * library with no React in it, so the same maths can drive the JiPange planner
 * and be handed to Mwangaza's bond ladder as a target cash-flow.
 *
 * WHAT IT DOES NOT DO
 * -------------------
 * It does not claim to know what a private school charges. See FEE_ANCHORS.
 */

import { CBC_GRADES } from "./cbc-grades";
import { assumedMmfYield } from "./mmf-assumption";
import { DEFAULT_INFLATION_RATE } from "./projections";

/* ------------------------------------------------------------------ stages */

export type Stage = "pre-primary" | "primary" | "junior" | "senior" | "university";

/**
 * Where each CBC grade sits, by index into CBC_GRADES.
 *
 * CBC is 2-6-3-3: two years pre-primary, six primary, three junior secondary,
 * three senior. Fourteen years of schooling, and — the point of this module —
 * a private-school parent pays for all fourteen rather than for the three the
 * public-track tools model.
 */
function stageForIndex(i: number): Stage {
  if (i < 2) return "pre-primary";
  if (i < 8) return "primary";
  if (i < 11) return "junior";
  return "senior";
}

/** Index of a grade value in the CBC ladder, or -1. */
export function gradeIndex(value: string): number {
  return CBC_GRADES.findIndex((g) => g.value === value);
}

/** The last grade of school. Everything after this is university, if chosen. */
export const LAST_GRADE_INDEX = CBC_GRADES.length - 1;

/* ------------------------------------------------------------- fee anchors */

/**
 * Published fee levels, each tied to a NAMED school or a Ministry circular.
 *
 * There is no such thing as "the average Kenyan private school fee", and a
 * tool that invents one is doing the thing this codebase spent a long session
 * removing: printing a plausible number with no source behind it. Private fees
 * span two orders of magnitude — a county academy and Brookhouse are both
 * "private schools" and are not in the same conversation.
 *
 * So each anchor names the institution it came from, and the UI presents them
 * as REFERENCE POINTS to pick the nearest of and then overwrite with the
 * reader's actual invoice. The reader's own figure is always the better input;
 * these exist so that somebody at the "what would this even cost?" stage gets
 * a real published number rather than a guess dressed as a market rate.
 *
 * The two public entries are different in kind and stronger: they are set by
 * the Ministry, uniform nationally, and already used elsewhere in this
 * codebase.
 */
export interface FeeAnchor {
  readonly key: string;
  readonly label: string;
  readonly annualKES: number;
  readonly source: string;
  /** True where the figure is a national rule rather than one school's price. */
  readonly statutory: boolean;
}

export const FEE_ANCHORS: readonly FeeAnchor[] = [
  {
    key: "public-day",
    label: "Public day school",
    annualKES: 9_374,
    source: "Ministry of Education, uniform senior school day fee for 2026",
    statutory: true,
  },
  {
    key: "public-boarding",
    label: "Public boarding school",
    annualKES: 53_554,
    source: "Ministry of Education, uniform senior school boarding fee for 2026",
    statutory: true,
  },
  {
    key: "private-day",
    label: "Private day school — mid-tier",
    annualKES: 333_500,
    source: "Nairobi Academy published day fee, 2025/26 first year of enrolment",
    statutory: false,
  },
  {
    key: "international-day",
    label: "International curriculum — day",
    annualKES: 650_000,
    source: "Nairobi International School published day fee, 2026/27 first year",
    statutory: false,
  },
  {
    key: "international-premium",
    label: "International curriculum — premium",
    annualKES: 2_550_000,
    source: "Braeburn School published senior tuition, 2026 schedule",
    statutory: false,
  },
];

export function feeAnchor(key: string): FeeAnchor | undefined {
  return FEE_ANCHORS.find((a) => a.key === key);
}

/**
 * Default annual fee escalation, as a decimal.
 *
 * DELIBERATELY NOT A MEASUREMENT, and the comment matters more than the value.
 *
 * The tempting figure was an education-CPI print of 18.3% year-on-year that
 * appears in secondary reporting. It is not used here, for two reasons. It
 * could not be traced to a KNBS release from this environment; and the general
 * inflation figure quoted beside it belongs to a different month than the one
 * the sentence claims, which is the signature of a number that has been
 * copied between articles rather than read off a table. Shipping it would put
 * an unverifiable figure at the centre of a fourteen-year projection, where it
 * compounds — the worst possible place for one.
 *
 * What IS well attested is a range: private schools in Kenya are widely
 * reported to raise fees by five to fifteen per cent a year, and Braeburn's
 * 2026 schedule went up twelve. 8% sits inside that, matches the default the
 * termly smoother already ships, and is a plainly-labelled ASSUMPTION the
 * reader is asked to replace with their own school's history — which they
 * have, on last year's invoice, and which is better evidence than any national
 * average could be.
 */
export const DEFAULT_FEE_ESCALATION = 0.08;

/** The band the default is chosen from, quoted to the reader as such. */
export const FEE_ESCALATION_TYPICAL_RANGE = { low: 0.05, high: 0.15 } as const;

/* ---------------------------------------------------------------- schedule */

export interface FeeYear {
  /** Calendar year the January term falls in. */
  readonly calendarYear: number;
  /** Years from now: 0 is the bill due this coming January. */
  readonly yearsAhead: number;
  readonly gradeLabel: string;
  readonly stage: Stage;
  /** Escalated, i.e. the number that will actually be invoiced. */
  readonly feeKES: number;
  /** The same bill expressed in today's purchasing power. */
  readonly feeTodayKES: number;
}

export interface ChildPlan {
  readonly name: string;
  readonly years: readonly FeeYear[];
  /** Sum of what will be invoiced, in the shillings of each year. */
  readonly totalNominalKES: number;
  /** Sum discounted to today — what the liability is worth now. */
  readonly totalTodayKES: number;
  /** The naive answer: this year's fee times the number of years left. */
  readonly totalIfFeesNeverRoseKES: number;
}

export interface ChildInput {
  readonly name?: string;
  /** A value from CBC_GRADES, e.g. "grade3". */
  readonly gradeValue: string;
  /** Annual fee at TODAY's prices, for this child's school. */
  readonly annualFeeTodayKES: number;
  /** Annual fee escalation as a decimal. */
  readonly escalation?: number;
  /** Add four years of university after Grade 12. */
  readonly universityYears?: number;
  /** Annual university cost at today's prices. */
  readonly universityAnnualTodayKES?: number;
}

/**
 * Every remaining year of school for one child, escalated.
 *
 * The child's CURRENT year is included: a private-school parent has this
 * January's bill ahead of them, not behind them. That is the difference
 * between this and the existing calculator, which starts counting at the next
 * CBC transition and so silently omits every year between now and it.
 */
export function buildChildPlan(
  input: ChildInput,
  opts: { inflation?: number; asOfYear?: number } = {}
): ChildPlan {
  const inflation = opts.inflation ?? DEFAULT_INFLATION_RATE;
  const thisYear = opts.asOfYear ?? new Date().getFullYear();
  const escalation = input.escalation ?? DEFAULT_FEE_ESCALATION;
  const baseFee = Math.max(0, input.annualFeeTodayKES || 0);

  const start = gradeIndex(input.gradeValue);
  const years: FeeYear[] = [];

  if (start >= 0) {
    for (let i = start; i <= LAST_GRADE_INDEX; i++) {
      const yearsAhead = i - start;
      years.push({
        calendarYear: thisYear + yearsAhead,
        yearsAhead,
        gradeLabel: CBC_GRADES[i].label,
        stage: stageForIndex(i),
        feeKES: Math.round(baseFee * Math.pow(1 + escalation, yearsAhead)),
        feeTodayKES: Math.round(
          (baseFee * Math.pow(1 + escalation, yearsAhead)) / Math.pow(1 + inflation, yearsAhead)
        ),
      });
    }
  }

  const uniYears = Math.max(0, Math.floor(input.universityYears ?? 0));
  const uniFee = Math.max(0, input.universityAnnualTodayKES ?? 0);
  const afterSchool = years.length;
  for (let u = 0; u < uniYears; u++) {
    const yearsAhead = afterSchool + u;
    years.push({
      calendarYear: thisYear + yearsAhead,
      yearsAhead,
      gradeLabel: `University year ${u + 1}`,
      stage: "university",
      feeKES: Math.round(uniFee * Math.pow(1 + escalation, yearsAhead)),
      feeTodayKES: Math.round(
        (uniFee * Math.pow(1 + escalation, yearsAhead)) / Math.pow(1 + inflation, yearsAhead)
      ),
    });
  }

  return {
    name: input.name?.trim() || "Child",
    years,
    totalNominalKES: years.reduce((s, y) => s + y.feeKES, 0),
    totalTodayKES: years.reduce((s, y) => s + y.feeTodayKES, 0),
    /* The comparison that makes escalation visible. A parent who mentally
     * multiplies this year's fee by the years remaining — which is what
     * everyone does, and what the current calculator invites — lands here,
     * and the gap against totalNominalKES is the part that ambushes them. */
    totalIfFeesNeverRoseKES: baseFee * (LAST_GRADE_INDEX - Math.max(0, start) + 1) +
      uniFee * uniYears,
  };
}

/* -------------------------------------------------------------- households */

export interface HouseholdYear {
  readonly calendarYear: number;
  readonly yearsAhead: number;
  readonly totalKES: number;
  readonly perChild: readonly { name: string; gradeLabel: string; feeKES: number }[];
}

export interface HouseholdPlan {
  readonly children: readonly ChildPlan[];
  readonly years: readonly HouseholdYear[];
  readonly totalNominalKES: number;
  readonly totalTodayKES: number;
  /** The year the household pays the most. This is what actually breaks people. */
  readonly peakYear: HouseholdYear | null;
  readonly lastYear: number | null;
}

/**
 * Several children on one timeline.
 *
 * The peak year is the output that justifies the whole module. A household
 * with children in Grade 2 and Grade 5 has a comfortable few years and then a
 * stretch where both are in senior school simultaneously and the annual bill
 * roughly doubles — while fees have also escalated for a decade. Nothing in
 * either existing tool can surface that, because neither has a timeline.
 */
export function buildHouseholdPlan(
  inputs: readonly ChildInput[],
  opts: { inflation?: number; asOfYear?: number } = {}
): HouseholdPlan {
  const children = inputs.map((c, i) =>
    buildChildPlan({ ...c, name: c.name?.trim() || `Child ${i + 1}` }, opts)
  );

  const byYear = new Map<number, HouseholdYear>();
  for (const child of children) {
    for (const y of child.years) {
      const existing = byYear.get(y.calendarYear);
      const entry = { name: child.name, gradeLabel: y.gradeLabel, feeKES: y.feeKES };
      if (existing) {
        byYear.set(y.calendarYear, {
          ...existing,
          totalKES: existing.totalKES + y.feeKES,
          perChild: [...existing.perChild, entry],
        });
      } else {
        byYear.set(y.calendarYear, {
          calendarYear: y.calendarYear,
          yearsAhead: y.yearsAhead,
          totalKES: y.feeKES,
          perChild: [entry],
        });
      }
    }
  }

  const years = [...byYear.values()].sort((a, b) => a.calendarYear - b.calendarYear);

  return {
    children,
    years,
    totalNominalKES: children.reduce((s, c) => s + c.totalNominalKES, 0),
    totalTodayKES: children.reduce((s, c) => s + c.totalTodayKES, 0),
    peakYear: years.reduce<HouseholdYear | null>(
      (best, y) => (best === null || y.totalKES > best.totalKES ? y : best),
      null
    ),
    lastYear: years.length ? years[years.length - 1].calendarYear : null,
  };
}

/* ------------------------------------------------------- the level payment */

/** Kenyan school terms open in January, May and September. */
export const TERM_MONTHS = [0, 4, 8] as const;
/** Many schools bill about half the year in Term 1. */
export const FRONT_LOADED_SPLIT = [0.5, 0.3, 0.2] as const;
export const EVEN_SPLIT = [1 / 3, 1 / 3, 1 / 3] as const;

/**
 * Months of saving before the first bill the fund is responsible for.
 *
 * WHY THIS IS NOT ZERO, AND WHY IT IS THE MOST IMPORTANT PARAMETER HERE
 * ---------------------------------------------------------------------
 * With no lead time the arithmetic degenerates, and it took a failing test to
 * see it. If the fund must meet a January bill in its first month, the whole
 * solve collapses onto that one payment: the required contribution is just
 * the first term's fee, every later year is trivially covered, and the answer
 * stops responding to escalation or to the expected return at all. Two of the
 * invariants below caught exactly that — `at(0.12)` and `at(0.05)` returned
 * the identical figure, and the interest the fund contributed came out as
 * zero.
 *
 * That was not a bug in the solver. It was the solver correctly answering a
 * question nobody should ask. A parent whose fees are due this month cannot
 * smooth this month's fees; that money is already spoken for. What they can do
 * is start now so that NEXT January arrives funded.
 *
 * So the fund is given a year of runway by default, which is also precisely
 * what the termly smoother has always assumed without saying so. Set it to
 * zero only to model a fund that must pay out immediately — and expect the
 * degenerate answer, because it is the true one.
 */
export const DEFAULT_LEAD_MONTHS = 12;

export interface FundMonth {
  readonly monthIndex: number;
  readonly contributionKES: number;
  readonly feePaidKES: number;
  readonly balanceKES: number;
}

/**
 * Runs a fund forward month by month, paying fees as they fall due.
 *
 * This is the piece the existing calculator cannot do. `solveMonthlyContribution`
 * grows an untouched pot to a target; a private-school fund is being drained
 * three times a year for fourteen years while it grows. The difference is not
 * a refinement — a fund that must pay out in month one has no compounding to
 * lean on, so the required contribution is far higher than any future-value
 * solve would report.
 */
export function simulateFund(params: {
  years: readonly { yearsAhead: number; feeKES: number }[];
  monthlyContribution: number;
  openingBalanceKES?: number;
  annualReturn?: number;
  frontLoaded?: boolean;
  leadMonths?: number;
}): { months: FundMonth[]; minBalanceKES: number; endBalanceKES: number; feasible: boolean } {
  const rate = (params.annualReturn ?? assumedMmfYield()) / 12;
  const split = params.frontLoaded ? FRONT_LOADED_SPLIT : EVEN_SPLIT;
  const lead = Math.max(0, Math.round(params.leadMonths ?? DEFAULT_LEAD_MONTHS));

  /* Fee draws keyed by absolute month index, so the schedule is built once
   * rather than searched inside the loop. */
  const draws = new Map<number, number>();
  let horizon = 0;
  for (const y of params.years) {
    for (let t = 0; t < TERM_MONTHS.length; t++) {
      const m = lead + y.yearsAhead * 12 + TERM_MONTHS[t];
      draws.set(m, (draws.get(m) ?? 0) + y.feeKES * split[t]);
      if (m + 1 > horizon) horizon = m + 1;
    }
  }

  let balance = params.openingBalanceKES ?? 0;
  let minBalance = balance;
  const months: FundMonth[] = [];

  for (let m = 0; m < horizon; m++) {
    balance += params.monthlyContribution;
    balance *= 1 + rate;
    const fee = draws.get(m) ?? 0;
    balance -= fee;
    if (balance < minBalance) minBalance = balance;
    months.push({
      monthIndex: m,
      contributionKES: params.monthlyContribution,
      feePaidKES: fee,
      balanceKES: balance,
    });
  }

  return {
    months,
    minBalanceKES: minBalance,
    endBalanceKES: balance,
    /* A tolerance of one shilling, not zero: the balance is a float and the
     * solved contribution lands the fund exactly on empty by construction. */
    feasible: minBalance >= -1,
  };
}

/**
 * The flat monthly amount that funds every bill without the fund ever going
 * negative — the single number this whole module exists to produce.
 *
 * Solved by bisection rather than algebra. There is a closed form for a level
 * annuity against a fixed schedule, but the fee stream here escalates, is
 * split unevenly across three terms, and starts from an arbitrary opening
 * balance; the closed form for that is long enough to be worth getting wrong
 * once. Bisection is monotone here — more contribution can never lower the
 * minimum balance — so it converges, and it stays correct if the schedule
 * shape changes later.
 */
export function solveLevelContribution(params: {
  years: readonly { yearsAhead: number; feeKES: number }[];
  openingBalanceKES?: number;
  annualReturn?: number;
  frontLoaded?: boolean;
  leadMonths?: number;
}): number {
  const total = params.years.reduce((s, y) => s + y.feeKES, 0);
  if (total <= 0) return 0;

  const run = (monthly: number) =>
    simulateFund({ ...params, monthlyContribution: monthly }).feasible;

  if (run(0)) return 0;

  /* Upper bound: paying the entire liability inside the first month is
   * certainly enough, so the answer is bracketed. */
  let lo = 0;
  let hi = total;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (run(mid)) hi = mid;
    else lo = mid;
    if (hi - lo < 0.01) break;
  }
  return Math.ceil(hi);
}

/**
 * What the naive plan costs you.
 *
 * A parent who saves nothing and meets each term from that month's salary is
 * not merely forgoing interest — in practice this is the household that
 * borrows every January, which is the behaviour the education page already
 * names. This reports the interest a smoothed fund earns over the whole
 * horizon, i.e. the part of the fees the fund pays on the parent's behalf.
 */
export function interestContributionKES(params: {
  years: readonly { yearsAhead: number; feeKES: number }[];
  openingBalanceKES?: number;
  annualReturn?: number;
  frontLoaded?: boolean;
  leadMonths?: number;
}): number {
  const monthly = solveLevelContribution(params);
  const sim = simulateFund({ ...params, monthlyContribution: monthly });
  const contributed = monthly * sim.months.length + (params.openingBalanceKES ?? 0);
  const paid = params.years.reduce((s, y) => s + y.feeKES, 0);
  return Math.max(0, Math.round(paid - contributed));
}

/** Share of a net monthly pay packet the level contribution consumes. */
export function shareOfNetPayPct(monthlyContribution: number, netMonthlyPay: number): number {
  if (netMonthlyPay <= 0) return 0;
  return Math.round((monthlyContribution / netMonthlyPay) * 1000) / 10;
}
