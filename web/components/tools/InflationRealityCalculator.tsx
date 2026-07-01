"use client";

import { useMemo, useState } from "react";
import { inflateToFutureCost, inflationAdjust } from "@/lib/projections";
import { formatKES } from "@/lib/budget";
import CalculatorDisclaimer from "./CalculatorDisclaimer";
import NumberField from "./NumberField";
import ResultCard from "./ResultCard";
import ShareResultButton from "./ShareResultButton";

export default function InflationRealityCalculator() {
  const [salary, setSalary] = useState("");
  const [years, setYears] = useState("5");

  const result = useMemo(() => {
    const salaryValue = Number(salary);
    const yearsValue = Number(years);
    if (!salaryValue || salaryValue <= 0 || !yearsValue || yearsValue <= 0) return null;

    const realValue = inflationAdjust(salaryValue, yearsValue);
    const salaryNeeded = inflateToFutureCost(salaryValue, yearsValue);
    const purchasingPowerLost = salaryNeeded - salaryValue;

    return { salaryValue, yearsValue, realValue, salaryNeeded, purchasingPowerLost };
  }, [salary, years]);

  return (
    <div className="space-y-4">
      <NumberField
        id="salary"
        label="Current monthly salary (KES)"
        value={salary}
        onChange={setSalary}
        placeholder="e.g. 80000"
      />
      <NumberField
        id="years"
        label="Years ahead (1–20)"
        value={years}
        onChange={setYears}
        placeholder="e.g. 5"
      />

      {result && (
        <>
          <ResultCard
            label="Your salary will feel like"
            value={formatKES(result.realValue)}
            sublabel={`If it never rises, in ${result.yearsValue} years your ${formatKES(result.salaryValue)} salary will only buy what ${formatKES(result.realValue)} buys today.`}
            tone="warning"
          />
          <ResultCard
            label="To maintain your standard of living, your salary needs to reach"
            value={formatKES(result.salaryNeeded)}
            tone="success"
          />
          <ResultCard
            label="The raise you need just to keep up"
            value={formatKES(result.purchasingPowerLost)}
          />
          <p className="text-xs text-[#4B4238]">
            Kenya CPI has averaged 6.5% per annum — source: Kenya National Bureau of Statistics
            (KNBS).
          </p>

          <CalculatorDisclaimer />

          <ShareResultButton
            message={`📉 *Inflation Reality Check*\n\nIn ${result.yearsValue} years, my ${formatKES(result.salaryValue)} salary will feel like ${formatKES(result.realValue)} today.\nTo keep up, I need my salary to reach ${formatKES(result.salaryNeeded)}.\n\nCalculate yours → jipangefinance.netlify.app/tools/inflation-reality`}
          />
        </>
      )}
    </div>
  );
}
