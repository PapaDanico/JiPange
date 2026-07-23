"use client";

import { useMemo } from "react";
import { calculateLandPurchase, type LandType } from "@/lib/land";
import { formatKES } from "@/lib/budget";
import { useStickyState, useScrollIntoView } from "@/lib/hooks";
import BehavioralInsightStrip from "./BehavioralInsightStrip";
import CalculatorDisclaimer from "./CalculatorDisclaimer";
import ExportCardButton from "./ExportCardButton";
import NumberField from "./NumberField";
import ResetLink from "./ResetLink";
import QuickFillChips from "./QuickFillChips";
import ResultCard from "./ResultCard";
import ShareResultButton from "./ShareResultButton";
import Toggle from "./Toggle";

const PRICE_CHIPS = [
  { label: "500K", value: "500000" },
  { label: "1M", value: "1000000" },
  { label: "2M", value: "2000000" },
  { label: "5M", value: "5000000" },
  { label: "10M", value: "10000000" },
];

export default function LandPurchaseCalculator() {
  const [price, setPrice] = useStickyState("jipange:tool:land:price", "");
  const [landType, setLandType] = useStickyState<LandType>(
    "jipange:tool:land:type",
    "urban_residential"
  );
  const [usesAgent, setUsesAgent] = useStickyState("jipange:tool:land:agent", "false");

  const result = useMemo(() => {
    const p = Number(price);
    if (!p || p <= 0) return null;
    return calculateLandPurchase({
      plotPriceKes: p,
      landType,
      usesAgent: usesAgent === "true",
    });
  }, [price, landType, usesAgent]);

  const resultsRef = useScrollIntoView<HTMLDivElement>(result !== null);

  const isDirty = price !== "" || landType !== "urban_residential" || usesAgent !== "false";

  function handleReset() {
    setPrice("");
    setLandType("urban_residential");
    setUsesAgent("false");
  }

  const COST_ROWS = result
    ? [
        { label: "Stamp duty", value: result.stampDuty, note: `${result.stampDutyRatePct}% of plot value` },
        { label: "Legal / conveyancing fees", value: result.legalFees, note: `~${result.legalFeesRatePct}%` },
        { label: "Valuation report", value: result.valuationFee, note: "ISK / RICS Kenya scale" },
        { label: "Title deed transfer", value: result.titleTransferFee, note: "Lands Registry" },
        { label: "Land search", value: result.landSearchFee, note: "Lands Registry fee" },
        { label: "Survey / beaconing", value: result.surveyFee, note: "Required for raw plots" },
        ...(result.agentCommission > 0
          ? [{ label: "Agent commission", value: result.agentCommission, note: "3% of plot price" }]
          : []),
      ]
    : [];

  return (
    <div className="space-y-4">
      {/* Plot price */}
      <div>
        <NumberField
          id="price"
          label="Quoted plot price (KES)"
          value={price}
          onChange={setPrice}
          placeholder="e.g. 2000000"
          min={1}
        />
        <QuickFillChips
          label="Common prices:"
          options={PRICE_CHIPS}
          onSelect={setPrice}
          current={price}
        />
      </div>

      {/* Land type */}
      <div>
        <p className="text-sm font-medium text-ink-soft">Land type</p>
        <div className="mt-1 flex rounded-lg border border-border bg-white p-1">
          <button
            type="button"
            onClick={() => setLandType("urban_residential")}
            aria-pressed={landType === "urban_residential"}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
              landType === "urban_residential"
                ? "bg-primary text-white"
                : "text-ink-soft hover:bg-canvas"
            }`}
          >
            Urban / residential (4%)
          </button>
          <button
            type="button"
            onClick={() => setLandType("agricultural")}
            aria-pressed={landType === "agricultural"}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
              landType === "agricultural"
                ? "bg-primary text-white"
                : "text-ink-soft hover:bg-canvas"
            }`}
          >
            Agricultural / rural (2%)
          </button>
        </div>
        <p className="mt-1 text-xs text-faint">
          Stamp duty rate per the Stamp Duty Act Cap 480 (Kenya).
        </p>
      </div>

      {/* Agent toggle */}
      <div className="flex items-center justify-between rounded-lg border border-border bg-white px-4 py-3">
        <div>
          <p className="text-sm font-medium text-ink-soft">Buying through a real estate agent</p>
          <p className="text-xs text-faint">Standard commission is 3% of the plot price</p>
        </div>
        <Toggle
          checked={usesAgent === "true"}
          onChange={() => setUsesAgent(usesAgent === "true" ? "false" : "true")}
          aria-label="Toggle real estate agent"
        />
      </div>

      <ResetLink show={isDirty} onReset={handleReset} />

      {result && (
        <div ref={resultsRef} className="space-y-4" aria-live="polite">
          {/* Headline numbers */}
          <ResultCard
            label="Grand total — what you actually need"
            value={formatKES(result.grandTotal)}
            sublabel={`${formatKES(result.plotPrice)} plot + ${formatKES(result.totalTransactionCosts)} in transaction costs`}
            tone="primary"
          />
          <ResultCard
            label="Hidden transaction costs above quoted price"
            value={formatKES(result.totalTransactionCosts)}
            sublabel={`${result.hiddenCostPct}% on top of the quoted price — budget for this before signing anything.`}
            tone="danger"
          />

          {/* Cost breakdown table */}
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-primary">Full cost breakdown</p>
            <div className="mt-3 space-y-0">
              {/* Plot price row */}
              <div className="flex items-center justify-between border-b border-border py-2.5">
                <div>
                  <p className="text-sm font-semibold text-ink-soft">Quoted plot price</p>
                </div>
                <p className="text-sm font-semibold text-primary tabular-nums">
                  {formatKES(result.plotPrice)}
                </p>
              </div>

              {COST_ROWS.map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between border-b border-border py-2.5"
                >
                  <div>
                    <p className="text-sm text-ink-soft">{row.label}</p>
                    <p className="text-[11px] text-muted">{row.note}</p>
                  </div>
                  <p className="text-sm font-medium text-ink-soft tabular-nums">
                    {formatKES(row.value)}
                  </p>
                </div>
              ))}

              {/* Total row */}
              <div className="flex items-center justify-between pt-2.5">
                <p className="text-sm font-bold text-primary">Grand total</p>
                <p className="text-base font-bold text-primary tabular-nums">
                  {formatKES(result.grandTotal)}
                </p>
              </div>
            </div>
          </div>

          <BehavioralInsightStrip
            insight={`The "anchor" trap: when a seller quotes ${formatKES(result.plotPrice)}, the brain treats that as the total cost. The ${result.hiddenCostPct}% in transaction costs feels like an unwelcome surprise — but it's entirely predictable. Always calculate the grand total before negotiating so you know the true ceiling.`}
          />

          <ShareResultButton
            message={`🏡 *True Cost of My Land Purchase*\n\nPlot price: ${formatKES(result.plotPrice)}\nTransaction costs: ${formatKES(result.totalTransactionCosts)} (${result.hiddenCostPct}%)\nGrand total needed: ${formatKES(result.grandTotal)}\n\nCalculate yours → jipangefinance.org/tools/land-purchase`}
          />

          <ExportCardButton containerRef={resultsRef} filename="land-purchase-costs" />

          <CalculatorDisclaimer
            extraNotes={[
              "Stamp duty is paid to KRA at the time of transfer. Verify the current rate on kra.go.ke before completion.",
              "Conveyancing fees are regulated by the Advocates Remuneration Order but may vary — get a written fee note from your lawyer.",
              "Valuations must be carried out by an ISK-registered valuer. Urban plots often require a full market valuation for stamp duty purposes.",
              "Always conduct a land search at the relevant Lands Registry before paying any money — verify title, caveats, and encumbrances.",
            ]}
          />
        </div>
      )}
    </div>
  );
}
