"use client";

import { useMemo } from "react";
import { compareLoanProducts, type LoanProductTier } from "@/lib/loan-comparison";
import { formatKES } from "@/lib/budget";
import { useStickyState, useScrollIntoView } from "@/lib/hooks";
import CalculatorDisclaimer from "./CalculatorDisclaimer";
import ExportCardButton from "./ExportCardButton";
import NumberField from "./NumberField";
import ResetLink from "./ResetLink";
import QuickFillChips from "./QuickFillChips";
import ShareResultButton from "./ShareResultButton";

const AMOUNT_CHIPS = [
  { label: "50K", value: "50000" },
  { label: "100K", value: "100000" },
  { label: "200K", value: "200000" },
  { label: "500K", value: "500000" },
  { label: "1M", value: "1000000" },
];

const TERM_CHIPS = [
  { label: "12 mo", value: "12" },
  { label: "24 mo", value: "24" },
  { label: "36 mo", value: "36" },
  { label: "48 mo", value: "48" },
];

const TIER_CLASS: Record<LoanProductTier, string> = {
  green: "text-success",
  amber: "text-warning",
  red: "text-danger",
};

export default function SaccoVsBankCalculator() {
  const [amount, setAmount] = useStickyState("jipange:tool:sacco-vs-bank:amount", "");
  const [termMonths, setTermMonths] = useStickyState(
    "jipange:tool:sacco-vs-bank:termMonths",
    ""
  );

  const results = useMemo(() => {
    const principal = Number(amount);
    const months = Number(termMonths);
    if (!principal || principal <= 0 || !months || months <= 0) return null;
    return compareLoanProducts(principal, months);
  }, [amount, termMonths]);

  const resultsRef = useScrollIntoView<HTMLDivElement>(results !== null);

  const isDirty = amount !== "" || termMonths !== "";

  function handleReset() {
    setAmount("");
    setTermMonths("");
  }

  return (
    <div className="space-y-4">
      <div>
        <NumberField
          id="amount"
          label="Loan amount needed (KES)"
          value={amount}
          onChange={setAmount}
          placeholder="e.g. 100000"
        />
        <QuickFillChips
          label="Quick fill:"
          options={AMOUNT_CHIPS}
          onSelect={setAmount}
          current={amount}
        />
      </div>
      <div>
        <NumberField
          id="termMonths"
          label="Repayment period (months)"
          value={termMonths}
          onChange={setTermMonths}
          placeholder="e.g. 12"
        />
        <QuickFillChips
          label="Quick fill:"
          options={TERM_CHIPS}
          onSelect={setTermMonths}
          current={termMonths}
        />
      </div>
      <ResetLink show={isDirty} onReset={handleReset} />

      {results && (
        <>
        <div ref={resultsRef} className="space-y-4" aria-live="polite">
          <div className="space-y-3">
            {results.map((product) => (
              <div key={product.name} className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-primary">{product.name}</p>
                  <p className={`text-sm font-semibold ${TIER_CLASS[product.tier]}`}>
                    ~{Math.round(product.apr * 100)}% APR
                  </p>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-[#4B4238]">
                  <p>
                    Monthly payment:{" "}
                    <span className="font-medium text-primary">
                      {product.monthlyPayment !== null ? formatKES(product.monthlyPayment) : "N/A"}
                    </span>
                  </p>
                  <p>
                    Total repaid:{" "}
                    <span className="font-medium text-primary">{formatKES(product.totalRepaid)}</span>
                  </p>
                </div>
                {product.estimated && (
                  <p className="mt-1 text-xs text-[#4B4238]">Estimated — check app for current rate.</p>
                )}
              </div>
            ))}
          </div>

          <p className="text-xs text-[#4B4238]">
            Fuliza and M-Shwari are emergency tools, not personal finance tools — their rows above
            are scaled to the same term for comparison only and will cost far more than shown if
            repeatedly rolled over.
          </p>

          <details className="rounded-2xl bg-white p-4 shadow-sm text-sm text-[#4B4238]">
            <summary className="cursor-pointer font-semibold text-primary">How to join a SACCO</summary>
            <ol className="mt-2 list-decimal space-y-1 pl-5">
              <li>Find a SACCO open to you — many are tied to your employer, profession, or county (e.g. teachers, boda boda riders, matatu saccos).</li>
              <li>Buy a minimum number of shares (often KES 1,000–5,000) to become a member.</li>
              <li>Save consistently for a few months — most SACCOs require a savings history before lending, often 3x your savings balance.</li>
              <li>Apply for a loan through the SACCO, usually needing a guarantor from within the SACCO.</li>
            </ol>
          </details>

          <CalculatorDisclaimer />

          <ShareResultButton
            message={`⚖️ *SACCO vs Bank*\n\nFor a ${formatKES(Number(amount))} loan over ${termMonths} months:\nSACCO: ${formatKES(results[0].totalRepaid)} total\nBank: ${formatKES(results[1].totalRepaid)} total\nDigital lender: ${formatKES(results[2].totalRepaid)} total\n\nCompare yours → jipangefinance.org/tools/sacco-vs-bank`}
          />
        </div>
        <ExportCardButton containerRef={resultsRef} filename="sacco-vs-bank" />
        </>
      )}
    </div>
  );
}
