"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import {
  calculateNetPay,
  MORTGAGE_INTEREST_RELIEF_CAP_MONTHLY,
  NSSF_PRIOR_YEAR_LIMITS,
  PENSION_RELIEF_CAP_MONTHLY,
} from "@/lib/tax";
import { formatKES } from "@/lib/budget";
import { useStickyState, useScrollIntoView } from "@/lib/hooks";
import CalculatorDisclaimer from "./CalculatorDisclaimer";
import DeductionRow from "./DeductionRow";
import ExportCardButton from "./ExportCardButton";
import NumberField from "./NumberField";
import ResetLink from "./ResetLink";
import ResultCard from "./ResultCard";
import ShareResultButton from "./ShareResultButton";

const PayBreakdownChart = dynamic(() => import("./PayBreakdownChart"), { ssr: false });

export default function TakeHomePayCalculator() {
  const [gross, setGross] = useStickyState("jipange:tool:take-home-pay:gross", "");
  const [pensionContribution, setPensionContribution] = useStickyState(
    "jipange:tool:take-home-pay:pension",
    "0"
  );
  const [mortgageInterest, setMortgageInterest] = useStickyState(
    "jipange:tool:take-home-pay:mortgage",
    "0"
  );
  const [insurancePremium, setInsurancePremium] = useStickyState(
    "jipange:tool:take-home-pay:insurance",
    "0"
  );
  const [showReliefs, setShowReliefs] = useState(false);
  const [showYearComparison, setShowYearComparison] = useState(false);
  const [whatIfPercent, setWhatIfPercent] = useState(100);

  const reliefs = useMemo(
    () => ({
      pensionContribution: Number(pensionContribution) || 0,
      mortgageInterest: Number(mortgageInterest) || 0,
      insurancePremium: Number(insurancePremium) || 0,
    }),
    [pensionContribution, mortgageInterest, insurancePremium]
  );

  const result = useMemo(() => {
    const value = Number(gross);
    if (!value || value <= 0) return null;
    return calculateNetPay(value, reliefs);
  }, [gross, reliefs]);

  const priorYearResult = useMemo(() => {
    if (!showYearComparison) return null;
    const value = Number(gross);
    if (!value || value <= 0) return null;
    return calculateNetPay(value, reliefs, NSSF_PRIOR_YEAR_LIMITS);
  }, [showYearComparison, gross, reliefs]);

  const whatIfGrossValue = useMemo(
    () => Math.round((Number(gross) * whatIfPercent) / 100),
    [gross, whatIfPercent]
  );
  const whatIfNetPay = useMemo(() => {
    if (!whatIfGrossValue) return null;
    return calculateNetPay(whatIfGrossValue, reliefs).netMonthly;
  }, [whatIfGrossValue, reliefs]);

  const pensionCapped = reliefs.pensionContribution > PENSION_RELIEF_CAP_MONTHLY;
  const mortgageCapped = reliefs.mortgageInterest > MORTGAGE_INTEREST_RELIEF_CAP_MONTHLY;

  const resultsRef = useScrollIntoView<HTMLDivElement>(result !== null);

  function handleReset() {
    setGross("");
    setPensionContribution("0");
    setMortgageInterest("0");
    setInsurancePremium("0");
    setShowReliefs(false);
    setShowYearComparison(false);
    setWhatIfPercent(100);
  }

  return (
    <div className="space-y-4">
      <div className="print:hidden">
        <NumberField
          id="gross"
          label="Monthly gross salary (Ksh)"
          value={gross}
          onChange={setGross}
          placeholder="e.g. 80000"
        />
        <ResetLink show={Boolean(gross)} onReset={handleReset} className="mt-2" />
      </div>

      <button
        type="button"
        onClick={() => setShowReliefs((prev) => !prev)}
        aria-expanded={showReliefs}
        aria-controls="optional-tax-reliefs"
        className="inline-flex min-h-11 items-center text-sm font-medium text-primary underline print:hidden"
      >
        {showReliefs ? "− Hide optional tax reliefs" : "+ Add optional tax reliefs"}
      </button>

      {showReliefs && (
        <div
          id="optional-tax-reliefs"
          className="space-y-3 rounded-2xl bg-white p-6 shadow-sm print:hidden"
        >
          <NumberField
            id="pensionContribution"
            label="Voluntary pension contribution (Ksh/month) — capped at Ksh 30,000"
            value={pensionContribution}
            onChange={setPensionContribution}
            placeholder="0"
          />
          {pensionCapped && (
            <p className="text-xs text-warning">
              Relief capped at {formatKES(PENSION_RELIEF_CAP_MONTHLY)}/month — the KRA limit.
            </p>
          )}
          <NumberField
            id="mortgageInterest"
            label="Mortgage interest paid, registered home loan (Ksh/month) — capped at Ksh 30,000"
            value={mortgageInterest}
            onChange={setMortgageInterest}
            placeholder="0"
          />
          {mortgageCapped && (
            <p className="text-xs text-warning">
              Relief capped at {formatKES(MORTGAGE_INTEREST_RELIEF_CAP_MONTHLY)}/month — the KRA
              limit.
            </p>
          )}
          <NumberField
            id="insurancePremium"
            label="Life/health/education insurance premium (Ksh/month)"
            value={insurancePremium}
            onChange={setInsurancePremium}
            placeholder="0"
          />
          <p className="text-xs text-ink-soft">
            Pension and mortgage relief reduce your taxable pay up to the KRA-capped limits.
            Insurance relief is 15% of premiums paid, up to Ksh 5,000/month. These reliefs lower
            your PAYE if declared to your employer — this calculator doesn&apos;t separately deduct
            the contribution, premium, or mortgage payment itself, since those are typically paid
            outside payroll.
          </p>
        </div>
      )}

      {result && (
        <>
        <div ref={resultsRef} className="animate-rise space-y-4" aria-live="polite">
          <ResultCard label="Take-home pay" value={formatKES(result.netMonthly)} tone="success" />

          {/* Salary explorer — drag to preview take-home at any salary level */}
          <div className="rounded-2xl bg-canvas p-5 print:hidden">
            <p className="text-sm font-semibold text-primary">Salary explorer</p>
            <p className="mt-0.5 text-xs text-ink-soft">
              Drag to see your take-home at any salary
            </p>
            <div
              aria-live="polite"
              className="mt-3 flex items-baseline justify-between"
            >
              <span className="text-sm text-ink-soft">
                Ksh {whatIfGrossValue.toLocaleString("en-KE")} gross
              </span>
              <span className="text-base font-semibold text-success">
                → {formatKES(whatIfNetPay ?? 0)}
              </span>
            </div>
            <input
              type="range"
              min={50}
              max={200}
              step={5}
              value={whatIfPercent}
              onChange={(e) => setWhatIfPercent(Number(e.target.value))}
              className="mt-2 h-11 w-full cursor-pointer accent-primary"
              aria-label={`Explore salary — currently at ${whatIfPercent}% of entered gross`}
            />
            <div className="mt-1 flex justify-between text-[10px] text-muted">
              <span>50%</span>
              <span>Your salary</span>
              <span>200%</span>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <DeductionRow label="Gross salary" value={formatKES(result.grossMonthly)} bold />
            <DeductionRow
              label="Less: NSSF Tier 1"
              value={`(${formatKES(result.nssf.tier1)})`}
              info="National Social Security Fund — Kenya's mandatory retirement savings scheme. Tier 1 covers the first Ksh 9,000 of pay at 6%; Tier 2 covers pay between Ksh 9,000 and Ksh 108,000, also at 6%. It's still your money — it goes into your own NSSF account."
            />
            <DeductionRow label="Less: NSSF Tier 2" value={`(${formatKES(result.nssf.tier2)})`} />
            <DeductionRow
              label="Less: SHIF (2.75%)"
              value={`(${formatKES(result.shif)})`}
              info="Social Health Insurance Fund — replaced NHIF in October 2024. Funds your public health cover, charged at 2.75% of gross pay with a Ksh 300/month minimum."
            />
            <DeductionRow
              label="Less: Housing Levy (AHL)"
              value={`(${formatKES(result.ahl)})`}
              info="Affordable Housing Levy — a mandatory 1.5% of gross pay funding government affordable-housing projects. Your employer pays a matching 1.5% on top of your gross salary."
            />
            {result.pensionRelief > 0 && (
              <DeductionRow
                label="Less: Pension relief"
                value={`(${formatKES(result.pensionRelief)})`}
              />
            )}
            {result.mortgageRelief > 0 && (
              <DeductionRow
                label="Less: Mortgage interest relief"
                value={`(${formatKES(result.mortgageRelief)})`}
              />
            )}
            <hr className="my-2 border-border" />
            <DeductionRow
              label="Taxable pay"
              value={formatKES(result.taxablePay)}
              bold
              info="Your gross salary minus NSSF, SHIF, Housing Levy, and any pension or mortgage relief above. PAYE (income tax) is calculated on this smaller amount, not your full gross salary."
            />
            <DeductionRow
              label="PAYE (before relief)"
              value={`(${formatKES(result.grossPaye)})`}
            />
            <DeductionRow
              label="Less: Personal relief"
              value={formatKES(result.personalRelief)}
              info="A flat Ksh 2,400/month tax credit every formally employed Kenyan automatically gets, subtracted from your PAYE bill before you pay it — not something you need to apply for."
            />
            {result.insuranceRelief > 0 && (
              <DeductionRow
                label="Less: Insurance relief"
                value={formatKES(result.insuranceRelief)}
              />
            )}
            <DeductionRow label="Net PAYE" value={`(${formatKES(result.paye)})`} />
            <hr className="my-2 border-border" />
            <DeductionRow label="Net take-home pay" value={formatKES(result.netMonthly)} bold />
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-primary">Employer also pays</p>
            <DeductionRow label="NSSF match" value={formatKES(result.employerCost.nssf)} />
            <DeductionRow label="Housing Levy match" value={formatKES(result.employerCost.ahl)} />
            <hr className="my-2 border-border" />
            <DeductionRow
              label="Your total cost to employer"
              value={formatKES(result.employerCost.total)}
              bold
            />
          </div>

          {/* The deduction table above carries the same data — the chart is
              screen-only so the report holds one page. */}
          <div className="print:hidden">
            <PayBreakdownChart
              netMonthly={result.netMonthly}
              paye={result.paye}
              nssfTotal={result.nssf.total}
              shif={result.shif}
              ahl={result.ahl}
            />
          </div>

          <div className="rounded-2xl bg-canvas p-6">
            <p className="text-sm text-ink-soft">
              You take home <strong>{formatKES(result.netMonthly)}</strong> of your{" "}
              <strong>{formatKES(result.grossMonthly)}</strong> gross salary (
              {Math.round((result.netMonthly / result.grossMonthly) * 100)}%). Your employer
              actually pays <strong>{formatKES(result.employerCost.total)}</strong> total to keep
              you employed. Statutory deductions and tax take{" "}
              <strong>{formatKES(result.grossMonthly - result.netMonthly)}</strong> (
              {Math.round(
                ((result.grossMonthly - result.netMonthly) / result.grossMonthly) * 100
              )}
              % of your gross).
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowYearComparison((prev) => !prev)}
            aria-expanded={showYearComparison}
            aria-controls="year-over-year-comparison"
            className="inline-flex min-h-11 items-center text-sm font-medium text-primary underline print:hidden"
          >
            {showYearComparison
              ? "− Hide year-over-year comparison"
              : "+ Compare with last year's rates"}
          </button>

          {showYearComparison && priorYearResult && (
            <div
              id="year-over-year-comparison"
              className="rounded-2xl bg-white p-6 shadow-sm print:hidden"
            >
              <p className="text-sm font-semibold text-primary">
                NSSF Year 3 (2025) vs Year 4 (2026)
              </p>
              <p className="mt-1 text-xs text-ink-soft">
                The NSSF Act 2013&apos;s phased rollout raised the earnings limits in early 2026
                (Year 4) — this shows how that change alone affects your take-home pay, holding
                your gross salary and any reliefs above constant.
              </p>
              <hr className="my-2 border-border" />
              <DeductionRow
                label="NSSF deduction — 2025 rates"
                value={formatKES(priorYearResult.nssf.total)}
              />
              <DeductionRow
                label="NSSF deduction — 2026 rates"
                value={formatKES(result.nssf.total)}
                bold
              />
              <hr className="my-2 border-border" />
              <DeductionRow
                label="Take-home pay — 2025 rates"
                value={formatKES(priorYearResult.netMonthly)}
              />
              <DeductionRow
                label="Take-home pay — 2026 rates"
                value={formatKES(result.netMonthly)}
                bold
              />
              <p className="mt-2 text-xs text-ink-soft">
                {result.netMonthly < priorYearResult.netMonthly
                  ? `Your take-home pay is ${formatKES(priorYearResult.netMonthly - result.netMonthly)}/month lower under the current rates.`
                  : `Your take-home pay is ${formatKES(result.netMonthly - priorYearResult.netMonthly)}/month higher under the current rates.`}
              </p>
            </div>
          )}

          <div className="print:hidden">
            <CalculatorDisclaimer
              extraNotes={[
                "Pension relief — Income Tax Act s.15(3), capped at Ksh 30,000/month. Mortgage interest relief — Ksh 30,000/month cap, raised from Ksh 25,000 by the Finance Act 2025. Insurance relief — 15% of premiums up to Ksh 5,000/month, per s.31.",
              ]}
            />
          </div>

          <div className="hidden print:block">
            <p className="mt-4 text-xs text-ink-soft">
              Estimate only, not a payslip or licensed financial advice — rates current as of July
              2026. Generated at jipangefinance.org/tools/take-home-pay
            </p>
          </div>

          <div className="print:hidden">
            <ShareResultButton
              message={`🇰🇪 *My Take-Home Pay*\n\nGross salary: ${formatKES(Number(gross))}\nTake-home pay: ${formatKES(result.netMonthly)}/month\n\nCalculate yours → jipangefinance.org/tools/take-home-pay`}
            />
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="h-11 w-full rounded-full border border-border text-sm font-medium text-ink-soft print:hidden"
          >
            Print / Save as PDF
          </button>
        </div>
        <ExportCardButton containerRef={resultsRef} filename="take-home-pay" />
        </>
      )}
    </div>
  );
}
