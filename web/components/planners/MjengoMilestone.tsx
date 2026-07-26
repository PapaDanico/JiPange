"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatKES } from "@/lib/budget";
import { calculateLoanAmortization } from "@/lib/loans";
import {
  MAX_SALARY_DEBT_LIMIT,
  NOMINAL_RETIREMENT_YIELD,
  SACCO_LEVERAGE_MULTIPLIER,
  mjengoPlan,
} from "@/lib/market-2026";
import { getStoredCalculations } from "@/lib/storage";
import { useStorageValue } from "@/lib/hooks";

/** Assumptions for the safeguard estimate — visible in the UI copy. */
const SACCO_LOAN_RATE = 0.12;
const SACCO_LOAN_TERM_MONTHS = 48;

/**
 * The "Plot & Mjengo" path: build a deposit vault in a Tier-1 Sacco, then
 * strike with the 3× development-loan multiplier — instead of a ~14.5%
 * commercial mortgage.
 */
export default function MjengoMilestone() {
  const [propertyValue, setPropertyValue] = useState(3_000_000);
  const [contribution, setContribution] = useState("");
  const netMonthly = useStorageValue(() => {
    const stored = getStoredCalculations();
    return stored && stored.netMonthly > 0 ? stored.netMonthly : null;
  }, () => null);

  const parsedContribution = Math.max(0, Number(contribution) || 0);
  const plan = useMemo(
    () => mjengoPlan({ targetPropertyValue: propertyValue, monthlyContribution: parsedContribution }),
    [propertyValue, parsedContribution]
  );

  const repayment = useMemo(() => {
    if (plan.developmentLoan <= 0) return 0;
    return calculateLoanAmortization({
      principal: plan.developmentLoan,
      annualRate: SACCO_LOAN_RATE,
      termMonths: SACCO_LOAN_TERM_MONTHS,
    }).monthlyPayment;
  }, [plan.developmentLoan]);

  const overThird = netMonthly !== null && repayment > netMonthly * MAX_SALARY_DEBT_LIMIT;

  return (
    <section aria-label="Plot and Mjengo milestones" className="rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="text-base font-semibold text-primary">
        The Plot &amp; Mjengo path — skip the 14.5% mortgage
      </h2>
      <p className="mt-1 text-xs text-ink-soft">
        Build the deposit vault, then let the Sacco&apos;s {SACCO_LEVERAGE_MULTIPLIER}× multiplier
        fund the build.
      </p>

      <div className="mt-4">
        <div className="flex items-center justify-between">
          <label htmlFor="mjengo-value" className="text-sm font-medium text-ink-soft">
            Target property / build value
          </label>
          <span className="text-sm font-semibold text-primary">{formatKES(propertyValue)}</span>
        </div>
        <input
          id="mjengo-value"
          type="range"
          min={500_000}
          max={5_000_000}
          step={100_000}
          value={propertyValue}
          onChange={(event) => setPropertyValue(Number(event.target.value))}
          className="mt-2 h-11 w-full cursor-pointer accent-primary"
        />
      </div>

      <div className="mt-3">
        <label htmlFor="mjengo-contribution" className="text-sm font-medium text-ink-soft">
          Monthly contribution
        </label>
      </div>
      <div className="relative mt-1">
        <input
          id="mjengo-contribution"
          type="number"
          inputMode="numeric"
          min={0}
          value={contribution}
          onChange={(event) => setContribution(event.target.value)}
          placeholder="Monthly contribution, e.g. 30000"
          className="h-12 w-full rounded-lg border border-border bg-white px-4 text-base focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm text-ink-soft">
          Ksh/mo
        </span>
      </div>

      {parsedContribution > 0 && (
        <div className="mt-5">
          {/* Vertical milestone stepper */}
          <ol className="relative space-y-6 border-l-2 border-border pl-5">
            <li>
              <span className="absolute -left-[11px] flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-ink">
                1
              </span>
              <p className="text-sm font-semibold text-primary">The Accumulation Vault</p>
              <p className="mt-0.5 text-sm text-ink-soft">
                Deposit {formatKES(parsedContribution)}/mo into a Tier-1 Sacco until you hold{" "}
                <strong>{formatKES(plan.requiredDeposits)}</strong> (a third of the target).
              </p>
              {plan.monthsToTarget !== null && (
                <p className="mt-1 text-xs text-success" data-testid="mjengo-months">
                  ≈ {plan.monthsToTarget} months at the {(NOMINAL_RETIREMENT_YIELD * 100).toFixed(1)}%
                  Sacco growth baseline
                </p>
              )}
            </li>
            <li>
              <span className="absolute -left-[11px] flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                2
              </span>
              <p className="text-sm font-semibold text-primary">The Multiplier Strike</p>
              <p className="mt-0.5 text-sm text-ink-soft">
                Activate the {SACCO_LEVERAGE_MULTIPLIER}× development loan:{" "}
                <strong>{formatKES(plan.developmentLoan)}</strong> against your vault — enough for
                the full plot-and-mjengo build.
              </p>
              <p className="mt-1 text-xs text-faint">
                Est. repayment ≈ {formatKES(repayment)}/mo ({(SACCO_LOAN_RATE * 100).toFixed(0)}%
                over {SACCO_LOAN_TERM_MONTHS} months — confirm terms with your Sacco).
              </p>
            </li>
          </ol>

          {overThird && (
            <p className="mt-4 rounded-xl border-2 border-danger bg-danger-soft p-3 text-sm text-danger">
              ⚠️ Safeguard: that repayment exceeds {(MAX_SALARY_DEBT_LIMIT * 100).toFixed(0)}% of
              your take-home pay ({formatKES(netMonthly!)}) — the legal salary-deduction ceiling.
              Extend the vault phase or lower the target before striking.
            </p>
          )}

          <p className="mt-4 text-xs text-faint">
            Prefer T-Bills while you accumulate?{" "}
            <Link href="/tools/dhowcsd" className="font-medium text-primary underline">
              Ladder the vault on DhowCSD →
            </Link>
          </p>
        </div>
      )}
    </section>
  );
}
