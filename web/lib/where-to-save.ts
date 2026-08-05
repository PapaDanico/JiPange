/**
 * Where to put savings — with the things that are comparable compared, and the
 * thing that is not held apart.
 *
 * WHY THIS IS NOT A FOUR-WAY TABLE
 * --------------------------------
 * The obvious build is one ranked list: bond, Treasury bill, money market
 * fund, SACCO, best rate at the top. It would be wrong, and wrong in the
 * direction that costs a reader money.
 *
 * Three of those four are the same kind of thing. Interest, withholding tax at
 * 15%, a rate we hold live and dated. They can sit on one axis and be ranked,
 * and the ranking means what it looks like it means.
 *
 * A SACCO return is not that. It is a DIVIDEND ON SHARE CAPITAL, declared
 * annually by the society out of its surplus — not interest on a deposit, not
 * contractual, and not payable if the year goes badly. `affiliate-links.ts`
 * carries the rest of it and does not flinch: the figure we hold is a SECTOR
 * RANGE from SASRA, 8-15%, as of 31 December 2025, and the Deposit Guarantee
 * Fund provided for under the Sacco Societies Act is NOT OPERATIONAL, so a
 * SACCO deposit carries no live statutory guarantee at all.
 *
 * Put an "8-15%" band at the top of a list beside a dated 13.6% Treasury bill
 * and the SACCO wins on the page. It has not won anything. It is a wider,
 * older, differently-taxed, unguaranteed number about a different instrument,
 * and the layout would have done the arguing.
 *
 * So: `comparable()` ranks what can be ranked. `sideNotes()` returns what
 * cannot, with its date, its range and its guarantee gap attached, for a
 * surface to render BESIDE the ranking rather than inside it. The untidiness
 * is the information.
 *
 * STRICTLY DESCRIPTIVE
 * --------------------
 * Every rate here is published and dated. Nothing is projected. The MMF figure
 * is an ASSUMPTION — see mmf-assumption.ts, where the spread over T-bills is
 * currently 0.0 — and it is labelled as one rather than presented as a quote,
 * because no MMF rate is published on the terms the government's are.
 */

import { TBILL_RATES, type TBillRate } from "./rates-feed";
import { assumedMmfYield, MMF_SPREAD_OVER_TBILL_PCT } from "./mmf-assumption";
import { SPREAD_CONFIDENCE_PP } from "./mmf-vs-tbill";
import {
  SACCO_DIVIDEND_RANGE_PCT,
  SACCO_RATES_AS_OF,
  SACCO_RATES_SOURCE,
  SACCO_DEPOSIT_GUARANTEE_OPERATIONAL,
} from "./affiliate-links";

export const WHT_ON_INTEREST = 0.15;

export type Basis = "published" | "assumed";

export interface Option {
  key: string;
  label: string;
  /** Annual return after withholding tax, in percent. */
  netPct: number;
  /** Before tax, for readers who want to see the bite. */
  grossPct: number;
  /** Whether the rate is published by its issuer or assumed by us. */
  basis: Basis;
  /** What the reader has to accept to earn it. */
  lockUp: string;
  /** Who stands behind it. */
  backing: string;
  minimumKES: number | null;
  /**
   * True when this option is within the confidence margin of the best one —
   * that is, close enough that calling it second is not a finding.
   *
   * Ranking is only honest down to the precision the inputs support.
   * `mmf-vs-tbill.ts` already fixed that margin at SPREAD_CONFIDENCE_PP and
   * calls anything inside it "too close to call"; a sorted table that silently
   * ignores the same margin contradicts the sister module using the same
   * numbers.
   *
   * It matters immediately. The MMF and the 91-day bill carry an identical
   * gross yield today, because the assumed spread is 0.0 — and they still land
   * 4bp apart on net, because an MMF's nominal annual rate and a bill's
   * effective annual yield are not taxed over the same period. Four basis
   * points of methodology showed up as the MMF beating a Treasury bill. The
   * ranking was reporting a rounding artefact as a result.
   */
  tiedWithBest: boolean;
}

