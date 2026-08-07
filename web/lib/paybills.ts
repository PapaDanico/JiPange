/**
 * The M-Pesa payment details the action plan hands a user, with the date each
 * one must be confirmed again.
 *
 * WHY THIS IS THE MOST DANGEROUS DATA IN THE REPOSITORY
 * ----------------------------------------------------
 * Every other figure here can be wrong and cost a reader some accuracy. These
 * can be wrong and cost them the money. A paybill is rendered beside a
 * one-tap copy button that produces a ready-to-paste `Paybill: X | Account: Y`
 * string, so the distance between a stale number in this file and a completed
 * transfer to a stranger is two taps.
 *
 * THE ASYMMETRY THIS FIXES
 * ------------------------
 * lib/affiliate-links.ts already treats fund yields as perishable: they carry
 * an observation date, a staleness window, and a coherence guard that removed
 * every MMF figure rather than show one that could not be reconciled with the
 * live 91-day bill. That is the right instinct applied to the field where
 * being wrong costs credibility.
 *
 * The payment details had none of it. Their freshness was one line of prose —
 *
 *     "Paybills verified Jul 2026 — always confirm with the provider"
 *
 * — with no constant, no test and no expiry behind it. A paybill that changed
 * would go on being copied indefinitely, under a sentence asserting somebody
 * had checked. The field with the worst failure mode had the weakest guard.
 *
 * WHAT HAPPENS PAST THE DATE, AND WHY IT IS DIFFERENT FROM lib/statutes.ts
 * -----------------------------------------------------------------------
 * A past-due tax band is still shown, with a caution, because suppressing it
 * would leave the calculator unable to answer at all and a slightly stale band
 * still produces a broadly right number.
 *
 * A past-due paybill is SUPPRESSED. There is no "broadly right" account
 * number: it is correct or it sends money somewhere else, and a caution under
 * a copy button is not protection — the number is still there and still one
 * tap from the clipboard. What the user needs instead is the route in, which
 * does not perish: the provider's name and how you reach them. Losing the
 * shortcut is a real cost, and it is smaller than the one it prevents.
 *
 * WHEN THIS FIRES, THE FIX IS NOT TO MOVE THE DATE.
 * Confirm the number with the provider directly, then set a new reviewBy.
 */

export interface Paybill {
  /** The provider whose account this is. */
  readonly provider: string;
  /** The M-Pesa business number. */
  readonly paybill: string;
  /** What the user puts in the account field. */
  readonly account: string;
  /** How to reach this provider when the number is suppressed or in doubt. */
  readonly routeIn: string;
  /** When these details were last confirmed against the provider. ISO. */
  readonly verifiedOn: string;
  /**
   * The date after which they must be confirmed again. Payment details change
   * rarely, so the interval is not set by how often they move — it is set by
   * how bad it is when one has moved and nobody noticed.
   */
  readonly reviewBy: string;
}

export const PAYBILLS = {
  sacco: {
    provider: "Stima Sacco",
    paybill: "0240240",
    account: "802 + your member no. + 00",
    routeIn: "Stima Sacco branch or member portal",
    verifiedOn: "2026-07-01",
    reviewBy: "2027-01-01",
  },
  mmf: {
    provider: "Britam Asset Managers",
    paybill: "500005",
    account: "your Britam a/c (BAxxxxxx)",
    routeIn: "the Britam app, or ke.britam.com",
    verifiedOn: "2026-07-01",
    reviewBy: "2027-01-01",
  },
  ifb: {
    provider: "CBK DhowCSD",
    paybill: "200222",
    account: "shown under DhowCSD → Transactions",
    routeIn: "the DhowCSD app or web portal, under Transactions",
    verifiedOn: "2026-07-01",
    reviewBy: "2027-01-01",
  },
} as const satisfies Record<string, Paybill>;

export type PaybillKey = keyof typeof PAYBILLS;

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Whether these details are past the date somebody undertook to re-confirm
 * them. `today` is injectable so the tests can wind the clock forward and
 * watch the guard fire — a staleness check that is only ever asked about
 * today is a staleness check nobody has seen work.
 */
export function isStale(key: PaybillKey, today: string = todayIso()): boolean {
  return PAYBILLS[key].reviewBy < today;
}

/**
 * The details to show, or null when they are past due.
 *
 * Null is the whole point: it forces the caller to render the fallback rather
 * than a number with a warning next to it. A caller that wants to show the
 * paybill anyway has to work at it.
 */
export function paybillFor(key: PaybillKey, today: string = todayIso()): Paybill | null {
  return isStale(key, today) ? null : PAYBILLS[key];
}
