"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { calculateDebtStack, PRESET_LENDERS } from "@/lib/debt";
import { formatKES } from "@/lib/budget";
import { useStickyState, useScrollIntoView } from "@/lib/hooks";
import BehavioralInsightStrip from "./BehavioralInsightStrip";
import CalculatorDisclaimer from "./CalculatorDisclaimer";
import ExportCardButton from "./ExportCardButton";
import NumberField from "./NumberField";
import ResetLink from "./ResetLink";
import ResultCard from "./ResultCard";
import ShareResultButton from "./ShareResultButton";

const DebtPayoffChart = dynamic(() => import("./DebtPayoffChart"), { ssr: false });

interface LoanDraft {
  id: string;
  name: string;
  balance: string;
  rate: string;
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

  const loanInputs = useMemo(
    () =>
      loans
        .filter((l) => Number(l.balance) > 0 && Number(l.rate) >= 0)
        .map((l) => ({
          id: l.id,
          name: l.name || l.id,
          balance: Number(l.balance),
          monthlyRatePct: Number(l.rate),
        })),
    [loans]
  );

  const result = useMemo(
    () => calculateDebtStack(loanInputs, Number(budget)),
    [loanInputs, budget]
  );

  const interestThreshold = useMemo(
    () => loanInputs.reduce((s, l) => s + l.balance * (l.monthlyRatePct / 100), 0),
    [loanInputs]
  );

  const hasInput = budget !== "" && Number(budget) > 0 && loanInputs.length > 0;
  const tooLow = hasInput && Number(budget) <= interestThreshold;
  const horizonExceeded = hasInput && !tooLow && result === null;

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
                  className="text-xs text-muted hover:text-danger underline underline-offset-2"
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
                label="Outstanding balance (KES)"
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
            {loan.rate && Number(loan.rate) > 0 && (
              <p className="text-[11px] text-faint">
                ≈ {Math.round((Math.pow(1 + Number(loan.rate) / 100, 12) - 1) * 100)}% effective APR — verify the current rate in
                your lender&apos;s app.
              </p>
            )}
          </div>
        ))}

        {loans.length < 5 && (
          <button
            type="button"
            onClick={addLoan}
            className="flex items-center gap-1.5 text-sm font-medium text-primary underline underline-offset-2 hover:text-ink-soft"
          >
            + Add another loan
          </button>
        )}
      </div>

      {/* Monthly repayment budget */}
      <NumberField
        id="budget"
        label="Monthly amount you can put toward debt repayment (KES)"
        value={budget}
        onChange={setBudget}
        placeholder="e.g. 8000"
        min={1}
      />

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
        <div ref={resultsRef} className="space-y-4" aria-live="polite">
          {/* Hero result */}
          <ResultCard
            label="Debt-free by"
            value={result.debtFreeLabel}
            sublabel={`${result.monthsToDebtFree} months from now, paying ${formatKES(Number(budget))}/month in total.`}
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
            <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-accent-wash px-2.5 py-1 text-[11px] font-medium text-accent-ink">
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
                    <p className="text-[11px] text-faint">
                      {formatKES(loan.totalInterestPaid)} total interest
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DebtPayoffChart timeline={result.timeline} totalBalance={result.totalBalance} />

          <BehavioralInsightStrip
            insight="Move your avalanche payment the day your salary lands — most Kenyan payroll cycles pay out around the 25th–28th. Routing it within 24 hours of payday, before it blends into M-Pesa spending, is what actually makes this plan stick."
          />

          {result.mmfValue12m > 0 && (
            <BehavioralInsightStrip
              insight={`Once debt-free, redirect ${formatKES(Number(budget))}/month into a Money Market Fund. At 11.8% p.a., that grows to ${formatKES(result.mmfValue12m)} in 12 months — the same money that was disappearing in interest fees.`}
            />
          )}

          <ShareResultButton
            message={`💸 *My Debt Escape Plan*\n\nTotal debt: ${formatKES(result.totalBalance)}\nMonthly payment: ${formatKES(Number(budget))}\nDebt-free: ${result.debtFreeLabel} (${result.monthsToDebtFree} months)\nTotal interest: ${formatKES(result.totalInterestPaid)}\n\nPlan yours → jipangefinance.org/tools/debt-escape`}
          />

          <CalculatorDisclaimer
            extraNotes={[
              "Monthly rates shown are approximate — lenders change rates frequently. Always verify the current rate in your lender's app before relying on this figure.",
              "The avalanche method minimises total interest paid. The snowball method (smallest balance first) builds psychological momentum but costs more overall.",
            ]}
          />
          <ExportCardButton containerRef={resultsRef} filename="debt-escape" />
        </div>
      )}
    </div>
  );
}
