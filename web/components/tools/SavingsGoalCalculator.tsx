"use client";

import { useMemo, useState } from "react";
import { solveMonthlyContribution } from "@/lib/savings-goal";
import { formatKES } from "@/lib/budget";
import HowItWorks from "./HowItWorks";
import NumberField from "./NumberField";
import ResultCard from "./ResultCard";
import ShareResultButton from "./ShareResultButton";

const RATE_PRESETS = [
  { label: "Bank 3.23%", value: "3.23" },
  { label: "Sacco ~9%", value: "9" },
  { label: "MMF ~11.5%", value: "11.5" },
];

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
      annualRate: Math.max(0, Number(annualReturn) || 0) / 100,
      years: yearsValue,
    });

    return Number.isFinite(monthly) ? monthly : null;
  }, [target, years, currentSavings, annualReturn]);

  // Timeline sensitivity: what one year of patience (or urgency) costs.
  const sensitivity = useMemo(() => {
    const targetFutureValue = Number(target);
    const yearsValue = Number(years);
    if (!targetFutureValue || targetFutureValue <= 0 || !yearsValue || yearsValue <= 1) return null;
    const at = (y: number) =>
      solveMonthlyContribution({
        targetFutureValue,
        presentValue: Number(currentSavings) || 0,
        annualRate: Math.max(0, Number(annualReturn) || 0) / 100,
        years: y,
      });
    return { faster: at(yearsValue - 1), slower: at(yearsValue + 1) };
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
      <div className="flex flex-wrap gap-2">
        {RATE_PRESETS.map((preset) => (
          <button
            key={preset.value}
            type="button"
            onClick={() => setAnnualReturn(preset.value)}
            aria-pressed={annualReturn === preset.value}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              annualReturn === preset.value
                ? "border-accent bg-accent text-[#171717]"
                : "border-[#E5E0D8] bg-white text-[#4B4238] hover:bg-[#F1ECE3]"
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {result !== null && (
        <>
          <ResultCard
            label="Monthly savings needed"
            value={formatKES(result)}
            sublabel="Assumes returns compound monthly at the rate above."
            tone="success"
          />
          {sensitivity && (
            <div className="grid grid-cols-2 gap-3" data-testid="goal-sensitivity">
              <ResultCard
                label={`In ${Number(years) - 1} years instead`}
                value={formatKES(sensitivity.faster)}
                sublabel="/month"
              />
              <ResultCard
                label={`In ${Number(years) + 1} years instead`}
                value={formatKES(sensitivity.slower)}
                sublabel="/month"
                tone="success"
              />
            </div>
          )}
          <ShareResultButton
            message={`🎯 *My Savings Goal*\n\nTarget: ${formatKES(Number(target))} in ${years} years\nMonthly savings needed: ${formatKES(result)}\n\nCalculate yours → jipangefinance.netlify.app/tools/savings-goal`}
          />
        </>
      )}

      <HowItWorks
        steps={[
          "Enter the amount you're saving toward and your deadline in years.",
          "Add anything already saved — it works for you the whole time and lowers the monthly figure.",
          "Pick where the money will sit: the same goal needs far less per month in an MMF at ~11.5% than in a bank at 3.23%.",
          "Compare the ±1 year cards — one extra year of patience is often the cheapest lever you have.",
        ]}
      />
    </div>
  );
}
