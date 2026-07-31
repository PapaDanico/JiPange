"use client";

import { useMemo } from "react";
import { FIRE_ALLOCATION } from "@/lib/market-2026";
import {
  planKenyanRetirement,
  realReturnEvidence,
  MEDICAL_REAL_ESCALATION,
} from "@/lib/retirement-kenya";
import { formatKES } from "@/lib/budget";
import { DEFAULT_RETIREMENT_AGE } from "@/lib/projections";
import { inflationAttribution } from "@/lib/rates-feed";
import { useStickyState, useScrollIntoView } from "@/lib/hooks";
import CalculatorDisclaimer from "./CalculatorDisclaimer";
import ExportCardButton from "./ExportCardButton";
import NumberField from "./NumberField";
import ResetLink from "./ResetLink";
import ProductLinks from "./ProductLinks";
import Link from "next/link";
import ResultCard from "./ResultCard";
import ShareResultButton from "./ShareResultButton";
import { MMF_AND_TBILL_LINKS } from "@/lib/affiliate-links";
import dynamic from "next/dynamic";

const FirePathChart = dynamic(() => import("./FirePathChart"), { ssr: false });

/**
 * Retirement priced for Kenya — see lib/retirement-kenya.ts for the reasoning.
 *
 * This used to quote a nominal number: today's expenses grown at CPI for
 * thirty years, times twenty. That headline ran to tens of millions and told
 * the reader almost nothing, because it inflated the spending and then
 * discounted it at a nominal rate — inflation applied twice, in opposite
 * directions. Worse, the 20x it rested on was justified by an 11.5% money
 * market yield that is 3.16% REAL at the published CPI.
 *
 * Everything here is now in today's shillings at a conservative real return,
 * and medical cover is a stream of its own rather than a line inside a flat
 * expense figure. The medical amplification card is the point of the tool.
 */
