"use client";

import { useMemo } from "react";
import { calculateFulizaCost } from "@/lib/fuliza";
import { formatKES } from "@/lib/budget";
import { useStickyState, useScrollIntoView } from "@/lib/hooks";
import BehavioralInsightStrip from "./BehavioralInsightStrip";
import CalculatorDisclaimer from "./CalculatorDisclaimer";
import ExportCardButton from "./ExportCardButton";
import NumberField from "./NumberField";
import ProductLinks from "./ProductLinks";
import ResultCard from "./ResultCard";
import ShareResultButton from "./ShareResultButton";
import { MMF_LINKS } from "@/lib/affiliate-links";

export default function FulizaCostCalculator() {
  const [amount, setAmount] = useStickyState("jipange:tool:fuliza-cost:amount", "");
  const [days, setDays] = useStickyState("jipange:tool:fuliza-cost:days", "");

  const result = useMemo(() => {
    const principal = Number(amount);
    const daysValue = Number(days);
    if (!principal || principal <= 0 || !daysValue || daysValue <= 0) return null;
    return calculateFulizaCost(principal, daysValue);
  }, [amount, days]);

  const resultsRef = useScrollIntoView<HTMLDivElement>(result !== null);

  const isDirty = amount !== "" || days !== "";

  function handleReset() {
    setAmount("");
    setDays("");
  }

  return (
    <div className="space-y-4">
      <NumberField
        id="amount"
        label="Amount borrowed (KES)"
        value={amount}
        onChange={setAmount}
        placeholder="e.g. 5000"
      />
      <NumberField
        id="days"
        label="Days until you repay"
        value={days}
        onChange={setDays}
        placeholder="e.g. 7"
      />
      {isDirty && (
        <button
          type="button"
          onClick={handleReset}
          className="text-xs text-[#9A8B80] underline underline-offset-2 hover:text-primary"
        >
          Start over
        </button>
      )}

      {result && (
        <>
          <div ref={resultsRef} className="space-y-4">
            <ResultCard
              label="Total cost of borrowing"
              value={formatKES(result.totalFee)}
              sublabel={`Borrowing ${formatKES(Number(amount))} for ${days} days costs ${formatKES(result.totalFee)} — equivalent to roughly ${Math.round(result.annualisedApr * 100)}% APR.`}
              tone="danger"
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ResultCard label="Daily fee" value={formatKES(result.dailyFee)} />
              <ResultCard label="Total repaid" value={formatKES(result.totalRepaid)} />
              <ResultCard label="Cost as % of principal" value={`${result.percentOfPrincipal}%`} />
              <ResultCard
                label="Same amount, 30-day SACCO loan"
                value={formatKES(result.saccoComparisonTotalRepaid)}
                tone="success"
              />
            </div>
            <p className="text-xs text-[#4B4238]">
              Fuliza and similar overdraft products are emergency tools, not personal finance tools —
              rates change periodically, so verify the current rate in your M-PESA app before
              relying on this figure.
            </p>

            <BehavioralInsightStrip
              insight="Each Fuliza fee feels small in isolation — that's the marginal cost trap. Behavioural economists call it the 'pennies-a-day' illusion: we evaluate each transaction individually and never sum the true annual toll. The APR figure above converts that illusion into a single number your brain can actually weigh."
            />
            <CalculatorDisclaimer />

            <ShareResultButton
              message={`📱 *True Cost of Fuliza*\n\nBorrowing ${formatKES(Number(amount))} for ${days} days costs ${formatKES(result.totalFee)} in fees.\nThat's about ${Math.round(result.annualisedApr * 100)}% APR.\n\nCalculate yours → jipangefinance.netlify.app/tools/fuliza-cost`}
            />
          </div>
          <ExportCardButton containerRef={resultsRef} filename="fuliza-cost" />
          <ProductLinks products={MMF_LINKS.slice(0, 2)} heading="Build an emergency float in an MMF instead" />
        </>
      )}
    </div>
  );
}
