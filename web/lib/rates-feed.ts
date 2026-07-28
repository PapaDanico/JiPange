import snapshot from "./rates-snapshot.json";

/**
 * Rates published by Mwangaza Yield, our sister tool.
 *
 * WHY WE DO NOT COMPUTE THESE OURSELVES
 * -------------------------------------
 * CBK quotes Treasury bills as a *discount rate*, and it is neither the return
 * nor close to it. A bill quoted at 8.7986% earns that discount on a smaller
 * outlay, so the true gross yield is 9.30% — and 15% withholding tax then
 * pulls the net to 7.87%. Multiplying capital by 0.088 is wrong twice in
 * opposite directions and lands roughly 0.9 percentage points high.
 *
 * This file exists because we were doing precisely that. The DhowCSD ladder
 * held three hardcoded quoted rates and projected income straight from them,
 * overstating a Ksh 300,000 ladder by about Ksh 2,300 a year. The temptation
 * was to port the formula. We didn't: two copies of a convention drift, and
 * the copy that drifts is never the one that gets corrected. Mwangaza Yield
 * derives these conventions from CBK data and verifies them against real
 * broker contract notes, so it publishes the answer and we read it.
 *
 * WHY A COMMITTED SNAPSHOT RATHER THAN A LIVE FETCH
 * -------------------------------------------------
 * A calculator that waits on someone else's server is a calculator that fails
 * when they deploy. The snapshot below is refreshed by scripts/sync-rates.mjs
 * in CI, so the figures move daily while the app itself has no runtime
 * dependency, works offline, and renders instantly. It also means the rate a
 * user saw is in version control — when someone asks why a number changed,
 * the answer is a diff.
 *
 * Freshness is surfaced, never assumed: `isStale()` drives the notice in the
 * UI, because a rate quoted without its date is how a stale figure becomes a
 * confident wrong claim.
 *
 * Source: https://mwangazayield.org/data/rates.json — contract documented at
 * https://github.com/PapaDanico/Mwangaza-Yield/blob/main/docs/RATES-FEED.md
 */

/** The only schema this reader understands. A bump means stop, not guess. */
export const SUPPORTED_SCHEMA = 1;

/** Past this, the UI says the figures are old rather than quoting them plainly. */
export const STALE_AFTER_DAYS = 14;

export interface TBillRate {
  tenorDays: number;
  /** CBK's published quote. NOT a return — see netEAY. */
  quotedDiscountRate: number;
  /** Effective annual yield before tax. */
  grossEAY: number;
  /** What you actually keep, after 15% withholding tax. Project income from this. */
  netEAY: number;
  whtRate: number;
  pricePer100: number;
  auctionDate: string;
  nextAuctionDate: string | null;
  minInvestmentKES: number | null;
  source: string | null;
}

export interface MacroReading {
  value: number;
  unit: string;
  date: string;
  source: string;
}

/**
 * A bond-yield band, bucketed by REMAINING term at the auction date.
 *
 * Mwangaza buckets by remaining term rather than by the tenor in the issue
 * code, because most recent auctions are re-openings whose label overstates
 * how long the paper actually has left to run.
 *
 * `medianClearingRate` is null when too few auctions fell in the band to quote
 * one. That is a deliberate refusal rather than missing data, so a caller must
 * skip the band rather than borrow a neighbour's figure.
 */
export interface BondBand {
  label: string;
  fromYears: number;
  toYears: number;
  auctions: number;
  medianClearingRate: number | null;
  lowClearingRate: number | null;
  highClearingRate: number | null;
  latestAuctionDate: string | null;
}

export interface RatesFeed {
  schema: number;
  generatedAt: string;
  publisher: string;
  tbills: TBillRate[];
  macro: {
    centralBankRate: MacroReading | null;
    inflation: MacroReading | null;
    usdKes: MacroReading | null;
  };
  /* Published by Mwangaza since the feed's first release, but missing from
   * this interface until something needed it — so any reader wanting a bond
   * yield had to reach past the type. Declared here rather than cast at the
   * call site: a shape asserted in one consumer is a shape nothing checks.
   * Optional, because a snapshot generated before the field existed is still
   * valid under schema 1. */
  bondAuctionBenchmarks?: {
    windowDays: number;
    minSample: number;
    bands: BondBand[];
  };
}

const feed = snapshot as unknown as RatesFeed;

/**
 * A schema we don't know is not a rate we can read. Fail loudly at module load
 * rather than quietly rendering fields that may have changed meaning.
 */
if (feed.schema !== SUPPORTED_SCHEMA) {
  throw new Error(
    `rates-snapshot.json declares schema ${feed.schema}; this build understands ${SUPPORTED_SCHEMA}. ` +
      `Re-run scripts/sync-rates.mjs and update lib/rates-feed.ts together.`,
  );
}

export const RATES = feed;

/** The 91/182/364-day bills, shortest first. */
export const TBILL_RATES: TBillRate[] = [...feed.tbills].sort((a, b) => a.tenorDays - b.tenorDays);

export function tbillRate(tenorDays: number): TBillRate | null {
  return TBILL_RATES.find((r) => r.tenorDays === tenorDays) ?? null;
}

/** When the underlying CBK figures were last refreshed. */
export function generatedOn(): Date {
  return new Date(feed.generatedAt);
}

export function daysSinceRefresh(now: Date = new Date()): number {
  return Math.floor((now.getTime() - generatedOn().getTime()) / 86_400_000);
}

export function isStale(now: Date = new Date()): boolean {
  return daysSinceRefresh(now) > STALE_AFTER_DAYS;
}

/**
 * The published inflation rate, as a fraction (0.0641, not 6.41).
 *
 * Three different figures used to be hardcoded across this app — 6.7% in the
 * journey funnel, 6.4% in the FIRE calculator, 6.5% in the projection engine —
 * and each was rendered to the reader as "inflation runs at X%". A reader who
 * visited two pages was told two different things about the same month, and
 * none of the three was sourced or dated.
 *
 * All three predate this feed. Inflation is not a house assumption: it is a
 * published figure with a date and a publisher, and the feed already carries
 * it. Same argument as the T-bill rates above — the side that tracks the
 * number publishes it, and we read it.
 *
 * Throws if it is missing. A financial app that quietly substitutes a
 * plausible inflation rate for a real one is worse than a build that fails.
 */
export function currentInflation(): number {
  const reading = feed.macro.inflation;
  if (!reading || !Number.isFinite(reading.value)) {
    throw new Error(
      "rates-snapshot.json carries no inflation reading. Re-run scripts/sync-rates.mjs; " +
        "do not substitute an estimate.",
    );
  }
  return reading.value / 100;
}

/** e.g. "KNBS CPI, 25 Jul 2026". Shown wherever the inflation rate is quoted. */
export function inflationAttribution(): string {
  const r = feed.macro.inflation;
  if (!r) return "no published reading";
  const when = new Date(r.date).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return `${r.source}, ${when}, via Mwangaza Yield`;
}

/** e.g. "CBK auction of 16 Jul 2026". Always shown next to a rate. */
export function attribution(): string {
  const auction = TBILL_RATES[0]?.auctionDate;
  const when = auction
    ? new Date(auction).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })
    : "the latest CBK auction";
  return `CBK auction of ${when}, via Mwangaza Yield`;
}
