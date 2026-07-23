"use client";

import { useMemo } from "react";
import { calculateLoanAmortization } from "@/lib/loans";
import { formatKES } from "@/lib/budget";
import { useStickyState, useScrollIntoView } from "@/lib/hooks";
import NumberField from "./NumberField";
import ResetLink from "./ResetLink";
import QuickFillChips from "./QuickFillChips";
import BehavioralInsightStrip from "./BehavioralInsightStrip";
import CalculatorDisclaimer from "./CalculatorDisclaimer";
import ExportCardButton from "./ExportCardButton";
import ResultCard from "./ResultCard";
import ShareResultButton from "./ShareResultButton";
import dynamic from "next/dynamic";

const LoanAmortizationChart = dynamic(() => import("./LoanAmortizationChart"), { ssr: false });

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
      <ResetLink show={isDirty} onReset={handleReset} />

      {result && (
        <>
          <div ref={resultsRef} className="animate-rise space-y-4" aria-live="polite">
            <ResultCard label="Monthly installment" value={formatKES(result.monthlyPayment)} tone="success" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ResultCard label="Total interest paid" value={formatKES(result.totalInterest)} />
              <ResultCard label="Total repaid" value={formatKES(result.totalPaid)} />
            </div>
            <LoanAmortizationChart
              schedule={result.schedule}
              termMonths={Math.round(Number(termYears) * 12)}
              principal={Number(principal)}
            />
            <BehavioralInsightStrip
              insight={`Loss aversion means debt pain is felt more acutely than investment gains of the same amount feel good. That's useful here: at ${annualRate}% annual interest, paying down this loan early delivers a guaranteed, tax-free return equal to the rate — which very few savings products can beat. The total interest above is money already allocated to the lender; every extra payment reclaims a share of it.`}
            />
            <ShareResultButton
              message={`🏦 *My Loan Repayment*\n\nLoan amount: ${formatKES(Number(principal))}\nMonthly installment: ${formatKES(result.monthlyPayment)}\nTotal interest: ${formatKES(result.totalInterest)}\n\nCalculate yours → jipangefinance.org/tools/loan-repayment`}
            />
          </div>
          <ExportCardButton containerRef={resultsRef} filename="loan-repayment" />
          <CalculatorDisclaimer
            extraNotes={[
              "Interest rates shown are approximate. Verify the current rate in your loan agreement or lender app before making repayment decisions.",
              "Early repayment penalties may apply — check your loan terms before making extra payments.",
            ]}
          />
        </>
      )}
    </div>
  );
}
