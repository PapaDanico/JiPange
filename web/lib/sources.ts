/**
 * Every published figure, with the thing it came from and the date it goes stale.
 *
 * WHY THIS EXISTS
 * ---------------
 * The landing page states nine numbers about Kenya as facts. Until now they
 * lived in two places at once: a constant in kenya-stats.ts and a literal
 * inside the prose beside it. "Ksh 370 billion (7%)" was written out by hand in
 * app/page.tsx while MMF_AUM_BILLION_KSH sat in a module nothing on that page
 * imported. Correcting the constant would have changed nothing a reader sees,
 * and the correction would have looked done.
 *
 * That is the failure mode this file removes. A figure is declared once, here,
 * with its source attached, and the copy interpolates it. There is no way to
 * fix half of it.
 *
 * WHY EVERY ENTRY CARRIES A DATE
 * ------------------------------
 * A statistic about Kenya's economy is true on a date and drifts afterwards.
 * FinAccess is biennial; RBA publishes a digest a year; the CMA reports
 * quarterly. A figure with no review date is a figure that will be quietly
 * wrong on the day someone acts on it, and nothing in the codebase will notice.
 * `reviewBy` is that notice: __tests__/sources.test.ts fails the build once a
 * figure is past it. The gate is deliberately annoying. A stale number on a
 * page that tells Kenyans what to do with their money is worse than a red CI.
 *
 * WHAT IS NOT HERE
 * ----------------
 * Two figures were removed rather than corrected:
 *
 *   - "2.5% pension coverage in the informal sector." Not traceable to RBA or
 *     KIPPRA, and the published figures nearest to it disagree in both
 *     directions depending on what is being counted. Replaced by the coverage
 *     figure the RBA does publish.
 *
 *   - "Average Fuliza ticket: Ksh 254." Ksh 1.46tn over 17.7M users is a figure
 *     per USER, not per transaction — the transaction count was never in any
 *     source we hold, so no per-transaction average can be computed from what
 *     we cite. It is replaced by the division we can actually do.
 *
 * Removing a number is a legitimate outcome of checking it.
 */

export interface Figure {
  /** The number itself. Formatting belongs to the caller. */
  readonly value: number;
  /** What it counts, for the reader of this file. */
  readonly unit: string;
  /** Who published it. */
  readonly publisher: string;
  /** The specific publication, precise enough to find. */
  readonly title: string;
  /** Where it can be checked. */
  readonly url: string;
  /**
   * The date the underlying publication refers to — NOT the date we read it.
   * ISO, and always the period the data describes.
   */
  readonly asOf: string;
  /**
   * The date after which this must be re-checked against a fresh publication.
   * Set from the publisher's own cadence plus a grace period, never from
   * convenience. ISO.
   */
  readonly reviewBy: string;
  /** How the figure is derived, where that is not obvious. */
  readonly note?: string;
}

/**
 * The registry. Keys are stable; copy refers to figures by key.
 *
 * `as const satisfies` rather than a plain annotation: the annotation would
 * widen `value` to `number` and lose the literal types, and the satisfies
 * clause is what makes a missing `url` or `reviewBy` a compile error rather
 * than a runtime surprise.
 */
