"use client";

import { useMemo, useState } from "react";
import { calculateFireNumber, calculateYearsToFire } from "@/lib/fire";
import { SAFE_WITHDRAWAL_RATE_NOTE } from "@/lib/projections";
import { formatKES } from "@/lib/budget";
import NumberField from "./NumberField";
import ResultCard from "./ResultCard";
import ShareResultButton from "./ShareResultButton";

export default function FireNumberCalculator() {
  const [monthlyExpenses, setMonthlyExpenses] = useState("");
  const [currentSavings, setCurrentSavings] = useState("0");
  const [monthlyContribution, setMonthlyContribution] = useState("");
  const [annualReturn, setAnnualReturn] = useState("10");

  const result = useMemo(() => {
    const expenses = Number(monthlyExpenses);
    if (!expenses || expenses <= 0) return null;

    const fireNumber = calculateFireNumber(expenses * 12);
    const yearsToFire = calculateYearsToFire({
      fireNumber,
      currentSavings: Number(currentSavings) || 0,
      monthlyContribution: Number(monthlyContribution) || 0,
      annualReturnRate: Math.max(0, Number(annualReturn) || 0) / 100,
    });

    return { fireNumber, yearsToFire };
  }, [monthlyExpenses, currentSavings, monthlyContribution, annualReturn]);

  return (
    <div className="space-y-4">
      <NumberField
        id="monthlyExpenses"
        label="Current monthly expenses (KES)"
        value={monthlyExpenses}
        onChange={setMonthlyExpenses}
        placeholder="e.g. 60000"
      />
      <NumberField
        id="currentSavings"
        label="Current investable savings (KES)"
        value={currentSavings}
        onChange={setCurrentSavings}
        placeholder="0"
      />
      <NumberField
        id="monthlyContribution"
        label="Monthly contribution toward FIRE (KES)"
        value={monthlyContribution}
        onChange={setMonthlyContribution}
        placeholder="e.g. 30000"
      />
      <NumberField
        id="annualReturn"
        label="Expected annual return"
        value={annualReturn}
        onChange={setAnnualReturn}
        suffix="%"
      />

      {result && (
        <>
          <ResultCard label="Your FIRE number" value={formatKES(result.fireNumber)} tone="success" />
          <ResultCard
            label="Years to Financial Independence"
            value={
              Number.isFinite(result.yearsToFire)
                ? `${result.yearsToFire.toFixed(1)} years`
                : "Add a monthly contribution"
            }
          />
          <p className="text-xs text-[#4B4238]">{SAFE_WITHDRAWAL_RATE_NOTE}</p>
          <ShareResultButton
            message={`🔥 *My FIRE Number*\n\nFIRE number: ${formatKES(result.fireNumber)}\nYears to Financial Independence: ${
              Number.isFinite(result.yearsToFire) ? result.yearsToFire.toFixed(1) : "N/A"
            }\n\nCalculate yours → jipangefinance.netlify.app/tools/fire-number`}
          />
        </>
      )}
    </div>
  );
}
