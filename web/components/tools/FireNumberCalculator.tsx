"use client";

import { useMemo, useState } from "react";
import {
  calculateFireNumber,
  calculateInflationAdjustedFireNumber,
  calculateYearsToFire,
  KENYA_ADJUSTED_SAFE_WITHDRAWAL_RATE,
} from "@/lib/fire";
import { SAFE_WITHDRAWAL_RATE, SAFE_WITHDRAWAL_RATE_NOTE } from "@/lib/projections";
import { formatKES } from "@/lib/budget";
import CalculatorDisclaimer from "./CalculatorDisclaimer";
import NumberField from "./NumberField";
import ResultCard from "./ResultCard";
import ShareResultButton from "./ShareResultButton";

function formatYears(years: number): string {
  return Number.isFinite(years) ? `${years.toFixed(1)} years` : "Add a monthly contribution";
}

export default function FireNumberCalculator() {
  const [monthlyExpenses, setMonthlyExpenses] = useState("");
  const [currentSavings, setCurrentSavings] = useState("0");
  const [monthlyContribution, setMonthlyContribution] = useState("");
  const [annualReturn, setAnnualReturn] = useState("10");

  const result = useMemo(() => {
    const expenses = Number(monthlyExpenses);
    if (!expenses || expenses <= 0) return null;

    const savings = Number(currentSavings) || 0;
    const contribution = Number(monthlyContribution) || 0;
    const returnRate = Math.max(0, Number(annualReturn) || 0) / 100;

    const standardFireNumber = calculateFireNumber(expenses * 12, SAFE_WITHDRAWAL_RATE);
    const kenyaFireNumber = calculateFireNumber(expenses * 12, KENYA_ADJUSTED_SAFE_WITHDRAWAL_RATE);

    const standardYears = calculateYearsToFire({
      fireNumber: standardFireNumber,
      currentSavings: savings,
      monthlyContribution: contribution,
      annualReturnRate: returnRate,
    });
    const kenyaYears = calculateYearsToFire({
      fireNumber: kenyaFireNumber,
      currentSavings: savings,
      monthlyContribution: contribution,
      annualReturnRate: returnRate,
    });

    const inflationAdjustedFireNumber = calculateInflationAdjustedFireNumber({
      currentMonthlyExpenses: expenses,
      yearsToRetirement: Number.isFinite(kenyaYears) ? kenyaYears : 0,
    });

    return { standardFireNumber, kenyaFireNumber, standardYears, kenyaYears, inflationAdjustedFireNumber };
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
          <ResultCard
            label="Standard (4% rule)"
            value={formatKES(result.standardFireNumber)}
            sublabel={formatYears(result.standardYears)}
          />
          <ResultCard
            label="Kenya-adjusted (2.75% rule) — the honest number"
            value={formatKES(result.kenyaFireNumber)}
            sublabel={formatYears(result.kenyaYears)}
            tone="warning"
          />
          <ResultCard
            label="Inflation-adjusted Kenya FIRE number"
            value={formatKES(result.inflationAdjustedFireNumber)}
            sublabel="Accounts for your expenses rising with inflation until you actually retire."
            tone="danger"
          />
          <p className="text-xs text-[#4B4238]">
            {SAFE_WITHDRAWAL_RATE_NOTE} Kenya&apos;s inflation runs hotter (~6.5% average) and the
            shilling isn&apos;t a reserve currency, so a lower 2.5–3% withdrawal rate is a more
            honest planning assumption here.
          </p>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-primary">
              To reach your FIRE number, consider
            </p>
            <ul className="mt-2 space-y-1 text-sm text-[#4B4238]">
              <li>• T-Bills (CBK DhowCSD, 91-day)</li>
              <li>• NSE equities (historical average returns)</li>
              <li>• SACCO dividends</li>
              <li>• Money market funds</li>
            </ul>
            <p className="mt-2 text-xs text-[#4B4238]">
              Rates change — check{" "}
              <a
                href="https://www.centralbank.go.ke"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-primary"
              >
                cbk.go.ke
              </a>{" "}
              for current T-Bill yields before investing.
            </p>
          </div>

          <CalculatorDisclaimer
            extraNotes={[
              "Past returns do not guarantee future returns.",
              "JiPange is not a licensed investment advisor.",
            ]}
          />

          <ShareResultButton
            message={`🔥 *My FIRE Number*\n\nStandard (4% rule): ${formatKES(result.standardFireNumber)}\nKenya-adjusted (2.75% rule): ${formatKES(result.kenyaFireNumber)}\nYears to Financial Independence: ${
              Number.isFinite(result.kenyaYears) ? result.kenyaYears.toFixed(1) : "N/A"
            }\n\nCalculate yours → jipangefinance.netlify.app/tools/fire-number`}
          />
        </>
      )}
    </div>
  );
}
