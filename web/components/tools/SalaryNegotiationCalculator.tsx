"use client";

import { useMemo, useState } from "react";
import { solveGrossForTargetNet } from "@/lib/salary-negotiation";
import { calculateNetPay } from "@/lib/tax";
import { formatKES } from "@/lib/budget";
import CalculatorDisclaimer from "./CalculatorDisclaimer";
import DeductionRow from "./DeductionRow";
import NumberField from "./NumberField";
import ResultCard from "./ResultCard";
import ShareResultButton from "./ShareResultButton";

const NEGOTIATION_BUFFER = 5_000;

export default function SalaryNegotiationCalculator() {
  const [targetNet, setTargetNet] = useState("");

  const result = useMemo(() => {
    const target = Number(targetNet);
    if (!target || target <= 0) return null;

    const gross = solveGrossForTargetNet(target);
    const breakdown = calculateNetPay(gross);
    const grossWithBuffer = gross + NEGOTIATION_BUFFER;

    return { target, gross, breakdown, grossWithBuffer };
  }, [targetNet]);

  return (
    <div className="space-y-4">
      <NumberField
        id="targetNet"
        label="Target take-home pay (KES/month)"
        value={targetNet}
        onChange={setTargetNet}
        placeholder="e.g. 100000"
      />

      {result && (
        <>
          <ResultCard
            label="Negotiate for a gross salary of"
            value={formatKES(result.gross)}
            sublabel={`Add a buffer and ask for ${formatKES(result.grossWithBuffer)} to account for employer negotiation.`}
            tone="success"
          />

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <DeductionRow label="Gross salary" value={formatKES(result.breakdown.grossMonthly)} bold />
            <DeductionRow label="Less: NSSF Tier 1" value={`(${formatKES(result.breakdown.nssf.tier1)})`} />
            <DeductionRow label="Less: NSSF Tier 2" value={`(${formatKES(result.breakdown.nssf.tier2)})`} />
            <DeductionRow label="Less: SHIF (2.75%)" value={`(${formatKES(result.breakdown.shif)})`} />
            <DeductionRow label="Less: Housing Levy (AHL)" value={`(${formatKES(result.breakdown.ahl)})`} />
            <DeductionRow label="Less: Net PAYE" value={`(${formatKES(result.breakdown.paye)})`} />
            <hr className="my-2 border-[#E5E0D8]" />
            <DeductionRow label="Net take-home pay" value={formatKES(result.breakdown.netMonthly)} bold />
          </div>

          <CalculatorDisclaimer />

          <ShareResultButton
            message={`💼 *Salary Negotiation*\n\nTo take home ${formatKES(result.target)}/month, I need to negotiate a gross salary of ${formatKES(result.gross)}.\n\nCalculate yours → jipangefinance.netlify.app/tools/salary-negotiation`}
          />
        </>
      )}
    </div>
  );
}
