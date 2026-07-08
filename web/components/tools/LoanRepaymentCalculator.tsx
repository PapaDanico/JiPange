"use client";

import { useMemo } from "react";
import { calculateLoanAmortization } from "@/lib/loans";
import { formatKES } from "@/lib/budget";
import { useStickyState, useScrollIntoView } from "@/lib/hooks";
import NumberField from "./NumberField";
import QuickFillChips from "./QuickFillChips";
import ResultCard from "./ResultCard";
import ShareResultButton from "./ShareResultButton";

const PRINCIPAL_CHIPS = [
  { label: "50K", value: "50000" },
  { label: "100K", value: "100000" },
  { label: "300K", value: "300000" },
  { label: "500K", value: "500000" },
  { label: "1M", value: "1000000" },
];

const RATE_CHIPS = [
  { label: "8% HELB", value: "8" },
  { label: "13% SACCO", value: "13" },
  { label: "18% bank", value: "18" },
];

const TERM_CHIPS = [
  { label: "1 yr", value: "1" },
  { label: "2 yr", value: "2" },
  { label: "3 yr", value: "3" },
  { label: "5 yr", value: "5" },
];

export default function LoanRepaymentCalculator() {
  const [principal, setPrincipal] = useStickyState(
    "jipange:tool:loan-repayment:principal",
    ""
  );
  const [annualRate, setAnnualRate] = useStickyState(
    "jipange:tool:loan-repayment:annualRate",
    "13"
  );
  const [termYears, setTermYears] = useStickyState(
    "jipange:tool:loan-repayment:termYears",
    ""
  );

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

  const resultsRef = useScrollIntoView<HTMLDivElement>(result !== null);

  const isDirty = principal !== "" || annualRate !== "13" || termYears !== "";

  function handleReset() {
    setPrincipal("");
    setAnnualRate("13");
    setTermYears("");
  }

  return (
    <div className="space-y-4">
      <div>
        <NumberField
          id="principal"
          label="Loan amount / HELB balance (KES)"
          value={principal}
          onChange={setPrincipal}
          placeholder="e.g. 500000"
        />
        <QuickFillChips
          label="Quick fill:"
          options={PRINCIPAL_CHIPS}
          onSelect={setPrincipal}
          current={principal}
        />
      </div>
      <div>
        <NumberField
          id="annualRate"
          label="Annual interest rate"
          value={annualRate}
          onChange={setAnnualRate}
          suffix="%"
        />
        <QuickFillChips
          label="Common rates:"
          options={RATE_CHIPS}
          onSelect={setAnnualRate}
          current={annualRate}
        />
      </div>
      <div>
        <NumberField
          id="termYears"
          label="Repayment period (years)"
          value={termYears}
          onChange={setTermYears}
          placeholder="e.g. 5"
        />
        <QuickFillChips
          label="Quick fill:"
          options={TERM_CHIPS}
          onSelect={setTermYears}
          current={termYears}
        />
      </div>
      {isDirty && (
        <button
          type="button"
          onClick={handleReset}
          className="text-xs text-[#9A8B80] underline underline-offset-2 hover:text-primary"
        >
          Start over
        </button>
      )}

      {result && (
        <div ref={resultsRef} className="space-y-4">
          <ResultCard label="Monthly installment" value={formatKES(result.monthlyPayment)} tone="success" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ResultCard label="Total interest paid" value={formatKES(result.totalInterest)} />
            <ResultCard label="Total repaid" value={formatKES(result.totalPaid)} />
          </div>
          <ShareResultButton
            message={`🏦 *My Loan Repayment*\n\nLoan amount: ${formatKES(Number(principal))}\nMonthly installment: ${formatKES(result.monthlyPayment)}\nTotal interest: ${formatKES(result.totalInterest)}\n\nCalculate yours → jipangefinance.netlify.app/tools/loan-repayment`}
          />
        </div>
      )}
    </div>
  );
}
