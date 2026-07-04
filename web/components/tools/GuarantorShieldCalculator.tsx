"use client";

import { useState } from "react";
import { SACCO_LEVERAGE_MULTIPLIER } from "@/lib/market-2026";
import { formatKES } from "@/lib/budget";
import CalculatorDisclaimer from "./CalculatorDisclaimer";
import NumberField from "./NumberField";
import ResultCard from "./ResultCard";
import ShareResultButton from "./ShareResultButton";

/** Off-balance-sheet guarantorship: how much of your 3× Sacco leverage is actually free. */
export default function GuarantorShieldCalculator() {
  const [deposits, setDeposits] = useState("");
  const [loans, setLoans] = useState("0");
  const [guaranteed, setGuaranteed] = useState("0");

  const d = Number(deposits) || 0;
  const l = Math.max(0, Number(loans) || 0);
  const g = Math.max(0, Number(guaranteed) || 0);
  const gross = d * SACCO_LEVERAGE_MULTIPLIER;
  const available = Math.max(0, Math.max(0, d - g) * SACCO_LEVERAGE_MULTIPLIER - l);
  const frozen = Math.max(0, gross - (available + l));
  const ratio = d > 0 ? Math.min(1, g / d) : 0;

  return (
    <div className="space-y-4">
      <NumberField id="shieldDeposits" label="Total Sacco deposits (KES)" value={deposits} onChange={setDeposits} placeholder="e.g. 500000" />
      <NumberField id="shieldLoans" label="Your active Sacco loans (KES)" value={loans} onChange={setLoans} placeholder="0" />
      <NumberField id="shieldGuaranteed" label="Total amount guaranteed for others (KES)" value={guaranteed} onChange={setGuaranteed} placeholder="0" />

      {d > 0 && (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ResultCard label="True unencumbered borrowing power" value={formatKES(available)} tone="success" />
            <ResultCard label="Frozen borrowing capacity" value={formatKES(frozen)} sublabel={`of your ${SACCO_LEVERAGE_MULTIPLIER}× gross ${formatKES(gross)}`} tone={frozen > 0 ? "danger" : undefined} />
          </div>
          {ratio > 0.5 ? (
            <p data-testid="guarantor-status" className="rounded-2xl border-2 border-danger bg-[#FBEAEA] p-4 text-sm text-[#4B4238]">
              ❌ <strong className="text-danger">Status: Serious Credit Lockout.</strong> Over 50% of
              your deposits are backing other people&apos;s loans — apply for a development loan
              tomorrow and your allocation gets slashed. <strong>Action:</strong> ask the primary
              borrowers to execute a <em>guarantor substitution</em> to release your capacity.
            </p>
          ) : (
            <p data-testid="guarantor-status" className="rounded-2xl bg-[#E9F5EC] p-4 text-sm text-[#2b4a2b]">
              ✓ <strong>Status: Safe Credit Buffer.</strong> Your guarantorship liability is
              contained — you retain clean leverage for plot, construction, or asset financing.
            </p>
          )}
          <CalculatorDisclaimer extraNotes={["Multipliers and guarantor rules vary by Sacco — confirm yours before committing."]} />
          <ShareResultButton message={`🎯 *My Sacco Guarantor Shield*\n\nFree borrowing power: ${formatKES(available)}\nFrozen by guarantees: ${formatKES(frozen)}\n\nCheck yours → jipangefinance.netlify.app/tools/guarantor-shield`} />
        </>
      )}
    </div>
  );
}
