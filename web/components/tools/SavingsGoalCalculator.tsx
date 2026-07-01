"use client";

import { useMemo, useState } from "react";
import { solveMonthlyContribution } from "@/lib/savings-goal";
import { formatKES } from "@/lib/budget";
import NumberField from "./NumberField";
import ResultCard from "./ResultCard";

export default function SavingsGoalCalculator() {
  const [target, setTarget] = useState("");
  const [years, setYears] = useState("");
  const [currentSavings, setCurrentSavings] = useState("0");
  const [annualReturn, setAnnualReturn] = useState("10");

  const result = useMemo(() => {
    const targetFutureValue = Number(target);
    const yearsValue = Number(years);
    if (!targetFutureValue || targetFutureValue <= 0 || !yearsValue || yearsValue <= 0) return null;

    const monthly = solveMonthlyContribution({
      targetFutureValue,
      presentValue: Number(currentSavings) || 0,
      annualRate: (Number(annualReturn) || 0) / 100,
      years: yearsValue,
    });

    return Number.isFinite(monthly) ? monthly : null;
  }, [target, years, currentSavings, annualReturn]);

  return (
    <div className="space-y-4">
      <NumberField id="target" label="Savings target (KES)" value={target} onChange={setTarget} placeholder="e.g. 500000" />
      <NumberField id="years" label="Time to reach it (years)" value={years} onChange={setYears} placeholder="e.g. 3" />
      <NumberField
        id="currentSavings"
        label="Current savings (KES)"
        value={currentSavings}
        onChange={setCurrentSavings}
        placeholder="0"
      />
      <NumberField
        id="annualReturn"
        label="Expected annual return"
        value={annualReturn}
        onChange={setAnnualReturn}
        suffix="%"
      />

      {result !== null && (
        <ResultCard
          label="Monthly savings needed"
          value={formatKES(result)}
          sublabel="Assumes returns compound monthly at the rate above."
          tone="success"
        />
      )}
    </div>
  );
}
