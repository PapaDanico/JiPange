import {
  RATES,
  attribution,
  bestPayingTenor,
  daysSinceRefresh,
  isStale,
  type MacroReading,
} from "./rates-feed";
import {
  CBK_AVG_DEPOSIT_RATE_NET_PCT,
  CBK_AVG_DEPOSIT_RATE_PCT,
  CBK_AVG_LENDING_RATE_PCT,
  CBK_BSAR_2025_CITE,
  CBK_MOBILE_MONEY_SUBSCRIPTIONS_MILLIONS,
  CBK_MORTGAGE_AVG_RATE_PCT,
  CBK_MORTGAGE_AVG_RATE_PRIOR_PCT,
} from "./kenya-stats";

/**
 * "Kenya's money this month" — the landing page's information panel.
 *
 * WHY THIS LIVES IN lib/
 * ----------------------
 * The homepage is where a stated figure is most likely to be believed and
 * least likely to be re-checked. Every figure here is read from the synced
 * rates snapshot or the sources registry, and every one carries the date and
 * publisher of the reading — the rule CLAUDE.md states as "a figure shown
 * without its date and publisher is how a stale number becomes a confident
 * wrong claim". Nothing is typed, so nothing can drift from the calculators
 * that use the same numbers.
 *
 * Two kinds of figure, kept apart on purpose: LIVE readings that move with
 * each auction or release, and ANNUAL context from CBK's Bank Supervision
 * Annual Report. A reader should never have to wonder which is which.
 */

export interface PulseFigure {
  id: string;
  /** Formatted for display, unit included. */
  value: string;
  label: string;
  /** One sentence on why the number matters to a household. */
  meaning: string;
  /** "Publisher, date" — always shown beside the value. */
  source: string;
  /** Where to act on it, if anywhere. */
  href?: string;
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });

const fromMacro = (r: MacroReading | null | undefined) =>
  r && Number.isFinite(r.value) ? r : null;

/**
 * The best-paying bill's net yield, after inflation — (1 + n) / (1 + i) − 1.
 * Null when there is no inflation reading to deflate by; the page then says
 * nothing rather than guess.
 */
export function bestBillRealYieldPct(): number | null {
  const infl = fromMacro(RATES.macro.inflation);
  if (!infl) return null;
  const n = bestPayingTenor().netEAY / 100;
  const i = infl.value / 100;
  return ((1 + n) / (1 + i) - 1) * 100;
}

/** Readings that move with each auction or release. */
export function liveFigures(): PulseFigure[] {
  const best = bestPayingTenor();
  const out: PulseFigure[] = [
    {
      id: "tbill",
      value: `${best.netEAY.toFixed(2)}%`,
      label: `${best.tenorDays}-day Treasury bill, after tax`,
      meaning: "The best-paying rung at the latest auction — open to individual investors through DhowCSD.",
      source: attribution(),
      href: "/tools/dhowcsd",
    },
  ];
  const infl = fromMacro(RATES.macro.inflation);
  if (infl) {
    out.push({
      id: "inflation",
      value: `${infl.value}%`,
      label: "Inflation, year on year",
      meaning: "The rate your savings need to beat just to keep their value.",
      source: `${infl.source}, ${fmtDate(infl.date)}`,
      href: "/tools/inflation-reality",
    });
  }
  const cbr = fromMacro(RATES.macro.centralBankRate);
  if (cbr) {
    out.push({
      id: "cbr",
      value: `${cbr.value}%`,
      label: "Central Bank Rate",
      meaning: "Sets the direction for what banks charge on loans and pay on deposits.",
      source: `${cbr.source}, set ${fmtDate(cbr.date)}`,
      href: "/tools/loan-repayment",
    });
  }
  const fx = fromMacro(RATES.macro.usdKes);
  if (fx) {
    out.push({
      id: "fx",
      value: fx.value.toFixed(2),
      label: "Shillings per US dollar",
      meaning: "Moves the price of fuel, imports and school fees paid abroad.",
      source: `${fx.source}, ${fmtDate(fx.date)}`,
    });
  }
  return out;
}

/** Year-end context from the regulator's annual report. */
export function annualFigures(): PulseFigure[] {
  const src = `${CBK_BSAR_2025_CITE}, Dec 2025`;
  return [
    {
      id: "deposit",
      value: `${CBK_AVG_DEPOSIT_RATE_PCT}%`,
      label: "Average bank deposit rate",
      meaning: `About ${CBK_AVG_DEPOSIT_RATE_NET_PCT}% after tax — a benchmark to compare your own account against.`,
      source: src,
      href: "/tools/where-to-save",
    },
    {
      id: "lending",
      value: `${CBK_AVG_LENDING_RATE_PCT}%`,
      label: "Average bank lending rate",
      meaning: "Useful to know before you sign — banks now publish theirs on the Total Cost of Credit site.",
      source: src,
      href: "/tools/loan-repayment",
    },
    {
      id: "mortgage",
      value: `${CBK_MORTGAGE_AVG_RATE_PCT}%`,
      label: "Average mortgage rate",
      meaning: `Down from ${CBK_MORTGAGE_AVG_RATE_PRIOR_PCT}% a year earlier — the price of a home loan is easing.`,
      source: `${CBK_BSAR_2025_CITE}, mortgage survey`,
      href: "/planners/home",
    },
    {
      id: "mobile-money",
      value: `${CBK_MOBILE_MONEY_SUBSCRIPTIONS_MILLIONS}M`,
      label: "Mobile money subscriptions",
      meaning: "Access is nearly universal. The next step is using it to build, not only to spend.",
      source: `${CBK_BSAR_2025_CITE}, Table 8`,
    },
  ];
}

/**
 * The honest caveat, when one is owed.
 *
 * The auction figures carry their own date; this speaks to the snapshot as a
 * whole. It is null when the feed is fresh, and never softened when it is not.
 */
export function pulseFreshnessNote(now: Date = new Date()): string | null {
  if (!isStale(now)) return null;
  return `Our rates source last confirmed its data ${daysSinceRefresh(now)} days ago. The figures above carry their own dates — check the latest CBK auction before you invest.`;
}