export default function FireNumberCalculator() {
  const [monthlyExpenses, setMonthlyExpenses] = useStickyState(
    "jipange:tool:fire-number:monthlyExpenses",
    ""
  );
  const [currentAge, setCurrentAge] = useStickyState<number>(
    "jipange:tool:fire-number:currentAge",
    30
  );
  const [targetAge, setTargetAge] = useStickyState<number>(
    "jipange:tool:fire-number:targetAge",
    DEFAULT_RETIREMENT_AGE
  );
  const [monthlyMedical, setMonthlyMedical] = useStickyState(
    "jipange:tool:fire-number:monthlyMedical",
    ""
  );

  const fire = useMemo(() => {
    const expenses = Number(monthlyExpenses);
    if (!expenses || expenses <= 0) return null;
    return planKenyanRetirement({
      currentMonthlyExpenses: expenses,
      currentMonthlyMedical: Number(monthlyMedical) || 0,
      currentAge,
      retirementAge: Math.max(currentAge, targetAge),
    });
  }, [monthlyExpenses, monthlyMedical, currentAge, targetAge]);

  const evidence = useMemo(() => realReturnEvidence(), []);

  const resultsRef = useScrollIntoView<HTMLDivElement>(fire !== null);

  const isDirty =
    monthlyExpenses !== "" || monthlyMedical !== "" || currentAge !== 30 || targetAge !== DEFAULT_RETIREMENT_AGE;

  function handleReset() {
    setMonthlyExpenses("");
    setMonthlyMedical("");
    setCurrentAge(30);
    setTargetAge(DEFAULT_RETIREMENT_AGE);
  }

  return (
    <div className="space-y-4">
      <NumberField
        id="monthlyExpenses"
        label="Your monthly expenses, excluding medical (Ksh)"
        value={monthlyExpenses}
        onChange={setMonthlyExpenses}
        placeholder="e.g. 80000"
      />

      {/*
        Medical is asked for separately because it behaves differently from
        everything else in the budget: it is the one cost that rises in real
        terms as you age, while the rest falls. Folded into a single expense
        figure it is invisible, and its share of the capital cannot be shown.
      */}
      <NumberField
        id="monthlyMedical"
        label="Monthly medical cover — SHA plus any private top-up (Ksh)"
        value={monthlyMedical}
        onChange={setMonthlyMedical}
        placeholder="e.g. 8000"
      />

      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="currentAge" className="text-sm font-medium text-ink-soft">
            Current age
          </label>
          <span className="text-sm font-semibold text-primary">{currentAge}</span>
        </div>
        <input
          id="currentAge"
          type="range"
          min={18}
          max={70}
          value={currentAge}
          onChange={(event) => setCurrentAge(Number(event.target.value))}
          className="mt-2 h-11 w-full cursor-pointer accent-primary"
        />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="targetAge" className="text-sm font-medium text-ink-soft">
            Target retirement age
          </label>
          <span className="text-sm font-semibold text-primary">{targetAge}</span>
        </div>
        <input
          id="targetAge"
          type="range"
          min={30}
          max={75}
          value={targetAge}
          onChange={(event) => setTargetAge(Number(event.target.value))}
          className="mt-2 h-11 w-full cursor-pointer accent-primary"
        />
      </div>

      <ResetLink show={isDirty} onReset={handleReset} />

      {fire && (
        <>
        <div ref={resultsRef} className="animate-rise space-y-4" aria-live="polite">
          <ResultCard
            label={`What you need at ${Math.max(currentAge, targetAge)}, in today's shillings`}
            value={formatKES(fire.capitalRequiredKes)}
            sublabel={`${fire.impliedMultiple.toFixed(1)}× your current annual spending. Priced as the actual cost of ${fire.yearsInRetirement} years of living and medical care, discounted at ${(fire.realReturn * 100).toFixed(1)}% a year after inflation — not a rule of thumb. Today's money throughout, so there is no frightening nominal number to translate.`}
            tone="primary"
          />

          {/*
            The centrepiece. Medical is a small slice of a monthly budget and a
            large slice of the capital, because every other cost shrinks in real
            terms while this one compounds. No flat-expense model can show it.
          */}
          {fire.medicalCapitalKes > 0 && (
            <div className="rounded-2xl border border-[#F0C06A] bg-accent-wash p-5">
              <h3 className="text-sm font-semibold text-warning">
                Medical is {(fire.medicalShareOfSpendingToday * 100).toFixed(0)}% of your budget
                and {(fire.medicalShareOfCapital * 100).toFixed(0)}% of your retirement
              </h3>
              <p className="mt-2 text-2xl font-semibold text-ink">
                {formatKES(fire.medicalCapitalKes)}
              </p>
              <p className="mt-1 text-xs text-ink-soft">
                of the capital above exists for nothing but medical cover.
              </p>

              {/* The way out, rather than only the diagnosis.
                *
                * This card spent its whole life telling a reader that medical
                * was the expensive part and stopping there. Kenya built a
                * vehicle for exactly this problem and gave it tax relief, so
                * naming the problem without naming the answer was leaving the
                * useful half unsaid. */}
              <div className="mt-4 rounded-xl bg-white/70 p-4">
                <p className="text-xs font-semibold text-primary">
                  You can fund this part separately, and more cheaply
                </p>
                <p className="mt-1 text-xs text-ink-soft">
                  A <strong>post-retirement medical fund</strong> is a
                  RBA-registered pot for precisely this. Contributions are
                  tax-deductible up to{" "}
                  {formatKES(fire.prmf.monthlyReliefCapKes)} a month and
                  withdrawals for treatment are tax-free — so the same cover
                  costs less funded this way than paid for out of a taxed
                  drawdown.
                </p>
                <dl className="mt-3 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <dt className="text-ink-soft">Medical fund target</dt>
                    <dd className="text-sm font-semibold text-ink">
                      {formatKES(fire.prmf.targetKes)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-ink-soft">Pension pot then needed</dt>
                    <dd className="text-sm font-semibold text-ink">
                      {formatKES(fire.prmf.livingOnlyCapitalKes)}
                    </dd>
                  </div>
                </dl>
                <p className="mt-3 text-xs text-ink-soft">
                  Reaching that target means about{" "}
                  <strong>{formatKES(fire.prmf.monthlyContributionKes)}</strong> a
                  month for {fire.yearsToRetirement} years, at the same{" "}
                  {(fire.realReturn * 100).toFixed(1)}% real return the plan
                  above assumes.{" "}
                  {fire.prmf.withinReliefCap
                    ? "That sits inside the tax-deductible cap."
                    : `That exceeds the ${formatKES(fire.prmf.monthlyReliefCapKes)} cap, so only part of it attracts relief.`}
                </p>
                <p className="mt-2 text-xs text-faint">
                  Usually a sub-fund of a scheme you already belong to. Britam&apos;s
                  Afya Pension and CPF&apos;s scheme both run one, and CPF admits the
                  self-employed directly —{" "}
                  <Link href="/partners" className="underline hover:text-primary">
                    see the directory
                  </Link>
                  . No arrangement exists between us and either of them.
                </p>
              </div>
              <p className="mt-3 text-sm text-ink-soft">
                Everything else you spend falls in real terms once you retire — the fees end,
                the commute goes, the house is paid for. Medical does the opposite: it rises
                about {(MEDICAL_REAL_ESCALATION * 100).toFixed(0)}% a year faster than general
                inflation, because you age into a more expensive band as well as into a more
                expensive market. By {fire.planExhaustedAtAge} it is{" "}
                {(fire.years[fire.years.length - 1].medicalShare * 100).toFixed(0)}% of
                everything you spend.
              </p>
            </div>
          )}

          {fire.warnings.length > 0 && (
            <ul className="space-y-2">
              {fire.warnings.map((w) => (
                <li key={w} className="rounded-2xl bg-canvas p-4 text-xs leading-relaxed text-ink-soft">
                  {w}
                </li>
              ))}
            </ul>
          )}

          {/*
            The assumption is shown beside the evidence for it. Hiding the gap
            would make 3% look arbitrary; showing it is the argument.
          */}
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-primary">What this assumes you earn</h3>
            <p className="mt-2 text-sm text-ink-soft">
              <strong>{(fire.realReturn * 100).toFixed(1)}% a year after inflation and tax.</strong>{" "}
              A one-year Treasury bill nets{" "}
              {evidence.tbillRealNet !== null
                ? `${(evidence.tbillRealNet * 100).toFixed(1)}%`
                : "—"}{" "}
              real today and long infrastructure bonds clear well above this — Kenyan real
              yields are currently extraordinary. That is exactly why a thirty-year plan
              should not assume them: they are a fiscal moment, not a constant. Planning at
              today&apos;s long-bond yield is planning on the government still needing to
              borrow this expensively in the 2050s.
            </p>
            <p className="mt-2 text-xs text-faint">
              Inflation is {(evidence.inflation * 100).toFixed(2)}% — {inflationAttribution()}.
              If this proves conservative, the plan finishes early. That is the direction to
              be wrong in.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-primary">
              How that nest egg is structured after retirement
            </h3>
            <ul className="mt-3 space-y-2">
              {FIRE_ALLOCATION.map((slice) => (
                <li key={slice.label} className="text-sm text-ink-soft">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">
                      {(slice.share * 100).toFixed(0)}% · {slice.label}
                    </span>
                    <span className="shrink-0 font-semibold text-primary">
                      {formatKES(fire.capitalRequiredKes * slice.share)}
                    </span>
                  </div>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-canvas">
                    <div
                      className="h-full rounded-full bg-success"
                      style={{ width: `${slice.share * 100}%` }}
                    />
                  </div>
                  <p className="mt-0.5 text-xs text-faint">{slice.why}</p>
                </li>
              ))}
            </ul>
          </div>

          <FirePathChart
            monthlyExpenses={Number(monthlyExpenses)}
            monthlyMedical={Number(monthlyMedical) || 0}
            currentAge={currentAge}
            targetAge={Math.max(currentAge, targetAge)}
          />

          <p className="text-xs text-ink-soft">
            Why there is no 20× or 25× rule here: those size a pot meant to last forever, on
            a flat expense line. Yours is two streams pulling apart — ordinary costs falling
            in real terms, medical climbing — over a finite life. That has no single
            multiple. Yours works out at {fire.impliedMultiple.toFixed(1)}×, but the number
            worth acting on is the medical share, not the multiple.
          </p>

          <CalculatorDisclaimer
            extraNotes={[
              "Past returns do not guarantee future returns.",
              "JiPange is not a licensed investment advisor.",
            ]}
          />

          <ShareResultButton
            message={`🔥 *My Kenya Retirement Number*\n\nRetiring at ${Math.max(currentAge, targetAge)} on ${formatKES(Number(monthlyExpenses))}/month: I need ${formatKES(fire.capitalRequiredKes)} in today's money (${fire.impliedMultiple.toFixed(1)}× current spending, at ${(fire.realReturn * 100).toFixed(1)}% real).\n\n⚕️ ${formatKES(fire.medicalCapitalKes)} of that is medical cover alone — ${(fire.medicalShareOfCapital * 100).toFixed(0)}% of the pot from ${(fire.medicalShareOfSpendingToday * 100).toFixed(0)}% of today's budget.\n\nWork out yours → jipangefinance.org/tools/fire-number`}
          />
        </div>
        <ExportCardButton containerRef={resultsRef} filename="fire-number" />
        <ProductLinks products={MMF_AND_TBILL_LINKS} heading="Where to invest your FIRE portfolio" />
        </>
      )}
    </div>
  );
}
