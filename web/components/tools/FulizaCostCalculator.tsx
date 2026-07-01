"use client";

import { useMemo, useState } from "react";
import { calculateFulizaCost } from "@/lib/fuliza";
import { formatKES } from "@/lib/budget";
import CalculatorDisclaimer from "./CalculatorDisclaimer";
import NumberField from "./NumberField";
import ResultCard from "./ResultCard";
import ShareResultButton from "./ShareResultButton";

export default function FulizaCostCalculator() {
  const [amount, setAmount] = useState("");
  const [days, setDays] = useState("");

  const result = useMemo(() => {
    const principal = Number(amount);
    const daysValue = Number(days);
    if (!principal || principal <= 0 || !daysValue || daysValue <= 0) return null;
    return calculateFulizaCost(principal, daysValue);
  }, [amount, days]);

  return (
    <div className="space-y-4">
      <NumberField
        id="amount"
        label="Amount borrowed (KES)"
        value={amount}
        onChange={setAmount}
        placeholder="e.g. 5000"
      />
      <NumberField
        id="days"
        label="Days until you repay"
        value={days}
        onChange={setDays}
        placeholder="e.g. 7"
      />

      {result && (
        <>
          <ResultCard
            label="Total cost of borrowing"
            value={formatKES(result.totalFee)}
            sublabel={`Borrowing ${formatKES(Number(amount))} for ${days} days costs ${formatKES(result.totalFee)} — equivalent to roughly ${Math.round(result.annualisedApr * 100)}% APR.`}
            tone="danger"
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ResultCard label="Daily fee" value={formatKES(result.dailyFee)} />
            <ResultCard label="Total repaid" value={formatKES(result.totalRepaid)} />
            <ResultCard label="Cost as % of principal" value={`${result.percentOfPrincipal}%`} />
            <ResultCard
              label="Same amount, 30-day SACCO loan"
              value={formatKES(result.saccoComparisonTotalRepaid)}
              tone="success"
            />
          </div>
          <p className="text-xs text-[#4B4238]">
            Fuliza and similar overdraft products are emergency tools, not personal finance tools —
            rates change periodically, so verify the current rate in your M-PESA app before
            relying on this figure.
          </p>

          <CalculatorDisclaimer />

          <ShareResultButton
            message={`📱 *True Cost of Fuliza*\n\nBorrowing ${formatKES(Number(amount))} for ${days} days costs ${formatKES(result.totalFee)} in fees.\nThat's about ${Math.round(result.annualisedApr * 100)}% APR.\n\nCalculate yours → jipangefinance.netlify.app/tools/fuliza-cost`}
          />
        </>
      )}
    </div>
  );
}
