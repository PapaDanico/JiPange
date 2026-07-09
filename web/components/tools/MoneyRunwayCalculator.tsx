"use client";

import { useMemo } from "react";
import { calculateMoneyRunwayMonths } from "@/lib/runway";
import { useStickyState, useScrollIntoView } from "@/lib/hooks";
import HowItWorks from "./HowItWorks";
import NumberField from "./NumberField";
import ExportCardButton from "./ExportCardButton";
import ProductLinks from "./ProductLinks";
import ResultCard from "./ResultCard";
import ShareResultButton from "./ShareResultButton";
import { MMF_LINKS } from "@/lib/affiliate-links";

function formatDuration(months: number): string {
  if (!Number.isFinite(months)) return "Forever — your balance keeps growing";
  const years = Math.floor(months / 12);
  const remainingMonths = Math.round(months % 12);
  if (years === 0) return `${remainingMonths} months`;
  if (remainingMonths === 0) return `${years} years`;
  return `${years} years, ${remainingMonths} months`;
}

export default function MoneyRunwayCalculator() {
  const [startingBalance, setStartingBalance] = useStickyState(
    "jipange:tool:money-runway:startingBalance",
    ""
  );
  const [monthlyWithdrawal, setMonthlyWithdrawal] = useStickyState(
    "jipange:tool:money-runway:monthlyWithdrawal",
    ""
  );
  const [annualReturn, setAnnualReturn] = useStickyState(
    "jipange:tool:money-runway:annualReturn",
    "6"
  );

  const result = useMemo(() => {
    const balance = Number(startingBalance);
    const withdrawal = Number(monthlyWithdrawal);
    if (!balance || balance <= 0 || !withdrawal || withdrawal <= 0) return null;

    return calculateMoneyRunwayMonths({
      startingBalance: balance,
      monthlyWithdrawal: withdrawal,
      annualReturnRate: Math.max(0, Number(annualReturn) || 0) / 100,
    });
  }, [startingBalance, monthlyWithdrawal, annualReturn]);

  const resultsRef = useScrollIntoView<HTMLDivElement>(result !== null);

  const isDirty = startingBalance !== "" || monthlyWithdrawal !== "" || annualReturn !== "6";

  function handleReset() {
    setStartingBalance("");
    setMonthlyWithdrawal("");
    setAnnualReturn("6");
  }

  return (
    <div className="space-y-4">
      <NumberField
        id="startingBalance"
        label="Starting savings balance (KES)"
        value={startingBalance}
        onChange={setStartingBalance}
        placeholder="e.g. 2000000"
      />
      <NumberField
        id="monthlyWithdrawal"
        label="Monthly withdrawal (KES)"
        value={monthlyWithdrawal}
        onChange={setMonthlyWithdrawal}
        placeholder="e.g. 50000"
      />
      <NumberField
        id="annualReturn"
        label="Expected annual return while drawing down"
        value={annualReturn}
        onChange={setAnnualReturn}
        suffix="%"
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

      {result !== null && (
        <>
          <div ref={resultsRef} className="space-y-4">
            <ResultCard
              label="Your money will last"
              value={formatDuration(result)}
              sublabel="Assumes the remaining balance keeps earning the return rate above."
              tone="success"
            />
            {/* Survival triage: is this cushion thick enough to invest from? */}
            {result < 3 ? (
              <p data-testid="runway-triage" className="rounded-2xl border-2 border-danger bg-[#FBEAEA] p-4 text-sm text-[#4B4238]">
                🚨 <strong className="text-danger">Action Level: High Urgency.</strong> Your safety
                cushion is critically thin. Freeze discretionary spending and route 100% of spare
                liquidity into an emergency MMF buffer before any long-term investing.
              </p>
            ) : (
              <p data-testid="runway-triage" className="rounded-2xl bg-[#E9F5EC] p-4 text-sm text-[#2b4a2b]">
                ✓ <strong>Action Level: Stable Runway.</strong> A healthy baseline safety net — your
                cushion can absorb a shock, so salary surpluses can confidently flow to long-term
                wealth builders.
              </p>
            )}
            <ShareResultButton
              message={`⏳ *My Money Runway*\n\nMy savings will last: ${formatDuration(result)}\n\nCalculate yours → jipangefinance.netlify.app/tools/money-runway`}
            />
          </div>
          <ExportCardButton containerRef={resultsRef} filename="money-runway" />
          <ProductLinks products={MMF_LINKS.slice(0, 3)} heading="Park your runway fund in an MMF" />
        </>
      )}

      <HowItWorks
        steps={[
          "Enter everything you could access within days: M-Pesa, bank, and instant-withdrawal MMF balances.",
          "Set your survival burn rate — rent, basic food, and core utilities only (use 0% return for a strict stress test).",
          "The runway is how long you'd survive a job loss or cash-flow freeze at that burn rate.",
          "Under 3 months: build the cushion first. Over 3 months: your surplus is free for long-term wealth builders.",
        ]}
      />
    </div>
  );
}
