/**
 * Commercial tariffs — the prices a provider sets, with the date each one goes
 * back on the reading list.
 *
 * WHY THIS EXISTS
 * ---------------
 * This codebase already gates three classes of perishable fact, and picks the
 * gate by what it costs to be wrong:
 *
 *   lib/sources.ts    scalar statistics — past due FAILS CI. Nobody is harmed
 *                     while the build is red, and red is what gets a figure
 *                     re-read.
 *   lib/statutes.ts   tax instruments — past due shows the READER a caution and
 *                     leaves the build green, because a red build does not take
 *                     a live calculator off the page.
 *   lib/paybills.ts   payment details — past due SUPPRESSES the number. There
 *                     is no "broadly right" account number.
 *
 * The Fuliza tariff had none of them. Its bands sat in lib/fuliza.ts under a
 * comment promising "if the bands move, they move HERE" — which says where a
 * correction goes, not when anyone should look. A landing-page statistic about
 * the economy was held to a review date; the price of the most-used consumer
 * credit product in the country was not.
 *
 * WHICH GATE A TARIFF GETS, AND WHY IT IS THE STATUTE ONE
 * ------------------------------------------------------
 * Failing CI does not protect the reader, for the same reason it does not on a
 * tax band: the calculator stays up and goes on answering while the build is
 * red.
 *
 * Suppression is wrong here in a way it is not for a paybill. A suppressed
 * account number costs a user a shortcut. A suppressed Fuliza calculator costs
 * them the only page that tells them what Fuliza costs — and the alternative to
 * reading a slightly stale estimate is not reading a fresh one, it is drawing
 * the overdraft with no estimate at all. A band that moved by a shilling still
 * carries the finding that matters, which is that this is expensive credit and
 * regressive against the smallest borrower.
 *
 * So: name the tariff in a caution the calculator renders, keep the number on
 * the page, keep the build green. Same shape as statutes.ts, same reasoning.
 *
 * WHEN THIS FIRES, THE FIX IS NOT TO MOVE THE DATE.
 * Open the url, read the provider's published tariff, confirm or correct the
 * constants in the module named by `constantsIn`, and only then set a new
 * reviewBy. Moving the date alone converts a warning into a lie.
 */

export interface Tariff {
  /** The product as a reader would name it, e.g. "Fuliza". */
  readonly product: string;
  /** Who sets the price. */
  readonly provider: string;
  /** What the tariff governs, in the terms the calculator uses. */
  readonly governs: string;
  /** Where the constants can be checked against the provider. */
  readonly url: string;
  /** The module holding the constants this record governs. */
  readonly constantsIn: string;
  /** When these constants were last confirmed against the provider. ISO. */
  readonly verifiedOn: string;
  /**
   * The date after which they must be confirmed again. ISO.
   *
   * A commercial tariff has no amendment cadence to key on — a provider may
   * reprice at any time and owes nobody notice. The interval is therefore set
   * the way paybills.ts sets its own: not by how often the number moves, but by
   * how long a moved one may sit here unnoticed.
   */
  readonly reviewBy: string;
  /** Anything a future reviewer needs that is not obvious from the record. */
  readonly note?: string;
}

export const TARIFFS = {
  fuliza: {
    product: "Fuliza",
    provider: "Safaricom, with NCBA and KCB",
    governs:
      "the daily maintenance fee bands, the 1% access fee, the 20% excise duty and the three free days below Ksh 1,000",
    url: "https://www.safaricom.co.ke/personal-home/m-pesa/credit-and-savings/fuliza-mobile",
    constantsIn: "lib/fuliza.ts",
    /* Re-verified 11 August 2026 against Safaricom's published Fuliza pages and
     * its restructure announcement, corroborated across independent tariff
     * trackers. Every constant in lib/fuliza.ts was confirmed unchanged:
     *
     *   band ≤100 free · ≤500 Ksh 2.50 · ≤1,000 Ksh 5 · ≤1,500 Ksh 18
     *   · ≤2,500 Ksh 20 · ≤70,000 Ksh 25   (all before excise)
     *   one-off access fee 1% · excise 20% on access fee and each daily fee
     *   · three free days on balances of Ksh 1,000 or less · ceiling Ksh 70,000
     *
     * The banded structure dates to the October 2022 restructure. Nothing in
     * the tariff moved between that verification and this one. */
    verifiedOn: "2026-08-11",
    reviewBy: "2027-02-28",
    note: "Fuliza is regressive by construction: the fee is a flat sum per band, so the smallest borrowings carry by far the highest annualised cost. If a future tariff replaces the bands with a percentage, that finding changes and the copy built on it has to change too.",
  },
} as const satisfies Record<string, Tariff>;

export type TariffKey = keyof typeof TARIFFS;

const KEYS = Object.keys(TARIFFS) as TariffKey[];

/**
 * The records widened to the interface — same reason as statutes.ts. `as const
 * satisfies` is what makes a missing field a compile error, and it also makes
 * TARIFFS[k] a union whose optional `note` cannot be read off the union.
 * Widening once here beats widening at each call site.
 */
const ALL: readonly Tariff[] = KEYS.map((k) => TARIFFS[k]);

/** Today, from the clock. Injectable below so tests can wind it forward. */
function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function pick(keys: readonly TariffKey[] | undefined): readonly Tariff[] {
  return keys ? keys.map((k) => TARIFFS[k]) : ALL;
}

/**
 * The tariffs past the date somebody undertook to re-read them.
 *
 * `keys` narrows to the tariffs a given calculator actually prices on — the
 * PAYE calculator should not warn about Fuliza. `today` is injectable so the
 * tests can wind the clock forward and watch the guard fire, which is the
 * failure this codebase keeps finding in itself: a staleness gate that cannot
 * fire in the case it exists to detect.
 */
export function tariffsDueForReview(
  keys?: readonly TariffKey[],
  today: string = todayIso()
): Tariff[] {
  return pick(keys).filter((t) => t.reviewBy < today);
}

/** The attribution line, assembled from the records so it cannot drift. */
export function tariffLine(keys?: readonly TariffKey[]): string {
  return pick(keys)
    .map((t) => `${t.governs} — ${t.provider}'s published ${t.product} tariff`)
    .join(" · ");
}