export const SOURCES = {
  finaccessFormalInclusionPct: {
    value: 84.8,
    unit: "% of adults with access to formal financial services",
    publisher: "CBK / KNBS / FSD Kenya",
    title: "FinAccess Household Survey 2024",
    url: "https://www.centralbank.go.ke/finaccess/",
    asOf: "2024-12-31",
    // FinAccess is biennial; the 2026 round is expected in H2 2026.
    reviewBy: "2027-03-31",
  },

  finaccessLiteracyPassPct: {
    value: 42.1,
    unit: "% of adults answering all three literacy questions correctly",
    publisher: "CBK / KNBS / FSD Kenya",
    title: "FinAccess Household Survey 2024",
    url: "https://www.centralbank.go.ke/finaccess/",
    asOf: "2024-12-31",
    reviewBy: "2027-03-31",
    // The three questions cover inflation, INTEREST RATES and risk
    // diversification. Our copy said "compound interest" for a year, which is a
    // harder question than the survey asked and made the pass rate read worse
    // than it is.
    note: "Questions cover inflation, interest rates and risk diversification.",
  },

  rbaNoPensionPct: {
    value: 81,
    unit: "% of the workforce with no active pension contribution",
    publisher: "Retirement Benefits Authority",
    title: "RBA Statistical Digest 2024",
    url: "https://www.rba.go.ke/publications/",
    asOf: "2024-12-31",
    // The digest is annual.
    reviewBy: "2026-12-31",
  },

  /* What replaced "65% of pensioners are dissatisfied".
   *
   * That sentence cited the RBA Pensioners Survey 2024 and the survey does not
   * contain it. What the survey does contain is sharper and is a measurement
   * rather than a mood: 32.2% of retirees say their retirement income meets
   * their daily needs. Two thirds say it does not.
   *
   * Worth recording how the error worked, because it is the ordinary kind.
   * Nobody invented 65%. A real finding was paraphrased into a rounder,
   * vaguer word — "dissatisfied" — and once it was vague, no reader could
   * check it against anything, including the person who wrote it down. */
  rbaIncomeMeetsNeedsPct: {
    value: 32.2,
    unit: "% of recent retirees whose retirement income meets their daily needs",
    publisher: "Retirement Benefits Authority",
    title: "Pensioners Survey 2024",
    url: "https://www.rba.go.ke/download/pensioners-survey-2024/",
    asOf: "2024-05-31",
    // Biennial series; the 2026 round is due.
    reviewBy: "2027-06-30",
    note: "427 retirees from registered schemes who retired within five years, surveyed April–May 2024.",
  },

  /* Coverage, which replaced an unsourced 2.5% informal-sector figure.
   *
   * The 2.5% could not be traced to any RBA or KIPPRA publication, and the
   * nearest published figures disagreed with it in both directions depending
   * on what was being counted. So this states the thing the RBA actually
   * publishes: coverage across the whole working-age population, ENROLLED
   * rather than actively contributing.
   *
   * It does not contradict rbaNoPensionPct below. 26.5% are enrolled in a
   * scheme; 81% make no active contribution. The gap between those two is
   * dormant membership, and it is arguably the more alarming number of the
   * pair — a great many Kenyans have a pension they have stopped paying into. */
  rbaCoverageOfWorkingAgePct: {
    value: 26.5,
    unit: "% of the working-age population enrolled in a retirement benefits scheme",
    publisher: "Retirement Benefits Authority",
    title: "Retirement benefits industry brief, half-year to 30 June 2025",
    url: "https://www.rba.go.ke/publications/",
    asOf: "2025-06-30",
    reviewBy: "2026-12-31",
    note: "Enrolled members, active and dormant.",
  },

  informalWorkersMillions: {
    value: 18.1,
    unit: "million Kenyans working in the informal sector",
    publisher: "KNBS",
    title: "Economic Survey 2024",
    url: "https://www.knbs.or.ke/economic-survey/",
    asOf: "2023-12-31",
    // The Economic Survey is annual, published around May.
    reviewBy: "2026-12-31",
  },

  fulizaUsersMillions: {
    value: 17.7,
    unit: "million customers who used Fuliza during the financial year",
    publisher: "Safaricom PLC",
    title: "FY2026 Annual Results",
    url: "https://www.safaricom.co.ke/investor-relations",
    asOf: "2026-03-31",
    reviewBy: "2027-07-31",
  },

  fulizaVolumeTrillionKsh: {
    value: 1.46,
    unit: "Ksh trillion disbursed through Fuliza during the financial year",
    publisher: "Safaricom PLC",
    title: "FY2026 Annual Results",
    url: "https://www.safaricom.co.ke/investor-relations",
    asOf: "2026-03-31",
    reviewBy: "2027-07-31",
  },

  /* The two figures behind "Kenyans keep their money in the wrong place".
   *
   * Both were wrong, and both were wrong in the direction that flattered our
   * own argument — the page said Ksh 5tn sat in banks against Ksh 370bn in
   * money market funds, when the real figures are 6.52tn and 442.2bn. An error
   * that makes your pitch look better than the truth is the one to be most
   * suspicious of, and this one survived a year because the numbers were typed
   * into prose where nothing could check them.
   *
   * The ratio barely moves: 7.4% becomes 6.8%. The argument was sound; the
   * arithmetic supporting it was not. Both are now stated from here. */
  bankDepositsTrillionKsh: {
    value: 6.52,
    unit: "Ksh trillion of customer deposits in the Kenyan banking sector",
    publisher: "Central Bank of Kenya",
    title: "Banking sector deposits, four months to April 2026",
    url: "https://www.centralbank.go.ke/category/banking-sector/",
    asOf: "2026-04-30",
    // CBK publishes banking aggregates monthly; a two-quarter grace is generous.
    reviewBy: "2026-12-31",
  },

  mmfAumBillionKsh: {
    value: 442.2,
    unit: "Ksh billion of assets under management in money market funds",
    publisher: "Capital Markets Authority",
    title: "Collective Investment Schemes Quarterly Report, quarter ended 31 March 2026",
    url: "https://www.cma.or.ke/",
    asOf: "2026-03-31",
    // The CMA reports QUARTERLY. Our citation line read "CMA Collective
    // Investment Schemes, July 2026" — a month in which no such report exists.
    // A citation that names a date the publisher never publishes on is a
    // citation nobody has ever followed.
    reviewBy: "2026-12-31",
    note: "51.9% of the Ksh 851.7bn total CIS industry at the same date.",
  },
} as const satisfies Record<string, Figure>;

export type SourceKey = keyof typeof SOURCES;

/** The figure's number. Named so a caller cannot mistake it for the record. */
export function figure(key: SourceKey): number {
  return SOURCES[key].value;
}

/** A citation line, assembled from the record so it cannot drift from it. */
export function cite(key: SourceKey): string {
  const s = SOURCES[key];
  return `${s.publisher} — ${s.title}`;
}

/**
 * Average Fuliza borrowed per user over the year.
 *
 * This replaces a stated "average ticket of Ksh 254". That figure was per
 * TRANSACTION, and no source we hold gives a transaction count — so it could
 * not be checked and could not be recomputed. What the two figures we do cite
 * support is a per-user annual total, which is the division below, and which is
 * the more useful number anyway: it describes a year of somebody's borrowing
 * rather than one tap.
 */
export function fulizaPerUserKsh(): number {
  const trillions = figure("fulizaVolumeTrillionKsh");
  const users = figure("fulizaUsersMillions");
  return (trillions * 1e12) / (users * 1e6);
}

/**
 * Share of Kenyan bank deposits that sits in money market funds instead.
 *
 * Computed rather than stated. The page previously carried "(7%)" typed beside
 * two numbers that did not produce it, and both of those numbers were also
 * wrong — so the parenthesis was right by luck. From the corrected figures the
 * true share is 6.8%, which is close enough to make the point that the point
 * was never the problem.
 */
export function mmfShareOfDepositsPct(): number {
  const mmfTrillions = figure("mmfAumBillionKsh") / 1000;
  return (mmfTrillions / figure("bankDepositsTrillionKsh")) * 100;
}
