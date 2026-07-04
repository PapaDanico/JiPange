"use client";

import { useMemo, useState } from "react";
import { futureValueWithStepUp, inflationAdjust } from "@/lib/projections";
import { formatKES } from "@/lib/budget";
import HowItWorks from "./HowItWorks";
import NumberField from "./NumberField";
import ResultCard from "./ResultCard";
import ShareResultButton from "./ShareResultButton";

const RATE_PRESETS = [
  { label: "Bank 3.23%", value: "3.23" },
  { label: "T-Bill ~8.9%", value: "8.9" },
  { label: "MMF ~11.5%", value: "11.5" },
];

export default function InvestmentReturnsCalculator() {
  const [lumpSum, setLumpSum] = useState("0");
  const [monthly, setMonthly] = useState("");
  const [annualReturn, setAnnualReturn] = useState("10");
  const [years, setYears] = useState("");
  const [stepUp, setStepUp] = useState(0);

  const result = useMemo(() => {
    const yearsValue = Number(years);
    if (!yearsValue || yearsValue <= 0) return null;

    const { total, totalContributed } = futureValueWithStepUp(
      Number(lumpSum) || 0,
      Number(monthly) || 0,
      Math.max(0, Number(annualReturn) || 0) / 100,
      yearsValue,
      stepUp / 100
    );

    return {
      total,
      totalContributed,
      growth: total - totalContributed,
      realValue: inflationAdjust(total, yearsValue),
    };
  }, [lumpSum, monthly, annualReturn, years, stepUp]);

  return (
    <div className="space-y-4">
      <NumberField id="lumpSum" label="Starting lump sum (KES)" value={lumpSum} onChange={setLumpSum} placeholder="0" />
      <NumberField id="monthly" label="Monthly contribution (KES)" value={monthly} onChange={setMonthly} placeholder="e.g. 10000" />
      <NumberField id="annualReturn" label="Expected annual return" value={annualReturn} onChange={setAnnualReturn} suffix="%" />
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
      <NumberField id="years" label="Investment period (years)" value={years} onChange={setYears} placeholder="e.g. 10" />

      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="stepUp" className="text-sm font-medium text-[#4B4238]">
            Increase contribution each year (as income grows)
          </label>
          <span className="text-sm font-semibold text-primary">+{stepUp}%/yr</span>
        </div>
        <input
          id="stepUp"
          type="range"
          min={0}
          max={25}
          value={stepUp}
          onChange={(event) => setStepUp(Number(event.target.value))}
          className="mt-2 h-2 w-full accent-primary"
        />
      </div>

      {result && (
        <>
          <ResultCard
            label="Projected future value"
            value={formatKES(result.total)}
            sublabel={`Worth ${formatKES(result.realValue)} in today's shillings after inflation.`}
            tone="success"
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ResultCard label="Total contributed" value={formatKES(result.totalContributed)} />
            <ResultCard label="Growth earned" value={formatKES(result.growth)} tone="success" />
          </div>
          <ShareResultButton
            message={`📈 *My Investment Projection*\n\nIn ${years} years: ${formatKES(result.total)}\nGrowth earned: ${formatKES(result.growth)}\n\nCalculate yours → jipangefinance.netlify.app/tools/investment-returns`}
          />
        </>
      )}

      <HowItWorks
        steps={[
          "Enter what you have now and what you can add monthly.",
          "Pick a return preset (bank, T-Bill, MMF) or type your own rate.",
          "Use the step-up slider if your contributions will grow with your income — even +10%/yr changes the ending dramatically.",
          "Check the 'today's shillings' line: that is what the money will actually buy after inflation.",
        ]}
      />
    </div>
  );
}
