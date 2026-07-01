"use client";

import { useMemo, useState } from "react";
import { calculateMoneyRunwayMonths } from "@/lib/runway";
import NumberField from "./NumberField";
import ResultCard from "./ResultCard";

function formatDuration(months: number): string {
  if (!Number.isFinite(months)) return "Forever — your balance keeps growing";
  const years = Math.floor(months / 12);
  const remainingMonths = Math.round(months % 12);
  if (years === 0) return `${remainingMonths} months`;
  if (remainingMonths === 0) return `${years} years`;
  return `${years} years, ${remainingMonths} months`;
}

export default function MoneyRunwayCalculator() {
  const [startingBalance, setStartingBalance] = useState("");
  const [monthlyWithdrawal, setMonthlyWithdrawal] = useState("");
  const [annualReturn, setAnnualReturn] = useState("6");

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

      {result !== null && (
        <ResultCard
          label="Your money will last"
          value={formatDuration(result)}
          sublabel="Assumes the remaining balance keeps earning the return rate above."
          tone="success"
        />
      )}
    </div>
  );
}
