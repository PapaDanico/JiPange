/**
 * The 3% real planning rate, checked against what Mwangaza actually publishes.
 *
 * WHY THIS EXISTS
 * ---------------
 * REAL_RETURN_DEFAULT is documented in retirement-kenya.ts with a precise
 * claim: 3% sits BELOW every long-bond real yield on the board, AT money
 * market fund real yield, and ABOVE the T-bill real yield. That is a good
 * justification and it was, until now, only a comment — an assertion about
 * the market written once and never re-checked.
 *
 * A planning rate justified by market conditions has to be re-justified when
 * the market moves. If long bonds ever fall to 2% real, the sentence "below
 * every long-bond real yield" silently becomes false while the app keeps
 * quoting 3% with the same confidence. That is precisely the failure this
 * codebase keeps finding elsewhere: a claim and the thing it claims, drifting
 * apart because nothing put them side by side.
 *
 * So the claim is computed here from the live Mwangaza feed, shown to the
 * reader, and asserted by a test. If reality moves out from under the premise,
 * something fails loudly rather than the number quietly becoming a fiction.
 *
 * WHY THE FEED RATHER THAN OUR OWN NUMBERS
 * ----------------------------------------
 * Same reason rates-feed.ts exists at all. CBK quotes bills as a discount
 * rate, bonds carry three different withholding treatments by tenor, and two
 * copies of those conventions drift — with the copy that drifts never being
 * the one that gets corrected. Mwangaza derives them and we read the answer.
 */

import { RATES, TBILL_RATES, currentInflation, attribution } from './rates-feed';
import { REAL_RETURN_DEFAULT } from './retirement-kenya';

/** Fisher, not subtraction. At 6.4% inflation the difference is ~0.3pp. */
export function realRate(nominal: number, inflation: number = currentInflation()): number {
  return (1 + nominal) / (1 + inflation) - 1;
}

export interface RealYieldRow {
  label: string;
  /** Net-of-tax nominal yield, as a decimal. */
  netNominal: number;
  /** The same, after inflation. */
  netReal: number;
  /** Where this sits relative to the planning rate. */
  side: 'below' | 'above';
}

/**
 * Withholding tax on a Kenyan government bond coupon, by remaining term.
 *
 * Infrastructure bonds are exempt entirely, but the feed's benchmark bands
 * mix IFB and FXD auctions, so applying 0% here would flatter every band.
 * The taxable treatment is the conservative reading and the right one for a
 * band median: 10% at ten years or longer, 15% below.
 */
const bondWht = (fromYears: number): number => (fromYears >= 10 ? 0.1 : 0.15);

/**
 * Every net real yield the feed can currently support, cheapest first.
 *
 * Bands with too few auctions to quote a median are omitted rather than
 * guessed — the feed publishes null for those deliberately.
 */
export function realYieldBoard(): RealYieldRow[] {
  const inflation = currentInflation();
  const rows: RealYieldRow[] = [];

  for (const t of TBILL_RATES) {
    const netNominal = t.netEAY / 100;
    rows.push({
      label: `${t.tenorDays}-day T-bill`,
      netNominal,
      netReal: realRate(netNominal, inflation),
      side: realRate(netNominal, inflation) < REAL_RETURN_DEFAULT ? 'below' : 'above',
    });
  }

  for (const b of RATES.bondAuctionBenchmarks?.bands ?? []) {
    if (b.medianClearingRate == null) continue;
    const netNominal = (b.medianClearingRate / 100) * (1 - bondWht(b.fromYears));
    rows.push({
      label: `${b.label} bond`,
      netNominal,
      netReal: realRate(netNominal, inflation),
      side: realRate(netNominal, inflation) < REAL_RETURN_DEFAULT ? 'below' : 'above',
    });
  }

  return rows.sort((a, b) => a.netReal - b.netReal);
}

export interface PremiseCheck {
  planningRate: number;
  inflation: number;
  /** True when 3% is below every quotable long-bond real yield. */
  belowAllLongBonds: boolean;
  /** True when 3% is at or above every T-bill real yield. */
  aboveAllBills: boolean;
  /** Both of the above — the premise as retirement-kenya.ts states it. */
  holds: boolean;
  /** Plain sentence for the UI, whichever way it went. */
  summary: string;
  attribution: string;
}

/**
 * Does the documented justification still describe the market?
 *
 * "Long bond" means the 10-year-and-over bands, since those are the ones the
 * comment is about; the short bands are neither bills nor long paper and are
 * not what the claim rests on.
 */
export function checkPlanningRatePremise(): PremiseCheck {
  const inflation = currentInflation();
  const bills = TBILL_RATES.map((t) => realRate(t.netEAY / 100, inflation));
  const longBonds = (RATES.bondAuctionBenchmarks?.bands ?? [])
    .filter((b) => b.medianClearingRate != null && b.fromYears >= 10)
    .map((b) => realRate((b.medianClearingRate! / 100) * (1 - bondWht(b.fromYears)), inflation));

  const belowAllLongBonds = longBonds.length > 0 && longBonds.every((r) => r > REAL_RETURN_DEFAULT);
  const aboveAllBills = bills.length > 0 && bills.every((r) => r < REAL_RETURN_DEFAULT);
  const holds = belowAllLongBonds && aboveAllBills;

  const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
  const summary = holds
    ? `Long government bonds are paying ${pct(Math.min(...longBonds))}–${pct(Math.max(...longBonds))} after tax and inflation, and Treasury bills ${pct(Math.min(...bills))}–${pct(Math.max(...bills))}. Planning at ${pct(REAL_RETURN_DEFAULT)} therefore assumes less than the bonds on offer today and more than the bills — deliberately, so the plan does not depend on this moment lasting.`
    : `The market has moved away from the assumption behind this number. Long bonds are at ${longBonds.length ? `${pct(Math.min(...longBonds))}–${pct(Math.max(...longBonds))}` : 'no quotable level'} and bills at ${bills.length ? `${pct(Math.min(...bills))}–${pct(Math.max(...bills))}` : 'no quotable level'} after tax and inflation, so planning at ${pct(REAL_RETURN_DEFAULT)} is no longer the conservative choice it was set up to be. Treat the result as optimistic until the rate is revisited.`;

  return {
    planningRate: REAL_RETURN_DEFAULT,
    inflation,
    belowAllLongBonds,
    aboveAllBills,
    holds,
    summary,
    attribution: attribution(),
  };
}

/**
 * What a nominal projection is really worth — the gap, made concrete.
 *
 * A pot quoted in the shillings of 2053 is a bigger number than the same pot
 * quoted today, and the difference is not a rounding detail: at 6.4% over 27
 * years it is more than three to one. Every figure this app shows a reader is
 * in today's money for that reason, and this function exists so the page can
 * SHOW the arithmetic rather than merely assert the policy.
 */
export function nominalToToday(nominalKes: number, years: number, inflation = currentInflation()) {
  const todayKes = nominalKes / Math.pow(1 + inflation, years);
  return {
    nominalKes,
    todayKes,
    shrinkFactor: nominalKes > 0 ? nominalKes / todayKes : 1,
    inflation,
    years,
  };
}
