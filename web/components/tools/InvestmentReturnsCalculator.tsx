"use client";

import { useMemo, useState } from "react";
import { futureValue } from "@/lib/projections";
import { formatKES } from "@/lib/budget";
import NumberField from "./NumberField";
import ResultCard from "./ResultCard";

export default function InvestmentReturnsCalculator() {
  const [lumpSum, setLumpSum] = useState("0");
  const [monthly, setMonthly] = useState("");
  const [annualReturn, setAnnualReturn] = useState("10");
  const [years, setYears] = useState("");

  const result = useMemo(() => {
    const yearsValue = Number(years);
    if (!yearsValue || yearsValue <= 0) return null;

    const presentValue = Number(lumpSum) || 0;
    const monthlyContribution = Number(monthly) || 0;
    const rate = (Number(annualReturn) || 0) / 100;

    const total = futureValue(presentValue, monthlyContribution, rate, yearsValue);
    const totalContributed = presentValue + monthlyContribution * yearsValue * 12;
    const growth = total - totalContributed;

    return { total, totalContributed, growth };
  }, [lumpSum, monthly, annualReturn, years]);

  return (
    <div className="space-y-4">
      <NumberField id="lumpSum" label="Starting lump sum (KES)" value={lumpSum} onChange={setLumpSum} placeholder="0" />
      <NumberField id="monthly" label="Monthly contribution (KES)" value={monthly} onChange={setMonthly} placeholder="e.g. 10000" />
      <NumberField id="annualReturn" label="Expected annual return" value={annualReturn} onChange={setAnnualReturn} suffix="%" />
      <NumberField id="years" label="Investment period (years)" value={years} onChange={setYears} placeholder="e.g. 10" />

      {result && (
        <>
          <ResultCard label="Projected future value" value={formatKES(result.total)} tone="success" />
          <div className="grid grid-cols-2 gap-3">
            <ResultCard label="Total contributed" value={formatKES(result.totalContributed)} />
            <ResultCard label="Growth earned" value={formatKES(result.growth)} tone="success" />
          </div>
        </>
      )}
    </div>
  );
}