/**
 * The options that can honestly be ranked against one another.
 *
 * Treasury bills at every published tenor, plus the money market fund at its
 * assumed yield. All interest, all taxed at 15%, all quoted as an annual rate.
 *
 * Bonds are deliberately ABSENT rather than forgotten. A bond's return depends
 * on the price paid and the years held, and quoting its yield beside a 91-day
 * bill invites a reader to compare a fifteen-year commitment with a
 * three-month one as though the number were the whole story. Mwangaza's bond
 * tools exist for that decision and take the term seriously; a row in a
 * ranking cannot.
 */
export function comparable(): Option[] {
  const out: Option[] = [];

  for (const bill of TBILL_RATES) {
    if (!Number.isFinite(bill.netEAY) || !Number.isFinite(bill.grossEAY)) continue;
    out.push({
      key: `tbill-${bill.tenorDays}`,
      label: `${bill.tenorDays}-day Treasury bill`,
      netPct: bill.netEAY,
      grossPct: bill.grossEAY,
      basis: "published",
      lockUp: `${bill.tenorDays} days`,
      backing: "Government of Kenya",
      minimumKES: bill.minInvestmentKES ?? null,
      tiedWithBest: false,
    });
  }

  const mmfGross = assumedMmfYield() * 100;
  if (Number.isFinite(mmfGross) && mmfGross > 0) {
    out.push({
      key: "mmf",
      label: "Money market fund",
      netPct: mmfGross * (1 - WHT_ON_INTEREST),
      grossPct: mmfGross,
      basis: "assumed",
      lockUp: "none — usually 1 to 3 working days to withdraw",
      backing: "the fund's holdings; CMA-regulated, not guaranteed",
      minimumKES: null,
      tiedWithBest: false,
    });
  }

  out.sort((a, b) => b.netPct - a.netPct);
  const best = out[0]?.netPct;
  return out.map((o) => ({
    ...o,
    tiedWithBest: best !== undefined && Math.abs(best - o.netPct) < SPREAD_CONFIDENCE_PP,
  }));
}

export interface SideNote {
  key: string;
  label: string;
  /** A range, not a rate — which is the point. */
  lowPct: number;
  highPct: number;
  asOf: string;
  source: string;
  /** Why it is not in the ranking above. */
  whyApart: string[];
}

/**
 * What must not be ranked, and the reasons, returned so a surface cannot
 * render the figure without them.
 *
 * The reasons travel WITH the number by construction. A caveat that a
 * component can choose to omit is a caveat that eventually gets omitted —
 * this session already found a scope disclosure rendered inside an unrelated
 * conditional, where a data change would have made it silently disappear.
 */
export function sideNotes(): SideNote[] {
  const why = [
    "A SACCO pays a dividend on share capital out of its annual surplus. That is not interest on a deposit: it is declared once a year, at the society's discretion, and a bad year can mean a lower one or none.",
    `The figure is a sector range across many societies — ${SACCO_DIVIDEND_RANGE_PCT.low}% to ${SACCO_DIVIDEND_RANGE_PCT.high}% — not a rate any one of them quotes you.`,
    `It is as of ${SACCO_RATES_AS_OF}, so it is older than every other figure on this page.`,
  ];
  if (!SACCO_DEPOSIT_GUARANTEE_OPERATIONAL) {
    why.push(
      "The Deposit Guarantee Fund under the Sacco Societies Act is not yet operational, so unlike a Treasury bill there is no statutory protection standing behind the money.",
    );
  }
  return [
    {
      key: "sacco",
      label: "SACCO dividends",
      lowPct: SACCO_DIVIDEND_RANGE_PCT.low,
      highPct: SACCO_DIVIDEND_RANGE_PCT.high,
      asOf: SACCO_RATES_AS_OF,
      source: SACCO_RATES_SOURCE,
      whyApart: why,
    },
  ];
}

/**
 * Whether the MMF figure is currently an independent claim at all.
 *
 * `MMF_SPREAD_OVER_TBILL_PCT` is 0.0, which means the assumed MMF yield IS the
 * 91-day bill's. Ranking them against each other in that state is a coin toss
 * dressed as analysis, and a surface should say so rather than print a winner.
 */
export function mmfIsIndependent(): boolean {
  return MMF_SPREAD_OVER_TBILL_PCT !== 0;
}
