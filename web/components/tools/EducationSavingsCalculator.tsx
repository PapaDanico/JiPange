"use client";

import { useMemo, useState } from "react";
import { solveMonthlyContribution } from "@/lib/savings-goal";
import { formatKES } from "@/lib/budget";
import NumberField from "./NumberField";
import ResultCard from "./ResultCard";

export default function EducationSavingsCalculator() {
  const [targetFees, setTargetFees] = useState("");
  const [yearsUntilNeeded, setYearsUntilNeeded] = useState("");
  const [currentSavings, setCurrentSavings] = useState("0");
  const [annualReturn, setAnnualReturn] = useState("8");

  const result = useMemo(() => {
    const targetFutureValue = Number(targetFees);
    const years = Number(yearsUntilNeeded);
    if (!targetFutureValue || targetFutureValue <= 0 || !years || years <= 0) return null;

    const monthly = solveMonthlyContribution({
      targetFutureValue,
      presentValue: Number(currentSavings) || 0,
      annualRate: Math.max(0, Number(annualReturn) || 0) / 100,
      years,
    });

    return Number.isFinite(monthly) ? monthly : null;
  }, [targetFees, yearsUntilNeeded, currentSavings, annualReturn]);

  return (
    <div className="space-y-4">
      <NumberField
        id="targetFees"
        label="Total school fees target (KES)"
        value={targetFees}
        onChange={setTargetFees}
        placeholder="e.g. 1500000"
      />
      <NumberField
        id="yearsUntilNeeded"
        label="Years until your child needs it"
        value={yearsUntilNeeded}
        onChange={setYearsUntilNeeded}
        placeholder="e.g. 10"
      />
      <NumberField
        id="currentSavings"
        label="Already saved toward this (KES)"
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
          sublabel="A dedicated education fund (e.g. a money market fund) can help this grow steadily."
          tone="success"
        />
      )}
    </div>
  );
}
