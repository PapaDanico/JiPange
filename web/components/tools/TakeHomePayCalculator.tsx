"use client";

import { useMemo, useState } from "react";
import { calculateNetPay } from "@/lib/tax";
import { formatKES } from "@/lib/budget";
import CalculatorDisclaimer from "./CalculatorDisclaimer";
import DeductionRow from "./DeductionRow";
import NumberField from "./NumberField";
import ResultCard from "./ResultCard";
import ShareResultButton from "./ShareResultButton";

export default function TakeHomePayCalculator() {
  const [gross, setGross] = useState("");

  const result = useMemo(() => {
    const value = Number(gross);
    if (!value || value <= 0) return null;
    return calculateNetPay(value);
  }, [gross]);

  return (
    <div className="space-y-4">
      <NumberField
        id="gross"
        label="Monthly gross salary (KES)"
        value={gross}
        onChange={setGross}
        placeholder="e.g. 80000"
      />

      {result && (
        <>
          <ResultCard label="Take-home pay" value={formatKES(result.netMonthly)} tone="success" />

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <DeductionRow label="Gross salary" value={formatKES(result.grossMonthly)} bold />
            <DeductionRow label="Less: NSSF Tier 1" value={`(${formatKES(result.nssf.tier1)})`} />
            <DeductionRow label="Less: NSSF Tier 2" value={`(${formatKES(result.nssf.tier2)})`} />
            <DeductionRow label="Less: SHIF (2.75%)" value={`(${formatKES(result.shif)})`} />
            <DeductionRow label="Less: Housing Levy (AHL)" value={`(${formatKES(result.ahl)})`} />
            <hr className="my-2 border-[#E5E0D8]" />
            <DeductionRow label="Taxable pay" value={formatKES(result.taxablePay)} bold />
            <DeductionRow label="PAYE (before relief)" value={`(${formatKES(result.grossPaye)})`} />
            <DeductionRow label="Less: Personal relief" value={formatKES(result.personalRelief)} />
            <DeductionRow label="Net PAYE" value={`(${formatKES(result.paye)})`} />
            <hr className="my-2 border-[#E5E0D8]" />
            <DeductionRow label="Net take-home pay" value={formatKES(result.netMonthly)} bold />
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-primary">Employer also pays</p>
            <DeductionRow label="NSSF match" value={formatKES(result.employerCost.nssf)} />
            <DeductionRow label="Housing Levy match" value={formatKES(result.employerCost.ahl)} />
            <hr className="my-2 border-[#E5E0D8]" />
            <DeductionRow
              label="Your total cost to employer"
              value={formatKES(result.employerCost.total)}
              bold
            />
          </div>

          <div className="rounded-2xl bg-[#F1ECE3] p-6">
            <p className="text-sm text-[#4B4238]">
              You take home <strong>{formatKES(result.netMonthly)}</strong> of your{" "}
              <strong>{formatKES(result.grossMonthly)}</strong> gross salary (
              {Math.round((result.netMonthly / result.grossMonthly) * 100)}%). Your employer
              actually pays <strong>{formatKES(result.employerCost.total)}</strong> total to keep
              you employed. Statutory deductions and tax take{" "}
              <strong>
                {formatKES(result.grossMonthly - result.netMonthly)}
              </strong>{" "}
              ({Math.round(((result.grossMonthly - result.netMonthly) / result.grossMonthly) * 100)}% of
              your gross).
            </p>
          </div>

          <CalculatorDisclaimer />

          <ShareResultButton
            message={`🇰🇪 *My Take-Home Pay*\n\nGross salary: ${formatKES(Number(gross))}\nTake-home pay: ${formatKES(result.netMonthly)}/month\n\nCalculate yours → jipangefinance.netlify.app/tools/take-home-pay`}
          />
        </>
      )}
    </div>
  );
}
