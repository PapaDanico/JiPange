"use client";

import { useMemo } from "react";
import { checkOneThirdRule } from "@/lib/one-third-rule";
import { formatKES } from "@/lib/budget";
import { useStickyState, useScrollIntoView } from "@/lib/hooks";
import CalculatorDisclaimer from "./CalculatorDisclaimer";
import NumberField from "./NumberField";
import ResultCard from "./ResultCard";
import ShareResultButton from "./ShareResultButton";

export default function OneThirdRuleCalculator() {
  const [basicSalary, setBasicSalary] = useStickyState(
    "jipange:tool:one-third-rule:basicSalary",
    ""
  );
  const [saccoDeductions, setSaccoDeductions] = useStickyState(
    "jipange:tool:one-third-rule:saccoDeductions",
    "0"
  );
  const [loanDeductions, setLoanDeductions] = useStickyState(
    "jipange:tool:one-third-rule:loanDeductions",
    "0"
  );

  const result = useMemo(() => {
    const basic = Number(basicSalary);
    if (!basic || basic <= 0) return null;

    return checkOneThirdRule({
      basicSalary: basic,
      saccoDeductions: Number(saccoDeductions) || 0,
      loanDeductions: Number(loanDeductions) || 0,
    });
  }, [basicSalary, saccoDeductions, loanDeductions]);

  const resultsRef = useScrollIntoView<HTMLDivElement>(result !== null);

  const isDirty = basicSalary !== "" || saccoDeductions !== "0" || loanDeductions !== "0";

  function handleReset() {
    setBasicSalary("");
    setSaccoDeductions("0");
    setLoanDeductions("0");
  }

  return (
    <div className="space-y-4">
      <NumberField
        id="basicSalary"
        label="Basic salary (KES) — not gross"
        value={basicSalary}
        onChange={setBasicSalary}
        placeholder="e.g. 40000"
      />
      <NumberField
        id="saccoDeductions"
        label="Total SACCO/cooperative deductions (KES)"
        value={saccoDeductions}
        onChange={setSaccoDeductions}
        placeholder="0"
      />
      <NumberField
        id="loanDeductions"
        label="Total loan repayment deductions, non-statutory (KES)"
        value={loanDeductions}
        onChange={setLoanDeductions}
        placeholder="0"
      />
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
          {result.compliant ? (
            <ResultCard
              label="✓ Your deductions are within the legal limit"
              value={formatKES(result.netAfterDeductions)}
              sublabel={`You retain ${formatKES(result.netAfterDeductions)}/month, above the required minimum of ${formatKES(result.minimumNet)} (one-third of basic salary).`}
              tone="success"
            />
          ) : (
            <ResultCard
              label="⚠ Your deductions may exceed the legal limit"
              value={formatKES(result.excessDeduction)}
              sublabel={`Your employer cannot legally deduct ${formatKES(result.excessDeduction)} more from your salary this month. Review your SACCO/loan commitments.`}
              tone="danger"
            />
          )}

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="flex justify-between py-1.5 text-sm text-[#4B4238]">
              <span>Statutory deductions (NSSF, SHIF, AHL, PAYE)</span>
              <span>{formatKES(result.statutoryDeductions)}</span>
            </div>
            <div className="flex justify-between py-1.5 text-sm text-[#4B4238]">
              <span>Non-statutory deductions (SACCO + loans)</span>
              <span>{formatKES(result.nonStatutoryDeductions)}</span>
            </div>
            <div className="flex justify-between py-1.5 text-sm font-semibold text-primary">
              <span>Minimum net (1/3 of basic salary)</span>
              <span>{formatKES(result.minimumNet)}</span>
            </div>
          </div>

          <p className="text-xs text-[#4B4238]">
            Based on the Employment Act&apos;s one-third rule for non-statutory deductions. This is
            a simplified guide, not legal advice — consult a labour officer or lawyer for disputes.
          </p>

          <CalculatorDisclaimer />

          <ShareResultButton
            message={`⚖️ *One-Third Rule Check*\n\n${
              result.compliant
                ? `My deductions are within Kenya's legal limit — I retain ${formatKES(result.netAfterDeductions)}/month.`
                : `My deductions may exceed Kenya's legal limit by ${formatKES(result.excessDeduction)}/month.`
            }\n\nCheck yours → jipangefinance.netlify.app/tools/one-third-rule`}
          />
        </div>
      )}
    </div>
  );
}
