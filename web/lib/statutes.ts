/**
 * The statutory instruments behind every payroll figure, with the date each
 * one goes back on the reading list.
 *
 * WHY THIS EXISTS
 * ---------------
 * lib/sources.ts already does this for scalar statistics, and the argument
 * there applies here with more force: a figure about Kenya's economy being
 * stale misleads a reader, but a stale PAYE band changes the number somebody
 * budgets their month against.
 *
 * The tax tables had no such record. Their currency was asserted twice, by
 * hand, in two files that disagreed:
 *
 *   lib/tax.ts                            "rates effective February 2026"
 *   components/tools/CalculatorDisclaimer  "Rates current as of July 2026"
 *
 * Same tables, two dates, five months apart, neither derived from anything.
 * That is precisely the defect sources.ts was built to remove — a claim living
 * in prose where nothing can check it — reappearing in the one place where
 * being wrong costs a user money rather than credibility.
 *
 * WHY A SECOND REGISTRY RATHER THAN AN ENTRY IN sources.ts
 * -------------------------------------------------------
 * A Figure is `value: number` plus attribution, and the satisfies clause there
 * is what makes a missing field a compile error. A PAYE schedule is five bands,
 * NSSF is two limits and a rate, and flattening either into a single number to
 * fit the existing shape would mean the registry no longer describes the thing
 * it claims to govern. These records attribute an INSTRUMENT, not a scalar.
 *
 * WHY A PAST REVIEW DATE DOES NOT FAIL THE BUILD HERE
 * --------------------------------------------------
 * sources.test.ts fails CI when a figure passes its review date, and that is
 * right for a statistic on a landing page: nobody is harmed while the build is
 * red, and the red is what gets somebody to re-read a publication.
 *
 * These tables are different in a way that matters. They are live in twenty-two
 * calculators, and a red build does not take them off the page — it just stops
 * anything else shipping while they go on quietly asserting they are current.
 * The user reading a take-home figure is the one exposed, and CI status is
 * invisible to them.
 *
 * So the gate here points at the reader instead. Past its review date, an
 * instrument is named in a caution line the calculator renders, on screen and
 * on the printed copy. The build stays green; the page stops making a promise
 * nobody has checked. `statutes.test.ts` enforces
 * exactly that, including against a clock wound forward — a guard that cannot
 * fire in the case it exists to detect is the defect this codebase keeps
 * finding in itself, and a staleness gate is the easiest place in the world to
 * write one.
 *
 * WHEN THIS FIRES, THE FIX IS NOT TO MOVE THE DATE.
 * Open the url, read the instrument, confirm or correct the constants in
 * lib/tax.ts, and only then set a new reviewBy from the publisher's cadence.
 * Moving the date alone converts a warning into a lie.
 */

export interface Statute {
  /** The instrument as it should be cited, e.g. "NSSF Act, 2013 (Year 4)". */
  readonly instrument: string;
  /** What it sets, in the terms a reader of the calculator would recognise. */
  readonly governs: string;
  /** Where the constants in lib/tax.ts can be checked. */
  readonly url: string;
  /** When the rates currently encoded took effect. ISO. */
  readonly effectiveFrom: string;
  /**
   * The date after which these constants must be re-read against a fresh
   * publication. Set from the instrument's own amendment cadence plus a grace
   * period, never from convenience. ISO.
   */
  readonly reviewBy: string;
  /** Why the review date is where it is, where that is not obvious. */
  readonly note?: string;
}

