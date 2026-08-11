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
    instrument: "Income Tax Act (Cap 470), Third Schedule, as amended by the Finance Act, 2023",
    governs: "PAYE bands and the monthly personal relief",
    url: "https://www.kra.go.ke/individual/calculate-tax/calculating-tax/paye",
    // The five-band schedule (10 / 25 / 30 / 32.5 / 35) has stood since the
    // Finance Act 2023. lib/tax.ts records it as unchanged for 2025/26.
    effectiveFrom: "2023-07-01",
    /* A Finance Act is assented in late June and takes effect on 1 July, so
     * these constants are re-openable every year on that date.
     *
     * ── WHY THE REVIEW LANDS ON 30 JUNE AND NOT 31 JULY ────────────────────
     *
     * It used to be 31 July: the commencement date "plus a month of grace for
     * the KRA to publish a revised schedule". That grace pointed the wrong way,
     * for the same reason the NSSF entry's did.
     *
     * If a Finance Act moves the bands on 1 July, this file is WRONG from
     * 1 July — not merely old. A stale CPI print is a true figure about an
     * earlier month; a superseded PAYE band is a false figure about this one,
     * and it feeds every take-home, net-salary and affordability number the
     * product renders. Waiting until 31 July buys us a month without a flag at
     * the cost of a month of wrong arithmetic in the reader\u2019s hands.
     *
     * The grace was also unnecessary. A Finance Act is ASSENTED in late June
     * and states its own rates; we do not need the KRA\u2019s schedule to learn
     * that bands changed, only to cross-check formatting. So 30 June raises the
     * flag while the Act is knowable and before it bites \u2014 which is the
     * only window in which acting on it prevents anything.
     *
     * ── THE FINANCE ACT 2026 REVIEW, AND EXACTLY HOW FAR IT GOT ────────────
     *
     * This entry shipped past due, because the Act took effect on 1 July 2026
     * and nobody had checked whether it moved the bands. It has now been
     * checked, and the finding is that it did not:
     *
     *   - The Act was passed on 18 June 2026 and assented on 23 June 2026,
     *     effective 1 July 2026.
     *   - Reductions to PAYE were PROPOSED and did not survive. ICPAK, the
     *     Kenya Bankers Association and Deloitte pushed to exempt earnings
     *     below Ksh 30,000, and a Clause 22 amendment proposed a new 17.5%
     *     band. Neither reached the enacted Act — the exemption was not in the
     *     published Bill and MPs rejected the push to lower PAYE.
     *   - Multiple independent 2026-dated sources state the five-band schedule
     *     (10 / 25 / 30 / 32.5 / 35) and the Ksh 2,400 relief as still in
     *     force, and attribute the top two bands to the Finance Act 2023.
     *
     * ── AUGUST 2026: KRA'S OWN SCHEDULE HAS NOW BEEN READ ─────────────────
     *
     * The paragraph that stood here said kra.go.ke was "blocked by this
     * environment's egress policy", that only secondary reporting supported
     * the bands, and asked anyone with unblocked access to replace it. It has
     * been replaced, and the premise it rested on was too broad.
     *
     * DIRECT FETCH of kra.go.ke is blocked. DOMAIN-RESTRICTED SEARCH of it is
     * not, and was never tried. Searching the publisher returned KRA's own
     * "Individual Income Tax Bands and Resident Personal Relief" notice and
     * its PAYE pages, which state the schedule directly:
     *
     *   first 24,000/month @ 10% · next 8,333 @ 25% · next 467,667 @ 30%
     *   · next 3,600,000 ANNUALLY @ 32.5% · above 9,600,000 annually @ 35%
     *   · personal relief 2,400/month, 28,800/year
     *
     * That reconciles to the monthly thresholds encoded in lib/tax.ts exactly:
     * 24,000 + 8,333 + 467,667 = 500,000 a month, i.e. the 6,000,000 a year
     * where 32.5% starts; 9,600,000 a year is 800,000 a month. One caution for
     * the next reviewer — KRA's figures are presented in a mix of monthly and
     * annual terms, and at least one summary of that page mislabels the
     * 467,667 monthly step as annual. Check the arithmetic closes at 500,000
     * rather than trusting the label.
     *
     * All five bands and the relief are therefore confirmed against the
     * administering authority's published schedule, not merely corroborated
     * across secondary reporting.
     *
     * WHAT IS STILL NOT DONE: the Finance Act 2026's own text has not been
     * read. KRA's schedule is the administrator's restatement of the law —
     * strong, and what payroll is actually operated against, but not the
     * instrument. The finding that the 2026 Act moved neither the bands nor
     * the relief still rests on the reporting summarised above.
     *
     * ── 11 AUGUST 2026: THE AMENDING INSTRUMENT IS NOW NAMED ───────────────
     *
     * The citation used to read "PAYE bands as amended" — amended by WHAT was
     * left for the reader to discover, which is a poor thing to ask of somebody
     * checking whether we are telling the truth.
     *
     * It is the Finance Act, 2023, amending the THIRD SCHEDULE to the Income
     * Tax Act: assented 26 June 2023, effective 1 July 2023, introducing 32.5%
     * on 500,000–800,000 and 35% above 800,000. Corroborated across law-firm
     * and Big Four commentary (Cliffe Dekker Hofmeyr, EY, RSM) that agrees on
     * the instrument, the schedule amended, the assent date and the rates.
     *
     * THIS IS STILL NOT THE GAZETTED ACT. It is a better CLASS of secondary
     * source — practitioners citing a section rather than blogs citing a
     * number — and it names the mechanism precisely enough for a reader to go
     * and check. It does not upgrade the evidence to primary, and the
     * paragraphs above stand unchanged. */
    reviewBy: "2027-06-30",
    note: "Personal relief has been Ksh 2,400/month since January 2018.",
  },

  nssf: {
    instrument: "NSSF Act, 2013 — Year 4 contribution limits",
    governs: "the Tier I and Tier II pensionable earnings limits and the 6% rate",
    url: "https://www.nssf.or.ke/",
    effectiveFrom: "2026-02-01",
    /* The Act steps the limits annually on 1 FEBRUARY, so the review must fall
     * BEFORE that date, not after it.
     *
     * This previously read 2027-03-31 — "stable until then plus two months of
     * grace". The grace was pointing the wrong way. A CPI figure that is two
     * months old is old but still TRUE, so grace after the fact costs nothing.
     * An NSSF limit two months past a step is FALSE: on 1 February 2027 the
     * Year 4 ceiling of Ksh 108,000 stops being the law, and a guard that waits
     * until 31 March lets the site quote a wrong deduction for the whole of
     * February and March with nothing flagged.
     *
     * It does not stay contained either. NSSF is deducted BEFORE PAYE, so a
     * wrong upper limit moves taxable income, moves PAYE, and moves the
     * take-home figure every salaried reader came here for.
     *
     * Verified pattern, not a guess: Year 3 took effect 1 February 2025 and
     * Year 4 on 1 February 2026, both recorded in lib/tax.ts. Year 5's figures
     * were still unannounced as at 11 August 2026, which is exactly why the
     * prompt has to arrive before the deadline rather than after it.
     *
     * A TRAP FOR THE NEXT REVIEWER, because it nearly worked here. NSSF's
     * general "New NSSF Member Contributions" page still presents the YEAR 1
     * figures — lower 6,000, upper 18,000, maxima 720 and 1,440 — with no
     * year label attached. Searching nssf.or.ke for contribution limits
     * surfaces that page first, and it reads as authoritative because it is.
     * It is simply answering a question about 2023. The Year 4 numbers live in
     * a separate "Notice to Employers — Year 4 (2026)" item. If a check
     * appears to show the encoded limits are far too high, that is the page
     * you have found, not an error in lib/tax.ts. */
    reviewBy: "2027-01-31",
    note: "Upper limit Ksh 108,000, lower limit Ksh 9,000; Tier II employee maximum Ksh 5,940.",
  },

  shif: {
    instrument: "Social Health Insurance Act, 2024",
    governs: "the 2.75% health contribution and its Ksh 300 monthly minimum",
    url: "https://sha.go.ke/",
    effectiveFrom: "2024-10-01",
    // Set by regulations rather than by an annual Act, so there is no fixed
    // cadence to key on. An annual re-read is the discipline instead.
    //
    // Re-verified August 2026: 2.75% of gross, Ksh 300 monthly minimum, no
    // upper cap, employee-only, still in force with the SHA transition from
    // NHIF complete. Corroborated across independent payroll publishers;
    // sha.go.ke itself is not directly fetchable from this environment.
    reviewBy: "2026-12-31",
  },

  housingLevy: {
    instrument: "Affordable Housing Act, 2024",
    governs: "the 1.5% Affordable Housing Levy",
    url: "https://www.parliament.go.ke/",
    effectiveFrom: "2024-03-19",
    // Re-verified August 2026 against KRA's own public notice on collection of
    // the levy, plus independent payroll publishers: 1.5% of gross monthly pay
    // from the employee, matched by 1.5% from the employer, no upper income
    // cap, effective 19 March 2024 and still in force. The repeal of the 15%
    // relief also holds — personal relief is the only PAYE relief left.
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

/**
 * One instrument's attribution, for a caption with room for only one.
 *
 * Written because two pages named "Finance Act 2025/26" as the source of the
 * PAYE bands — the salary hub's stat card and the About page's calibration
 * list — and both were wrong twice over. The five-band schedule dates to the
 * Finance Act 2023, not 2025. And by August 2026 the Finance Act 2026 had been
 * in force for a month, so a reader had no way to tell "still correct" from
 * "never updated".
 *
 * The arithmetic was right throughout — see the `paye` entry above for the
 * review establishing that the 2026 Act moved neither the bands nor the
 * Ksh 2,400 relief. That is exactly what let the wrong label survive: nothing
 * it produced was ever off by a shilling.
 *
 * Derived rather than typed, for the reason this registry exists at all. Those
 * two strings were the third and fourth hand-written copies of a claim the
 * records already held, and a copy gets corrected in one place and not the
 * others.
 */
export function attributionFor(key: StatuteKey): string {
  const s = STATUTES[key];
  return `${s.instrument}, in force since ${formatMonth(s.effectiveFrom)}`;
}
