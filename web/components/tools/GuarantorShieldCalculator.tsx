"use client";

import { SACCO_LEVERAGE_MULTIPLIER } from "@/lib/market-2026";
import { formatKES } from "@/lib/budget";
import { useStickyState, useScrollIntoView } from "@/lib/hooks";
import BehavioralInsightStrip from "./BehavioralInsightStrip";
import CalculatorDisclaimer from "./CalculatorDisclaimer";
import ExportCardButton from "./ExportCardButton";
import HowItWorks from "./HowItWorks";
import NumberField from "./NumberField";
import ResetLink from "./ResetLink";
import ResultCard from "./ResultCard";
import ShareResultButton from "./ShareResultButton";

/** Off-balance-sheet guarantorship: how much of your 3× Sacco leverage is actually free. */
export default function GuarantorShieldCalculator() {
  const [deposits, setDeposits] = useStickyState(
    "jipange:tool:guarantor-shield:deposits",
    ""
  );
  const [loans, setLoans] = useStickyState("jipange:tool:guarantor-shield:loans", "0");
  const [guaranteed, setGuaranteed] = useStickyState(
    "jipange:tool:guarantor-shield:guaranteed",
    "0"
  );

  const d = Number(deposits) || 0;
  const l = Math.max(0, Number(loans) || 0);
  const g = Math.max(0, Number(guaranteed) || 0);
  const gross = d * SACCO_LEVERAGE_MULTIPLIER;
  const available = Math.max(0, Math.max(0, d - g) * SACCO_LEVERAGE_MULTIPLIER - l);
  const frozen = Math.max(0, gross - (available + l));
  const ratio = d > 0 ? Math.min(1, g / d) : 0;

  const resultsRef = useScrollIntoView<HTMLDivElement>(d > 0);

  const isDirty = deposits !== "" || loans !== "0" || guaranteed !== "0";

  function handleReset() {
    setDeposits("");
    setLoans("0");
    setGuaranteed("0");
  }

  return (
    <div className="space-y-4">
      <NumberField id="shieldDeposits" label="Total Sacco deposits (KES)" value={deposits} onChange={setDeposits} placeholder="e.g. 500000" />
      <NumberField id="shieldLoans" label="Your active Sacco loans (KES)" value={loans} onChange={setLoans} placeholder="0" />
      <NumberField id="shieldGuaranteed" label="Total amount guaranteed for others (KES)" value={guaranteed} onChange={setGuaranteed} placeholder="0" />
      <ResetLink show={isDirty} onReset={handleReset} />

      {d > 0 && (
        <>
        <div ref={resultsRef} className="space-y-4" aria-live="polite">
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
          <BehavioralInsightStrip
            insight="Optimism bias makes us systematically underestimate the chance that people close to us will default. Research shows we treat signing as guarantor as a social act — not a financial one — yet the Sacco reads your deposits as collateral the same way it reads theirs. The frozen capacity above is not hypothetical: it is real money you cannot touch until a substitution is filed."
          />
          <CalculatorDisclaimer extraNotes={["Multipliers and guarantor rules vary by Sacco — confirm yours before committing."]} />
          <ShareResultButton message={`🎯 *My Sacco Guarantor Shield*\n\nFree borrowing power: ${formatKES(available)}\nFrozen by guarantees: ${formatKES(frozen)}\n\nCheck yours → jipangefinance.org/tools/guarantor-shield`} />
        </div>
        <ExportCardButton containerRef={resultsRef} filename="guarantor-shield" />
        </>
      )}
      <HowItWorks
        steps={[
          "Enter your total Sacco deposits, your own active loans, and everything you've signed as guarantor.",
          "Guaranteed amounts freeze the matching deposits — they can't back your own borrowing until released.",
          "Your true power = (free deposits × 3) minus current loans; the frozen figure is leverage locked away.",
          "Above 50% exposure, request guarantor substitutions from the borrowers before applying for a big loan.",
        ]}
      />
    </div>
  );
}
