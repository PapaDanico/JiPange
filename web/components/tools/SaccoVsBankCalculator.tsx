"use client";

import { positiveAmount, amountOrZero } from "@/lib/money";
import { useMemo } from "react";
import { compareLoanProducts } from "@/lib/loan-comparison";
import { MAX_TERM_MONTHS } from "@/lib/loans";
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

export default function SaccoVsBankCalculator() {
  const [amount, setAmount] = useStickyState("jipange:tool:sacco-vs-bank:amount", "");
  const [termMonths, setTermMonths] = useStickyState(
    "jipange:tool:sacco-vs-bank:termMonths",
    ""
  );

  const results = useMemo(() => {
    const principal = positiveAmount(amount);
    const months = positiveAmount(termMonths);
    if (principal === null || months === null) return null;
    if (!Number.isSafeInteger(months) || months > MAX_TERM_MONTHS) return null;
    return compareLoanProducts(principal, months);
  }, [amount, termMonths]);
  // The same parsed values, for the sentences beside each row.
  const principal = positiveAmount(amount) ?? 0;
  const months = positiveAmount(termMonths) ?? 0;

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
          label="Loan amount needed (Ksh)"
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
          max={MAX_TERM_MONTHS}
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
        <div ref={resultsRef} className="animate-rise space-y-4" aria-live="polite">
          <div className="space-y-3">
            {results.map((product) => (
              <div key={product.name} className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-primary">
                    {product.name}
                    {product.kind === "short" && (
                      <span className="ml-2 rounded-full bg-canvas px-2 py-0.5 text-xs font-normal text-ink-soft">30-day loan</span>
                    )}
                  </p>
                  <p className="text-right text-sm font-semibold text-primary">
                    {formatKES(product.totalCost)}
                    <span className="block text-xs font-normal text-ink-soft">
                      total cost over {product.kind === "short" ? "30 days" : `${months} month${months === 1 ? "" : "s"}`}
                    </span>
                  </p>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-ink-soft">
                  <p>
                    {product.kind === "short" ? "Repay in one go:" : "Monthly payment:"}{" "}
                    <span className="font-medium text-primary">
                      {product.monthlyPayment !== null ? formatKES(product.monthlyPayment) : formatKES(product.totalRepaid)}
                    </span>
                  </p>
                  <p>
                    Effective annual rate:{" "}
                    <span className="font-medium text-primary">{Math.round(product.effectiveAnnualRate * 100)}%</span>
                  </p>
                  {product.cashReceived < principal && (
                    <p className="col-span-2">
                      You receive{" "}
                      <span className="font-medium text-primary">{formatKES(product.cashReceived)}</span>
                      {" "}— part of the cost is taken when the loan is paid out.
                    </p>
                  )}
                </div>
                {product.rolloverFloorCost !== null && (
                  <p className="mt-1 text-xs text-ink-soft">
                    Needed for {months} months? This is not an instalment loan. Rolling it over every 30 days would cost
                    at least <span className="font-medium text-primary">{formatKES(product.rolloverFloorCost)}</span>.
                  </p>
                )}
                <p className="mt-1 text-xs text-ink-soft">{product.basis}</p>
              </div>
            ))}
          </div>

          <p className="text-xs text-ink-soft">
            Total cost is what you pay beyond the cash you receive, the Total Cost of Credit lenders must
            disclose. Every effective annual rate is worked out the same way, compounded, on the cash you
            actually receive, so the rows can be compared. These are illustrative product types, not
            current offers, and they leave out fees only a lender can quote (membership, insurance,
            processing). Fuliza, M-Shwari and app loans are 30-day loans and are shown for 30 days.
          </p>

          <details className="rounded-2xl bg-white p-4 shadow-sm text-sm text-ink-soft">
            <summary className="cursor-pointer font-semibold text-primary">How to join a SACCO</summary>
            <ol className="mt-2 list-decimal space-y-1 pl-5">
              <li>Find a SACCO open to you — many are tied to your employer, profession, or county (e.g. teachers, boda boda riders, matatu saccos).</li>
              <li>Buy a minimum number of shares (often Ksh 1,000–5,000) to become a member.</li>
              <li>Save consistently for a few months — most SACCOs require a savings history before lending, often 3x your savings balance.</li>
              <li>Apply for a loan through the SACCO, usually needing a guarantor from within the SACCO.</li>
            </ol>
          </details>

          <CalculatorDisclaimer payroll={false} />

          <ShareResultButton
            message={`⚖️ *SACCO vs Bank*\n\nFor a ${formatKES(amountOrZero(amount))} loan over ${termMonths} months:\nSACCO: ${formatKES(results[0].totalRepaid)} total\nBank: ${formatKES(results[1].totalRepaid)} total\nDigital lender: ${formatKES(results[2].totalRepaid)} total\n\nCompare yours → jipangefinance.org/tools/sacco-vs-bank`}
          />
        </div>
        <ExportCardButton containerRef={resultsRef} filename="sacco-vs-bank" />
        </>
      )}
    </div>
  );
}
