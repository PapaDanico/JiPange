"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { calculateDebtStack, compareStrategies, effectiveAprPct, monthlyRateOrNull, PRESET_LENDERS, type DebtStrategy } from "@/lib/debt";
import { assumedMmfYieldPct } from "@/lib/mmf-assumption";
import { formatKES } from "@/lib/budget";
import { amountOrZero, positiveAmount } from "@/lib/money";
import { useStickyState, useScrollIntoView } from "@/lib/hooks";
import BehavioralInsightStrip from "./BehavioralInsightStrip";
import CalculatorDisclaimer from "./CalculatorDisclaimer";
import ExportCardButton from "./ExportCardButton";
import NumberField from "./NumberField";
import ResetLink from "./ResetLink";
import ResultCard from "./ResultCard";
import ShareResultButton from "./ShareResultButton";

const STRATEGY_LABEL: Record<DebtStrategy, string> = {
  avalanche: "Highest rate first",
  snowball: "Smallest balance first",
  relief: "Biggest monthly interest first",
};

const DebtPayoffChart = dynamic(() => import("./DebtPayoffChart"), { ssr: false });

interface LoanDraft {
  id: string;
  name: string;
  balance: string;
  rate: string;
  /** Optional one-off charge to close this loan. */
  fee?: string;
}

function emptyLoan(id: string): LoanDraft {
  return { id, name: "", balance: "", rate: "" };
}

