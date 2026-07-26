"use client";

import { useMemo } from "react";
import {
  BANK_SAVINGS_BASELINE,
  DHOWCSD_BILL_MINIMUM,
  DHOWCSD_MINIMUM,
  EVEN_WEIGHTS,
  dhowcsdLadder,
  type TenorWeights,
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
/**
 * Named for the question a reader is answering, not for the split.
 *
 * "60/20/20" tells somebody nothing about whether it suits them. "I may need
 * this in a hurry" does, and the weights follow from it.
 */
const TENORS = [91, 182, 364] as const;

const PRESETS: { id: string; label: string; hint: string; weights: TenorWeights }[] = [
  { id: "even", label: "Even ladder", hint: "A third in each — steady quarterly maturities", weights: { 91: 1, 182: 1, 364: 1 } },
  { id: "liquid", label: "I may need it soon", hint: "Weighted to the 91-day rung", weights: { 91: 3, 182: 1, 364: 1 } },
  { id: "yield", label: "Locked away for a year", hint: "Weighted to the 364-day rung, which pays most", weights: { 91: 1, 182: 1, 364: 3 } },
  { id: "single", label: "One tenor only", hint: "All of it in the 364-day bill", weights: { 91: 0, 182: 0, 364: 1 } },
];

export default function DhowcsdLadderCalculator() {
  const [capital, setCapital] = useStickyState("jipange:tool:dhowcsd:capital", "");
  /**
   * How the reader wants capital split across the three tenors.
   *
   * Equal thirds is a reasonable default and a poor answer to most real
   * questions: a deposit you might need in a hurry belongs mostly in the
   * 91-day rung, and a bonus parked for a year belongs mostly in the 364-day
   * one, which pays the most. Forcing thirds on both was the tool deciding a
   * trade-off that is the reader's to make.
   *
   * Sticky, like the capital field — somebody who has told us they want a
   * liquidity-heavy ladder should not have to say it twice.
   */
  const [weights, setWeights] = useStickyState<TenorWeights>(
    "jipange:tool:dhowcsd:weights",
    EVEN_WEIGHTS,
  );

  const parsed = Number(capital) || 0;
  // A single bill is buyable well below the three-rung ladder minimum, and a
  // reader who has weighted everything into one tenor is entitled to see it.
  // Gating on the full ladder minimum hid a plan they could actually place.
  const belowMinimum = parsed > 0 && parsed < DHOWCSD_BILL_MINIMUM;
  const ladder = useMemo(
    () => (parsed >= DHOWCSD_BILL_MINIMUM ? dhowcsdLadder(parsed, weights) : null),
    [parsed, weights],
  );

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
      <ResetLink
        show={Boolean(capital)}
        onReset={() => {
          setCapital("");
          setWeights(EVEN_WEIGHTS);
        }}
      />

      {/* Allocation. Shown before the result because it changes it, and a
          control that only appears after an answer reads as a correction. */}
      <fieldset className="rounded-2xl border border-border bg-white p-4">
        <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-accent-ink">
          How should it be split?
        </legend>
        <div className="mt-1 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {PRESETS.map((preset) => {
            const active = TENORS.every((d) => (weights[d] ?? 0) === preset.weights[d]);
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => setWeights(preset.weights)}
                aria-pressed={active}
                className={`rounded-xl border px-3 py-2.5 text-left transition-colors ${
                  active
                    ? "border-primary bg-primary/[0.06]"
                    : "border-border hover:bg-canvas"
                }`}
              >
                <span className="block text-sm font-medium text-ink">{preset.label}</span>
                <span className="mt-0.5 block text-[11px] leading-snug text-ink-soft">
                  {preset.hint}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 space-y-3">
          <p className="text-[11px] text-ink-soft">
            Or set the weights yourself. These are shares, not shillings — drag one to zero to
            drop that tenor entirely.
          </p>
          {TENORS.map((days) => {
            const total = TENORS.reduce((sum, d) => sum + (weights[d] ?? 0), 0);
            const share = total > 0 ? ((weights[days] ?? 0) / total) * 100 : 0;
            return (
              <div key={days}>
                <label
                  htmlFor={`weight-${days}`}
                  className="flex items-baseline justify-between text-xs font-medium text-ink-soft"
                >
                  <span>{days}-day</span>
                  <span className="tabular-nums text-accent-ink">{share.toFixed(0)}%</span>
                </label>
                <input
                  id={`weight-${days}`}
                  type="range"
                  min={0}
                  max={10}
                  step={1}
                  value={weights[days] ?? 0}
                  onChange={(e) =>
                    setWeights({ ...weights, [days]: Number(e.target.value) })
                  }
                  className="mt-1 w-full accent-primary"
                />
              </div>
            );
          })}
        </div>
      </fieldset>
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

      {ladder && ladder.buckets.length === 0 && (
        <p className="text-sm text-danger">
          {TENORS.every((d) => (weights[d] ?? 0) === 0)
            ? "Every tenor is weighted to zero — give at least one of them a share."
            : `At this split no single rung reaches the ${formatKES(DHOWCSD_BILL_MINIMUM)} minimum for one bill. Raise the amount, or put more weight on fewer tenors.`}
        </p>
      )}

      {ladder && ladder.buckets.length > 0 && (
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

          {ladder.unallocatedKes > 0 && (
            <p className="text-xs text-ink-soft">
              <strong className="text-ink">{formatKES(ladder.unallocatedKes)}</strong> is left
              unplaced: CBK bids go in KES 50,000 steps from a {formatKES(DHOWCSD_BILL_MINIMUM)}{" "}
              minimum, so each rung is rounded down to an amount you could actually bid. Keep it
              liquid, or nudge the amount up to absorb it.
            </p>
          )}

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
            message={`🏦 *My DhowCSD T-Bill Ladder*\n\n${formatKES(parsed)} across ${ladder.buckets.map((b) => b.days + "d").join("/")} T-Bills earns ~${formatKES(ladder.ladderAnnualKes)}/yr (${(ladder.blendedYield * 100).toFixed(2)}% blended, net of tax) — ${formatKES(ladder.advantageKes)} more than bank savings, with quarterly liquidity.\n\nBuild yours → jipangefinance.org/tools/dhowcsd`}
          />
        </div>
        <ExportCardButton containerRef={resultsRef} filename="dhowcsd-ladder" />
        </>
      )}
    </div>
  );
}
