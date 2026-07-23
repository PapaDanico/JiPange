"use client";

import { useMemo } from "react";
import {
  BANK_SAVINGS_BASELINE,
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

/**
 * DhowCSD T-Bill laddering: capital split evenly across the 91/182/364-day
 * tenors so a tranche matures every quarter while the blend crushes bank
 * savings yields.
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
            DhowCSD T-Bill bids start at {formatKES(DHOWCSD_MINIMUM)} — park smaller amounts in an
            MMF until you cross the threshold.
          </p>
          <ProductLinks
            products={MMF_LINKS.slice(0, 2)}
            heading="MMFs to park in while building to KES 50,000"
          />
        </div>
      )}

      {ladder && (
        <>
        <div ref={resultsRef} className="space-y-4" aria-live="polite">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {ladder.buckets.map((bucket) => (
              <div key={bucket.days} className="rounded-2xl border border-[#E5E0D8] bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#946213]">
                  {bucket.days}-day
                </p>
                <p className="mt-0.5 text-sm font-semibold text-primary">{bucket.label}</p>
                <p className="mt-2 text-lg font-semibold text-[#171717]">
                  {formatKES(bucket.allocation)}
                </p>
                <p className="text-xs text-[#4B4238]">
                  at {(bucket.yieldRate * 100).toFixed(2)}% →{" "}
                  <span className="font-medium text-success">
                    +{formatKES(bucket.annualYieldKes)}/yr
                  </span>
                </p>
              </div>
            ))}
          </div>

          <ResultCard
            label={`Blended ladder yield: ${(ladder.blendedYield * 100).toFixed(2)}% p.a.`}
            value={`+${formatKES(ladder.advantageKes)}/yr`}
            sublabel={`vs the same ${formatKES(parsed)} at a bank's ${(BANK_SAVINGS_BASELINE * 100).toFixed(2)}% average: ${formatKES(ladder.ladderAnnualKes)} vs ${formatKES(ladder.bankAnnualKes)} a year — and a tranche matures every ~13 weeks for liquidity.`}
            tone="success"
          />

          <CalculatorDisclaimer
            extraNotes={[
              "T-Bill yields quoted are recent auction baselines — actual rates set at each CBK auction.",
            ]}
          />
          <ProductLinks
            products={TBILL_LINKS}
            heading="Register on DhowCSD to start bidding"
          />

          <ShareResultButton
            message={`🏦 *My DhowCSD T-Bill Ladder*\n\n${formatKES(parsed)} split across 91/182/364-day T-Bills earns ~${formatKES(ladder.ladderAnnualKes)}/yr (${(ladder.blendedYield * 100).toFixed(2)}% blended) — ${formatKES(ladder.advantageKes)} more than bank savings, with quarterly liquidity.\n\nBuild yours → jipangefinance.org/tools/dhowcsd`}
          />
        </div>
        <ExportCardButton containerRef={resultsRef} filename="dhowcsd-ladder" />
        </>
      )}
    </div>
  );
}
