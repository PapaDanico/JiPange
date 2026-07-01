"use client";

import { useMemo, useState } from "react";
import { calculateNetPay } from "@/lib/tax";
import { formatKES } from "@/lib/budget";
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
          <div className="grid grid-cols-2 gap-3">
            <ResultCard label="PAYE" value={formatKES(result.paye)} />
            <ResultCard label="NSSF" value={formatKES(result.nssf.total)} />
            <ResultCard label="SHIF" value={formatKES(result.shif)} />
            <ResultCard label="Personal relief" value={formatKES(result.personalRelief)} />
          </div>
          <p className="text-xs text-[#4B4238]">
            Figures are estimates based on KRA 2025/26 PAYE bands. Check your payslip for exact
            deductions.
          </p>
          <ShareResultButton
            message={`🇰🇪 *My Take-Home Pay*\n\nGross salary: ${formatKES(Number(gross))}\nTake-home pay: ${formatKES(result.netMonthly)}/month\n\nCalculate yours → jipangefinance.netlify.app/tools/take-home-pay`}
          />
        </>
      )}
    </div>
  );
}
