"use client";

import { useMemo } from "react";
import {
  FIRE_ALLOCATION,
  KENYAN_INFLATION,
  LOCAL_SAFE_WITHDRAWAL_RATE,
  localizedFire,
} from "@/lib/market-2026";
import { formatKES } from "@/lib/budget";
import { inflationAttribution } from "@/lib/rates-feed";
import { useStickyState, useScrollIntoView } from "@/lib/hooks";
import CalculatorDisclaimer from "./CalculatorDisclaimer";
import ExportCardButton from "./ExportCardButton";
import NumberField from "./NumberField";
import ResetLink from "./ResetLink";
import ProductLinks from "./ProductLinks";
import ResultCard from "./ResultCard";
import ShareResultButton from "./ShareResultButton";
import { MMF_AND_TBILL_LINKS } from "@/lib/affiliate-links";
import dynamic from "next/dynamic";

const FirePathChart = dynamic(() => import("./FirePathChart"), { ssr: false });

/**
 * Localized FIRE engine: replaces the Western 4%-rule (25×) with a 5% SWR
 * (20×) calibrated to Kenya's high-yield/high-inflation layout, and quotes
 * the target in the shillings it will actually take at retirement.
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
    50
  );

  const fire = useMemo(() => {
    const expenses = Number(monthlyExpenses);
    if (!expenses || expenses <= 0) return null;
    return localizedFire({
      currentMonthlyExpenses: expenses,
      currentAge,
      targetRetirementAge: Math.max(currentAge, targetAge),
    });
  }, [monthlyExpenses, currentAge, targetAge]);

  const resultsRef = useScrollIntoView<HTMLDivElement>(fire !== null);

  const isDirty = monthlyExpenses !== "" || currentAge !== 30 || targetAge !== 50;

  function handleReset() {
    setMonthlyExpenses("");
    setCurrentAge(30);
    setTargetAge(50);
  }

  return (
    <div className="space-y-4">
      <NumberField
        id="monthlyExpenses"
        label="Your current monthly expenses (KES)"
        value={monthlyExpenses}
        onChange={setMonthlyExpenses}
        placeholder="e.g. 80000"
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
          className="mt-2 h-2 w-full accent-primary"
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
          className="mt-2 h-2 w-full accent-primary"
        />
      </div>

      <ResetLink show={isDirty} onReset={handleReset} />

      {fire && (
        <>
        <div ref={resultsRef} className="animate-rise space-y-4" aria-live="polite">
          <ResultCard
            label={`Your FIRE number at age ${Math.max(currentAge, targetAge)} (nominal)`}
            value={formatKES(fire.nominalFutureFireNumber)}
            sublabel={`That's ${formatKES(fire.todaysMoneyFireNumber)} in today's money (20× annual expenses at the localized ${(LOCAL_SAFE_WITHDRAWAL_RATE * 100).toFixed(0)}% withdrawal rate), grown along the published ${(KENYAN_INFLATION * 100).toFixed(2)}% inflation line — ${inflationAttribution()} — for ${fire.yearsToRetirement} years.`}
            tone="primary"
          />

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
                      {formatKES(fire.nominalFutureFireNumber * slice.share)}
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
            currentAge={currentAge}
            targetAge={Math.max(currentAge, targetAge)}
          />

          <p className="text-xs text-ink-soft">
            Why 20× and not the Western 25×: Kenya&apos;s low-risk yields (11.5% MMF/bond
            baseline) sit far above the 6.4% inflation line, supporting a ~5% localized safe
            withdrawal rate. Baselines shift — verify current rates before committing.
          </p>

          <CalculatorDisclaimer
            extraNotes={[
              "Past returns do not guarantee future returns.",
              "JiPange is not a licensed investment advisor.",
            ]}
          />

          <ShareResultButton
            message={`🔥 *My Kenya FIRE Number*\n\nTo retire at ${Math.max(currentAge, targetAge)} on ${formatKES(Number(monthlyExpenses))}/month (today's costs), I need ${formatKES(fire.nominalFutureFireNumber)} — inflation-adjusted, at a localized 5% withdrawal rate.\n\nFind yours → jipangefinance.org/tools/fire-number`}
          />
        </div>
        <ExportCardButton containerRef={resultsRef} filename="fire-number" />
        <ProductLinks products={MMF_AND_TBILL_LINKS} heading="Where to invest your FIRE portfolio" />
        </>
      )}
    </div>
  );
}
