"use client";

import { useMemo, useState } from "react";
import { calculateLoanAmortization } from "@/lib/loans";
import { formatKES } from "@/lib/budget";
import NumberField from "./NumberField";
import ResultCard from "./ResultCard";
import ShareResultButton from "./ShareResultButton";

export default function LoanRepaymentCalculator() {
  const [principal, setPrincipal] = useState("");
  const [annualRate, setAnnualRate] = useState("13");
  const [termYears, setTermYears] = useState("");

  const result = useMemo(() => {
    const principalValue = Number(principal);
    const years = Number(termYears);
    if (!principalValue || principalValue <= 0 || !years || years <= 0) return null;

    return calculateLoanAmortization({
      principal: principalValue,
      annualRate: Math.max(0, Number(annualRate) || 0) / 100,
      termMonths: Math.round(years * 12),
    });
  }, [principal, annualRate, termYears]);

  return (
    <div className="space-y-4">
      <NumberField
        id="principal"
        label="Loan amount / HELB balance (KES)"
        value={principal}
        onChange={setPrincipal}
        placeholder="e.g. 500000"
      />
      <NumberField
        id="annualRate"
        label="Annual interest rate"
        value={annualRate}
        onChange={setAnnualRate}
        suffix="%"
      />
      <NumberField
        id="termYears"
        label="Repayment period (years)"
        value={termYears}
        onChange={setTermYears}
        placeholder="e.g. 5"
      />

      {result && (
        <>
          <ResultCard label="Monthly installment" value={formatKES(result.monthlyPayment)} tone="success" />
          <div className="grid grid-cols-2 gap-3">
            <ResultCard label="Total interest paid" value={formatKES(result.totalInterest)} />
            <ResultCard label="Total repaid" value={formatKES(result.totalPaid)} />
          </div>
          <ShareResultButton
            message={`🏦 *My Loan Repayment*\n\nLoan amount: ${formatKES(Number(principal))}\nMonthly installment: ${formatKES(result.monthlyPayment)}\nTotal interest: ${formatKES(result.totalInterest)}\n\nCalculate yours → jipangefinance.netlify.app/tools/loan-repayment`}
          />
        </>
      )}
    </div>
  );
}