export default function DebtEscapeCalculator() {
  const nextIdRef = useRef(3);
  const [loans, setLoans] = useState<LoanDraft[]>(() => [
    { id: "1", name: "Fuliza M-PESA", balance: "", rate: "32" },
    { id: "2", name: "Tala", balance: "", rate: "13" },
  ]);
  const [budget, setBudget] = useStickyState("jipange:tool:debt-escape:budget", "");

  // A loan with an entered balance must never disappear from the payoff plan
  // just because its rate or settlement fee is invalid.
  const invalidLoan = loans.some((loan) => {
    if (loan.balance.trim() === "") return false;
    const fee = loan.fee ?? "";
    return positiveAmount(loan.balance) === null ||
      monthlyRateOrNull(loan.rate) === null ||
      (fee.trim() !== "" && (Number(fee) < 0 || !Number.isFinite(Number(fee)) ||
        amountOrZero(fee) !== Number(fee)));
  });

  const loanInputs = useMemo(
    () =>
      loans
        .filter((l) => positiveAmount(l.balance) !== null && monthlyRateOrNull(l.rate) !== null)
        .map((l) => ({
          id: l.id,
          name: l.name || l.id,
          balance: amountOrZero(l.balance),
          monthlyRatePct: monthlyRateOrNull(l.rate) ?? 0,
          settlementFee: amountOrZero(l.fee ?? ""),
        })),
    [loans]
  );

  const result = useMemo(
    () => invalidLoan ? null : calculateDebtStack(loanInputs, amountOrZero(budget)),
    [loanInputs, budget, invalidLoan]
  );

  const interestThreshold = useMemo(
    () => loanInputs.reduce((s, l) => s + l.balance * (l.monthlyRatePct / 100), 0),
    [loanInputs]
  );

  const hasInput = positiveAmount(budget) !== null && loanInputs.length > 0;
  const tooLow = !invalidLoan && hasInput && amountOrZero(budget) <= interestThreshold;
  const comparison = useMemo(() => invalidLoan ? [] : compareStrategies(loanInputs, amountOrZero(budget)), [loanInputs, budget, invalidLoan]);
  const horizonExceeded = !invalidLoan && hasInput && !tooLow && result === null;

  const resultsRef = useScrollIntoView<HTMLDivElement>(result !== null);

  const setLoanField = useCallback(
    (id: string, field: keyof LoanDraft, value: string) => {
      setLoans((prev) => prev.map((l) => (l.id === id ? { ...l, [field]: value } : l)));
    },
    []
  );

  const setLoanName = useCallback(
    (id: string, name: string) => {
      const preset = PRESET_LENDERS.find((p) => p.name === name);
      setLoans((prev) =>
        prev.map((l) =>
          l.id === id
            ? { ...l, name, rate: preset ? String(preset.monthlyRatePct) : l.rate }
            : l
        )
      );
    },
    []
  );

  function addLoan() {
    if (loans.length >= 5) return;
    setLoans((prev) => [...prev, emptyLoan(String(nextIdRef.current++))]);
  }

  function removeLoan(id: string) {
    setLoans((prev) => prev.filter((l) => l.id !== id));
  }

  const anyFilled = loans.some((l) => l.balance !== "") || budget !== "";

  function handleReset() {
    setLoans([
      { id: "1", name: "Fuliza M-PESA", balance: "", rate: "32" },
      { id: "2", name: "Tala", balance: "", rate: "13" },
    ]);
    setBudget("");
  }

  return (
    <div className="space-y-5">
      {/* Loans */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-ink-soft">Your active mobile loans</p>
        {loans.map((loan, i) => (
          <div
            key={loan.id}
            className="rounded-xl border border-border bg-white p-3.5 space-y-3"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-primary">Loan {i + 1}</span>
              {loans.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeLoan(loan.id)}
                  aria-label="Remove this loan"
                  className="inline-flex min-h-11 items-center text-xs text-muted hover:text-danger underline underline-offset-2"
                >
                  Remove
                </button>
              )}
            </div>

            {/* Lender name with preset datalist */}
            <div>
              <label
                htmlFor={`lender-${loan.id}`}
                className="block text-sm font-medium text-ink-soft"
              >
                Lender
              </label>
              <input
                id={`lender-${loan.id}`}
                type="text"
                list={`presets-${loan.id}`}
                value={loan.name}
                onChange={(e) => setLoanName(loan.id, e.target.value)}
                placeholder="e.g. Fuliza M-PESA"
                className="mt-1 h-12 w-full rounded-lg border border-border bg-white px-4 text-base focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <datalist id={`presets-${loan.id}`}>
                {PRESET_LENDERS.map((p) => (
                  <option key={p.name} value={p.name} />
                ))}
              </datalist>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <NumberField
                id={`balance-${loan.id}`}
                label="Outstanding balance (Ksh)"
                value={loan.balance}
                onChange={(v) => setLoanField(loan.id, "balance", v)}
                placeholder="e.g. 5000"
                min={1}
              />
              <NumberField
                id={`rate-${loan.id}`}
                label="Monthly rate (%)"
                value={loan.rate}
                onChange={(v) => setLoanField(loan.id, "rate", v)}
                placeholder="e.g. 13"
                suffix="%"
                min={0.1}
              />
            </div>
            <NumberField
              id={`fee-${loan.id}`}
              label="Fee to close this loan early (Ksh), if the lender charges one"
              value={loan.fee ?? ""}
              onChange={(v) => setLoanField(loan.id, "fee", v)}
              placeholder="optional"
              min={0}
            />
            {(monthlyRateOrNull(loan.rate) ?? 0) > 0 && (
              <p className="text-xs text-faint">
                ≈ {Math.round(effectiveAprPct(monthlyRateOrNull(loan.rate) ?? 0)).toLocaleString("en-KE")}% effective APR — verify the current rate in
                your lender&apos;s app.
              </p>
            )}
          </div>
        ))}

        {loans.length < 5 && (
          <button
            type="button"
            onClick={addLoan}
            className="flex min-h-11 items-center gap-1.5 text-sm font-medium text-primary underline underline-offset-2 hover:text-ink-soft"
          >
            + Add another loan
          </button>
        )}
      </div>

      {/* Monthly repayment budget */}
      <NumberField
        id="budget"
        label="Monthly amount you can put toward debt repayment (Ksh)"
        value={budget}
        onChange={setBudget}
        placeholder="e.g. 8000"
        min={1}
      />

      {invalidLoan && (
        <div role="alert" className="rounded-xl border border-danger bg-[#FDECEA] p-3 text-sm text-danger">
          Check every entered loan: balances must be positive, monthly rates valid,
          and settlement fees non-negative. No debt has been excluded from the estimate.
        </div>
      )}

      {tooLow && (
        <div className="rounded-xl border border-danger bg-[#FDECEA] p-3 text-sm text-danger">
          Your monthly budget is less than the total interest accruing — the debt is
          growing faster than you can pay. Try increasing the monthly budget above{" "}
          <strong>{formatKES(interestThreshold)}</strong>.
        </div>
      )}

      {horizonExceeded && (
        <div className="rounded-xl border border-warning bg-accent-wash p-3 text-sm text-[#6B3A0A]">
          At this budget, clearing all loans would take more than 10 years. Try increasing
          your monthly repayment or reducing the outstanding balances first.
        </div>
      )}

      <ResetLink show={anyFilled} onReset={handleReset} />

      {result && (
        <div ref={resultsRef} className="animate-rise space-y-4" aria-live="polite">
          {/* Hero result */}
          <ResultCard headline
            label="Debt-free by"
            value={result.debtFreeLabel}
            sublabel={`${result.monthsToDebtFree} months from now, paying ${formatKES(amountOrZero(budget))}/month in total.`}
            tone="success"
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ResultCard
              label="Total debt today"
              value={formatKES(result.totalBalance)}
              tone="danger"
            />
            <ResultCard
              label="Monthly interest (current)"
              value={formatKES(result.totalMonthlyInterest)}
              sublabel="What you're paying just to stay in place"
              tone="danger"
            />
            <ResultCard
              label="Total interest you'll pay (avalanche plan)"
              value={formatKES(result.totalInterestPaid)}
            />
            {result.totalFeesPaid > 0 && (
              <ResultCard
                label="Closing fees included in the plan"
                value={formatKES(result.totalFeesPaid)}
              />
            )}
            {result.interestSavedVsMinOnly > 0 && (
              <ResultCard
                label="Interest saved vs minimum-only payments (same period)"
                value={formatKES(result.interestSavedVsMinOnly)}
                tone="success"
              />
            )}
          </div>

          {/* Payoff order */}
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-primary">
              Avalanche payoff order (highest rate first)
            </p>
            <p className="mt-0.5 text-xs text-faint">
              Pay minimums on all loans. Pour every spare shilling into Loan #1 until
              it&apos;s gone, then roll that payment to Loan #2.
            </p>
            <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-accent-wash px-2.5 py-1 text-xs font-medium text-accent-ink">
              💡 Ranked by effective cost — your priciest debt (often Fuliza) clears first, saving
              the most interest
            </span>
            <div className="mt-3 space-y-2">
              {result.loans.map((loan) => (
                <div
                  key={loan.id}
                  className="flex items-center gap-3 rounded-lg border border-border p-2.5"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                    {loan.avalancheRank}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-primary truncate">{loan.name}</p>
                    <p className="text-xs text-faint">
                      {formatKES(loan.originalBalance)} @ {loan.monthlyRatePct}%/month
                      {" · "}cleared month {loan.clearedAtMonth}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs font-semibold text-danger">
                      {loan.aprPct}% APR
                    </p>
                    <p className="text-xs text-faint">
                      {formatKES(loan.totalInterestPaid)} total interest
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DebtPayoffChart timeline={result.timeline} totalBalance={result.totalBalance} />

          {comparison.length > 1 && (
            <details className="rounded-2xl border border-line bg-surface px-4">
              <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold text-ink">
                Compare ways to order your payments
              </summary>
              <div className="pb-4">
                <p className="text-xs leading-relaxed text-ink-soft">
                  Same loans, same monthly budget; only the loan that gets the spare money first changes. Your plan above uses the
                  highest rate first.
                </p>
                <div className="mt-2 overflow-x-auto">
                  <table className="w-full text-sm">
                    <caption className="sr-only">Debt payoff strategies on the same budget</caption>
                    <thead>
                      <tr className="border-b border-line text-left text-xs text-ink-soft">
                        <th scope="col" className="py-2">Order</th>
                        <th scope="col" className="py-2 text-right">Debt-free in</th>
                        <th scope="col" className="py-2 text-right">Total interest</th>
                        <th scope="col" className="py-2 text-right">First loan cleared</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparison.map((c) => {
                        const first = Math.min(...c.result.loans.map((l) => l.clearedAtMonth).filter((m) => m > 0));
                        return (
                          <tr key={c.strategy} className="border-b border-line last:border-0">
                            <th scope="row" className="py-1.5 text-left font-medium text-ink">{STRATEGY_LABEL[c.strategy]}</th>
                            <td className="py-1.5 text-right tabular-nums">
                              {c.result.monthsToDebtFree} months{c.extraMonthsVsBest > 0 ? ` (+${c.extraMonthsVsBest})` : ""}
                            </td>
                            <td className="py-1.5 text-right tabular-nums">
                              {formatKES(c.result.totalInterestPaid)}{c.extraInterestVsBest > 0 ? ` (+${formatKES(c.extraInterestVsBest)})` : ""}
                            </td>
                            <td className="py-1.5 text-right tabular-nums">{Number.isFinite(first) ? `month ${first}` : "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-ink-soft">
                  Highest rate costs least. Smallest balance first clears a loan sooner, which some people find easier to stick with.
                  Biggest monthly interest first frees the most cash each month. Pick the one you will actually follow, but note what it costs.
                </p>
              </div>
            </details>
          )}

          <BehavioralInsightStrip
            insight="Move your avalanche payment the day your salary lands — most Kenyan payroll cycles pay out around the 25th–28th. Routing it within 24 hours of payday, before it blends into M-Pesa spending, is what actually makes this plan stick."
          />

          {result.mmfValue12m > 0 && (
            <BehavioralInsightStrip
              insight={`Once debt-free, redirect ${formatKES(amountOrZero(budget))}/month into a Money Market Fund. At an assumed ${assumedMmfYieldPct()}% a year (our working assumption for a money market fund, not a quoted or guaranteed rate), that grows to ${formatKES(result.mmfValue12m)} in 12 months — the same money that was disappearing in interest fees.`}
            />
          )}

          <ShareResultButton
            message={`💸 *My Debt Escape Plan*\n\nTotal debt: ${formatKES(result.totalBalance)}\nMonthly payment: ${formatKES(amountOrZero(budget))}\nDebt-free: ${result.debtFreeLabel} (${result.monthsToDebtFree} months)\nTotal interest: ${formatKES(result.totalInterestPaid)}\n\nPlan yours → jipangefinance.org/tools/debt-escape`}
          />

          <CalculatorDisclaimer payroll={false}
            extraNotes={[
              "Monthly rates shown are approximate — lenders change rates frequently. Always verify the current rate in your lender's app before relying on this figure.",
              "Highest rate first minimises total interest. The comparison above shows what the other orders cost on your own numbers.",
            ]}
          />
          <ExportCardButton containerRef={resultsRef} filename="debt-escape" />
        </div>
      )}
    </div>
  );
}