export const STATUTES = {
  paye: {
    instrument: "Income Tax Act (Cap 470), PAYE bands as amended",
    governs: "PAYE bands and the monthly personal relief",
    url: "https://www.kra.go.ke/individual/calculate-tax/calculating-tax/paye",
    // The five-band schedule (10 / 25 / 30 / 32.5 / 35) has stood since the
    // Finance Act 2023. lib/tax.ts records it as unchanged for 2025/26.
    effectiveFrom: "2023-07-01",
    /* A Finance Act is assented in late June and takes effect on 1 July, so
     * these constants are re-openable every year on that date. One month of
     * grace covers the gap between assent and the KRA publishing a revised
     * schedule.
     *
     * This date is in the past as it is written, and deliberately left there.
     * The Finance Act 2026 took effect on 1 July 2026; whether it touched the
     * bands has not been verified, because kra.go.ke is blocked by this
     * environment's egress policy and no figure enters this repository on the
     * strength of a guess. Choosing a later date would have made the record
     * green by asserting a check nobody performed — the exact move the header
     * of this file rules out. Past due is the honest state, so the calculators
     * now say so. */
    reviewBy: "2026-07-31",
    note: "Personal relief has been Ksh 2,400/month since January 2018.",
  },

  nssf: {
    instrument: "NSSF Act, 2013 — Year 4 contribution limits",
    governs: "the Tier I and Tier II pensionable earnings limits and the 6% rate",
    url: "https://www.nssf.or.ke/",
    effectiveFrom: "2026-02-01",
    // The Act steps the upper limit annually on 1 February. Year 5 is the next
    // change, so this is stable until then plus two months of grace.
    reviewBy: "2027-03-31",
    note: "Upper limit Ksh 108,000, lower limit Ksh 9,000; Tier II employee maximum Ksh 5,940.",
  },

  shif: {
    instrument: "Social Health Insurance Act, 2024",
    governs: "the 2.75% health contribution and its Ksh 300 monthly minimum",
    url: "https://sha.go.ke/",
    effectiveFrom: "2024-10-01",
    // Set by regulations rather than by an annual Act, so there is no fixed
    // cadence to key on. An annual re-read is the discipline instead.
    reviewBy: "2026-12-31",
  },

  housingLevy: {
    instrument: "Affordable Housing Act, 2024",
    governs: "the 1.5% Affordable Housing Levy",
    url: "https://www.parliament.go.ke/",
    effectiveFrom: "2024-03-19",
    reviewBy: "2026-12-31",
    note: "No cap, and no relief — the 15% AHL relief was repealed by the Tax Laws (Amendment) Act, 2024.",
  },
} as const satisfies Record<string, Statute>;

export type StatuteKey = keyof typeof STATUTES;

const KEYS = Object.keys(STATUTES) as StatuteKey[];

/**
 * The records, widened to the interface.
 *
 * `as const satisfies` keeps the literal types, which is what makes a missing
 * field a compile error — but it also means STATUTES[k] is a union of four
 * distinct shapes, and `note` is optional, so reading it off the union fails
 * to compile on the member that lacks one. Widening once here is the fix;
 * widening at each call site would be the same fix written four times.
 */
const ALL: readonly Statute[] = KEYS.map((k) => STATUTES[k]);

/** Today, from the clock. See statutes.test.ts for why this is not frozen. */
function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * The instruments whose constants are past the date somebody undertook to
 * re-read them. `today` is injectable so the tests can wind the clock forward
 * and watch the guard actually fire.
 */
export function dueForReview(today: string = todayIso()): Statute[] {
  return ALL.filter((s) => s.reviewBy < today);
}

/** The instruments still within their review window. */
export function currentStatutes(today: string = todayIso()): Statute[] {
  return ALL.filter((s) => s.reviewBy >= today);
}

/**
 * WHY THERE IS NO SINGLE "RATES CURRENT AS OF" DATE.
 *
 * The obvious replacement for the hand-typed "July 2026" was one computed
 * date, and the only defensible way to compute it is the OLDEST effective date
 * among the instruments still in review — the weakest link, since a claim that
 * covers four tables is only as true as its stalest one.
 *
 * Computed that way it reads "Rates current as of March 2024", and that is
 * misleading in the opposite direction from the string it replaced. Three of
 * these four instruments are newer than that; NSSF is February 2026. A reader
 * would conclude the whole payroll engine is two years behind, which is false.
 *
 * Both single-date forms are wrong because the underlying fact is not a single
 * date. Four instruments, four amendment cadences. So each one carries its own,
 * in the line that names it, and the aggregate is not stated at all.
 */

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** "2024-10-01" → "October 2024". Month precision: the day is noise to a reader. */
export function formatMonth(iso: string): string {
  const [y, m] = iso.split("-");
  return `${MONTHS[Number(m) - 1]} ${y}`;
}

/**
 * The "Sources:" line, assembled from the records so it cannot drift from
 * them. This was a hand-typed string naming four Acts; nothing connected it to
 * the constants it described.
 *
 * Each entry carries its own effective date — see above for why there is no
 * single one. That also makes the line self-checking to a reader who knows the
 * law: an instrument they know was amended last year, still showing an older
 * date here, is visibly a thing to distrust rather than an invisible one.
 */
/**
 * The per-instrument notes — the actual limits and thresholds in force.
 *
 * These were typed into calculators as extraNotes ("Rates effective February
 * 2026: NSSF Year 4 (lower Ksh 9,000 / upper Ksh 108,000 at 6%)..."), which
 * restated both the constants and a currency date in a place no test could
 * reach. Read from the registry, they are corrected once.
 */
export function statuteNotes(): string[] {
  return ALL.map((s) => s.note).filter((n): n is string => Boolean(n));
}

export function statuteLine(): string {
  return ALL.map(
    (s) => `${s.governs} — ${s.instrument}, from ${formatMonth(s.effectiveFrom)}`
  ).join(" · ");
}
