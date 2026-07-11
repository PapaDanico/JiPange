"use client";

import { useMemo, useRef } from "react";
import { calculate502525Split, formatKES } from "@/lib/budget";
import { useStickyState } from "@/lib/hooks";
import { calculateNetPay } from "@/lib/tax";
import CalculatorDisclaimer from "./CalculatorDisclaimer";
import ExportCardButton from "./ExportCardButton";
import NumberField from "./NumberField";
import ProductLinks from "./ProductLinks";
import ResultCard from "./ResultCard";
import ShareResultButton from "./ShareResultButton";
import { MMF_AND_TBILL_LINKS } from "@/lib/affiliate-links";
import dynamic from "next/dynamic";

const BudgetSplitChart = dynamic(() => import("./BudgetSplitChart"), { ssr: false });

export default function BudgetSplitCalculator() {
  const [grossMonthlySalary, setGrossMonthlySalary] = useStickyState(
    "jipange:tool:budget-split:gross",
    ""
  );

  const exportRef = useRef<HTMLDivElement>(null);

  const result = useMemo(() => {
    const gross = Number(grossMonthlySalary);
    if (!gross || gross <= 0) return null;

    const { netMonthly } = calculateNetPay(gross);
    const split = calculate502525Split(netMonthly);
    return { netMonthly, split };
  }, [grossMonthlySalary]);

  return (
    <div className="space-y-4">
      <NumberField
        id="grossMonthlySalary"
        label="Gross monthly salary (KES)"
        value={grossMonthlySalary}
        onChange={setGrossMonthlySalary}
        placeholder="e.g. 80000"
      />
      {grossMonthlySalary && (
        <button
          type="button"
          onClick={() => setGrossMonthlySalary("")}
          className="text-xs text-[#9A8B80] underline underline-offset-2 hover:text-primary"
        >
          Start over
        </button>
      )}

      {result && (
        <>
          <div ref={exportRef} className="space-y-4">
            <ResultCard label="Your monthly take-home pay" value={formatKES(result.netMonthly)} />
            <ResultCard
              label="Household expenses (50%)"
              value={formatKES(result.split.household)}
              sublabel="Rent, food, transport, utilities, and other daily living costs."
            />
            <ResultCard
              label="Savings — stability & emergency fund (25%)"
              value={formatKES(result.split.savingsEmergency)}
              sublabel="A buffer for the unexpected — job loss, medical bills, family emergencies."
              tone="success"
            />
            <ResultCard
              label="Investments — future projects (25%)"
              value={formatKES(result.split.investments)}
              sublabel="Building wealth for the long term — land, shares, business, retirement."
              tone="primary"
            />

            <BudgetSplitChart
              household={result.split.household}
              savingsEmergency={result.split.savingsEmergency}
              investments={result.split.investments}
            />

            <p className="text-xs text-[#4B4238]">
              A simpler alternative to the Kenya-calibrated 50/15/15/20 split used elsewhere in
              JiPange: 50% for daily living, 25% for a stability/emergency fund, 25% for investing
              in future projects.
            </p>

            <CalculatorDisclaimer />

            <ShareResultButton
              message={`💰 *My 50/25/25 Budget Split*\n\nTake-home pay: ${formatKES(result.netMonthly)}\n\nHousehold (50%): ${formatKES(result.split.household)}\nSavings/emergency (25%): ${formatKES(result.split.savingsEmergency)}\nInvestments (25%): ${formatKES(result.split.investments)}\n\nCalculate yours → jipangefinance.netlify.app/tools/budget-split`}
            />
          </div>
          <ExportCardButton containerRef={exportRef} filename="budget-split" />
          <ProductLinks products={MMF_AND_TBILL_LINKS} heading="Put your 25% investments slice to work" />
        </>
      )}
    </div>
  );
}
