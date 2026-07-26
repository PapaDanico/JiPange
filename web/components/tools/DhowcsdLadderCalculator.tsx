"use client";

import { useMemo } from "react";
import {
  BANK_SAVINGS_BASELINE,
  DHOWCSD_BILL_MINIMUM,
  DHOWCSD_MINIMUM,
  dhowcsdLadder,
} from "@/lib/market-2026";
import { formatKES } from "@/lib/budget";
import { useStickyState, useScrollIntoView } from "@/lib/hooks";
import CalculatorDisclaimer from "./CalculatorDisclaimer";
import ExportCardButton from "./ExportCardButton";
import NumberField from "./NumberField";
import ProductLinks from "./ProductLinks";
import ResetLink from "./ResetLink";
import ResultCard from "./ResultCard";
import ShareResultButton from "./ShareResultButton";
import { TBILL_LINKS, MMF_LINKS } from "@/lib/affiliate-links";
import { attribution, daysSinceRefresh, isStale } from "@/lib/rates-feed";

/**
 * DhowCSD T-Bill laddering: capital split evenly across the 91/182/364-day
 * tenors so a tranche matures every quarter while the blend beats bank savings.
 *
 * Every figure shown is NET of the 15% withholding tax, and the card makes the
 * gap between CBK's quote and that net figure explicit. It used to project
 * income from the quoted discount rate, which flattered the ladder by about
 * 0.8 percentage points — see lib/rates-feed.ts. Showing the three numbers
 * side by side is better than silently fixing one of them: the gap is the
 * single most useful thing a first-time bidder can learn here.
 */
export default function DhowcsdLadderCalculator() {
  const [capital, setCapital] = useStickyState("jipange:tool:dhowcsd:capital", "");

  const parsed = Number(capital) || 0;
  const belowMinimum = parsed > 0 && parsed < DHOWCSD_MINIMUM;
  const ladder = useMemo(() => (parsed >= DHOWCSD_MINIMUM ? dhowcsdLadder(parsed) : null), [parsed]);

  const resultsRef = useScrollIntoView<HTMLDivElement>(ladder !== null);

  return (
    <div className="space-y-4">
      <NumberField
        id="ladderCapital"
        label="Capital to allocate (KES)"
        value={capital}
        onChange={setCapital}
        placeholder={`Minimum ${DHOWCSD_MINIMUM.toLocaleString("en-KE")}`}
      />
      <ResetLink show={Boolean(capital)} onReset={() => setCapital("")} />
      {belowMinimum && (
        <div className="space-y-3">
          <p className="text-sm text-danger">
            A single T-Bill bid starts at {formatKES(DHOWCSD_BILL_MINIMUM)}, and this ladder holds
            three of them — so {formatKES(DHOWCSD_MINIMUM)} is the least that builds the full
            structure. Park smaller amounts in an MMF, or bid one tenor at a time, until you cross
            the threshold.
          </p>
          <ProductLinks
            products={MMF_LINKS.slice(0, 2)}
            heading="MMFs to park in while building to KES 50,000"
          />
        </div>
      )}

      {ladder && (
        <>
        <div ref={resultsRef} className="animate-rise space-y-4" aria-live="polite">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {ladder.buckets.map((bucket) => (
              <div key={bucket.days} className="rounded-2xl border border-border bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-accent-ink">
                  {bucket.days}-day
                </p>
                <p className="mt-0.5 text-sm font-semibold text-primary">{bucket.label}</p>
                <p className="mt-2 text-lg font-semibold text-ink">
                  {formatKES(bucket.allocation)}
                </p>
                <p className="text-xs text-ink-soft">
                  at {(bucket.yieldRate * 100).toFixed(2)}% net →{" "}
                  <span className="font-medium text-success">
                    +{formatKES(bucket.annualYieldKes)}/yr
                  </span>
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-ink-soft/80">
                  CBK quotes {(bucket.quotedRate * 100).toFixed(2)}%; that is a discount rate worth{" "}
                  {(bucket.grossRate * 100).toFixed(2)}% before tax.
                </p>
              </div>
            ))}
          </div>

          <ResultCard
            label={`Blended ladder yield: ${(ladder.blendedYield * 100).toFixed(2)}% p.a. net of tax`}
            value={`+${formatKES(ladder.advantageKes)}/yr`}
            sublabel={`vs the same ${formatKES(parsed)} at a bank's ${(BANK_SAVINGS_BASELINE * 100).toFixed(2)}% average: ${formatKES(ladder.ladderAnnualKes)} vs ${formatKES(ladder.bankAnnualKes)} a year — and a tranche matures every ~13 weeks for liquidity.`}
            tone="success"
          />

          <div className="rounded-2xl border border-border bg-accent-soft/40 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent-ink">
              Why these differ from the rate you saw advertised
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">
              CBK quotes T-Bills as a <strong>discount rate</strong>, which is not what you earn.
              You pay less than face value, so the discount is earned on a smaller outlay and the
              true yield is <em>higher</em> than the quote — then 15% withholding tax pulls it
              back <em>below</em> the quote. Every figure above is the net, after tax. Rates come
              from the {attribution()}, and reset at each auction.
            </p>
          </div>

          <CalculatorDisclaimer
            extraNotes={[
              isStale()
                ? `These rates were last refreshed ${daysSinceRefresh()} days ago — check the current CBK auction before bidding.`
                : "Rates reset at each weekly CBK auction; yours will differ.",
              "Yields shown are net of 15% withholding tax.",
            ]}
          />
          <ProductLinks
            products={TBILL_LINKS}
            heading="Register on DhowCSD to start bidding"
          />

          <ShareResultButton
            message={`🏦 *My DhowCSD T-Bill Ladder*\n\n${formatKES(parsed)} split across 91/182/364-day T-Bills earns ~${formatKES(ladder.ladderAnnualKes)}/yr (${(ladder.blendedYield * 100).toFixed(2)}% blended, net of tax) — ${formatKES(ladder.advantageKes)} more than bank savings, with quarterly liquidity.\n\nBuild yours → jipangefinance.org/tools/dhowcsd`}
          />
        </div>
        <ExportCardButton containerRef={resultsRef} filename="dhowcsd-ladder" />
        </>
      )}
    </div>
  );
}
