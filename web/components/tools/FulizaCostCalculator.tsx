"use client";

import { useMemo } from "react";
import { calculateFulizaCost } from "@/lib/fuliza";
import { formatKES } from "@/lib/budget";
import { useStickyState, useScrollIntoView } from "@/lib/hooks";
import BehavioralInsightStrip from "./BehavioralInsightStrip";
import CalculatorDisclaimer from "./CalculatorDisclaimer";
import ExportCardButton from "./ExportCardButton";
import NumberField from "./NumberField";
import ResetLink from "./ResetLink";
import ProductLinks from "./ProductLinks";
import ResultCard from "./ResultCard";
import ShareResultButton from "./ShareResultButton";
import { MMF_LINKS } from "@/lib/affiliate-links";

export default function FulizaCostCalculator() {
  const [amount, setAmount] = useStickyState("jipange:tool:fuliza-cost:amount", "");
  const [days, setDays] = useStickyState("jipange:tool:fuliza-cost:days", "");

  const result = useMemo(() => {
    const principal = Number(amount);
    const daysValue = Number(days);
    if (!principal || principal <= 0 || !daysValue || daysValue <= 0) return null;
    return calculateFulizaCost(principal, daysValue);
  }, [amount, days]);

  const resultsRef = useScrollIntoView<HTMLDivElement>(result !== null);

  const isDirty = amount !== "" || days !== "";

  function handleReset() {
    setAmount("");
    setDays("");
  }

  return (
    <div className="space-y-4">
      <NumberField
        id="amount"
        label="Amount borrowed (Ksh)"
        value={amount}
        onChange={setAmount}
        placeholder="e.g. 5000"
      />
      <NumberField
        id="days"
        label="Days until you repay"
        value={days}
        onChange={setDays}
        placeholder="e.g. 7"
      />
      <ResetLink show={isDirty} onReset={handleReset} />

      {result && (
        <>
          <div ref={resultsRef} className="animate-rise space-y-4" aria-live="polite">
            <ResultCard
              label="Total cost of borrowing"
              value={formatKES(result.totalFee)}
              sublabel={`Borrowing ${formatKES(Number(amount))} for ${days} days costs ${formatKES(result.totalFee)} — equivalent to roughly ${Math.round(result.annualisedApr)}% APR.`}
              tone="danger"
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ResultCard label="Daily fee" value={formatKES(result.dailyFee)} />
              <ResultCard label="Total repaid" value={formatKES(result.totalRepaid)} />
              <ResultCard label="Cost as % of principal" value={`${result.percentOfPrincipal}%`} />
              <ResultCard
                label="Same amount, 30-day SACCO loan"
                value={formatKES(result.saccoComparisonTotalRepaid)}
                tone="success"
              />
            </div>
            <ResultCard
              label="If you borrow like this 12 times this year"
              value={formatKES(result.totalFee * 12)}
              sublabel={`${Math.round((result.totalFee * 12 / Number(amount)) * 100)}% of your ${formatKES(Number(amount))} borrowing need — just in fees. Build an emergency float in an MMF and you'll never pay this again.`}
              tone="danger"
            />
            <p className="text-xs text-ink-soft">
              Fuliza and similar overdraft products are emergency tools, not personal finance tools —
              rates change periodically, so verify the current rate in your M-PESA app before
              relying on this figure.
            </p>

            <BehavioralInsightStrip
              insight="Each Fuliza fee feels small in isolation — that's the marginal cost trap. Behavioural economists call it the 'pennies-a-day' illusion: we evaluate each transaction individually and never sum the true annual toll. The APR figure above converts that illusion into a single number your brain can actually weigh."
            />
            <div className="rounded-2xl border border-border bg-danger-soft/40 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-danger">
                And if you never clear it
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">
                The {Math.round(result.annualisedApr)}% above is the APR — the daily fee
                annualised, which is what the facility contractually costs. Roll the balance for a
                whole year without clearing it and the fees keep landing on a balance that never
                shrinks: the compounded cost reaches roughly{" "}
                <strong>{result.annualisedApr.toLocaleString("en-KE")}%</strong>.
                That is not the advertised rate — it is what a permanent overdraft actually does.
              </p>
            </div>

            <CalculatorDisclaimer />

            <ShareResultButton
              message={`📱 *True Cost of Fuliza*\n\nBorrowing ${formatKES(Number(amount))} for ${days} days costs ${formatKES(result.totalFee)} in fees.\nThat's about ${Math.round(result.annualisedApr)}% APR.\n\nCalculate yours → jipangefinance.org/tools/fuliza-cost`}
            />
          </div>
          <ExportCardButton
            containerRef={resultsRef}
            filename="fuliza-cost"
            title="The True Cost of Fuliza"
            assumptions={[
              { label: "Amount borrowed", value: formatKES(Number(amount) || 0) },
              { label: "Days carried", value: `${days} days` },
              { label: "Chargeable days", value: `${result?.chargeableDays ?? 0}` },
              { label: "Daily fee", value: formatKES(result?.dailyFee ?? 0) },
            ]}
            notes={[
              "Priced on Safaricom's published Fuliza tariff: a flat daily maintenance fee set by balance band, a one-off 1% access fee, and 20% excise duty on both. Balances of Ksh 1,000 or less carry three free days.",
              "The APR annualises the daily maintenance fee only. The access fee is a one-off, and annualising it would make a one-day borrowing look like a far more expensive product than it is.",
            ]}
          />
          <ProductLinks products={MMF_LINKS.slice(0, 2)} heading="Build an emergency float in an MMF instead" />
        </>
      )}
    </div>
  );
}
