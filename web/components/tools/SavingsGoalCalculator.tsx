"use client";

import { amountOrZero, positiveAmount } from "@/lib/money";
import { useMemo } from "react";
import { solveMonthlyContribution } from "@/lib/savings-goal";
import { futureValue } from "@/lib/projections";
import { formatKES } from "@/lib/budget";
import { useStickyState, useScrollIntoView } from "@/lib/hooks";
import CalculatorDisclaimer from "./CalculatorDisclaimer";
import dynamic from "next/dynamic";
import HowItWorks from "./HowItWorks";
import { type GrowthDataPoint } from "./CompoundGrowthChart";

const CompoundGrowthChart = dynamic(() => import("./CompoundGrowthChart"), { ssr: false });
import NumberField from "./NumberField";
import ResetLink from "./ResetLink";
import ExportCardButton from "./ExportCardButton";
import ProductLinks from "./ProductLinks";
import ResultCard from "./ResultCard";
import ShareResultButton from "./ShareResultButton";
import { MMF_LINKS } from "@/lib/affiliate-links";
import { assumedMmfYieldPct } from "@/lib/mmf-assumption";

const RATE_PRESETS = [
  { label: "Bank 3.23%", value: "3.23" },
  { label: "Sacco ~9%", value: "9" },
  { label: `MMF ~${assumedMmfYieldPct()}%`, value: assumedMmfYieldPct() },
];

export default function SavingsGoalCalculator() {
  const [target, setTarget] = useStickyState("jipange:tool:savings-goal:target", "");
  const [years, setYears] = useStickyState("jipange:tool:savings-goal:years", "");
  const [currentSavings, setCurrentSavings] = useStickyState(
    "jipange:tool:savings-goal:currentSavings",
    "0"
  );
  const [annualReturn, setAnnualReturn] = useStickyState(
    "jipange:tool:savings-goal:annualReturn",
    "10"
  );

  const result = useMemo(() => {
    const targetFutureValue = positiveAmount(target);
    const yearsValue = positiveAmount(years);
    if (targetFutureValue === null || yearsValue === null) return null;

    const monthly = solveMonthlyContribution({
      targetFutureValue,
      presentValue: Number(currentSavings) || 0,
      annualRate: Math.max(0, Number(annualReturn) || 0) / 100,
      years: yearsValue,
    });

    return Number.isFinite(monthly) ? monthly : null;
  }, [target, years, currentSavings, annualReturn]);

  const sensitivity = useMemo(() => {
    const targetFutureValue = positiveAmount(target);
    const yearsValue = positiveAmount(years);
    // The `> 1 year` rule is the sensitivity table's own, and is kept.
    if (targetFutureValue === null || yearsValue === null || yearsValue <= 1) return null;
    const at = (y: number) =>
      solveMonthlyContribution({
        targetFutureValue,
        presentValue: Number(currentSavings) || 0,
        annualRate: Math.max(0, Number(annualReturn) || 0) / 100,
        years: y,
      });
    return { faster: at(yearsValue - 1), slower: at(yearsValue + 1) };
  }, [target, years, currentSavings, annualReturn]);

  const chartData = useMemo((): GrowthDataPoint[] => {
    /* A NON-TERMINATING LOOP, HELD BACK BY SOMEBODY ELSE'S GUARD.
     *
     * The old guard here was `!targetFutureValue || yearsValue <= 0`, which
     * admits Infinity — Number("1e400") is truthy and not <= 0. Had Infinity
     * reached the loop below:
     *
     *   step = Math.max(1, Math.ceil(Infinity / 30))   ->  Infinity
     *   for (let y = Infinity; y <= Infinity; y += Infinity)
     *
     * y never advances and the condition never goes false. Not a wrong number
     * — a locked tab.
     *
     * IT COULD NOT REACH IT, AND THE REASON IS THE POINT. `!result` short-
     * circuits first, and `result` rejects Infinity because the memo above
     * already uses positiveAmount. So this loop was safe because of a guard in
     * a DIFFERENT useMemo, which nothing here states and no test pinned. Move
     * the chart above the result, drop the `!result` term while refactoring,
     * or compute the chart independently, and the loop becomes reachable with
     * no failing test to say so.
     *
     * Driven before this was written, twice, because the first version of this
     * comment claimed the tab did hang: typing 1e400 into the field (the
     * browser's number input rejects it outright, leaving ""), and restoring
     * it through localStorage, which is the path a backup file takes and
     * bypasses the input entirely. Both stayed responsive. The claim was
     * wrong; the latent loop is real. */
    const targetFutureValue = positiveAmount(target);
    const yearsValue = positiveAmount(years);
    if (!result || targetFutureValue === null || yearsValue === null) return [];
    const rate = Math.max(0, Number(annualReturn) || 0) / 100;
    const pv = amountOrZero(currentSavings);
    const step = Math.max(1, Math.ceil(yearsValue / 30));
    const points: GrowthDataPoint[] = [];
    for (let y = step; y <= yearsValue; y += step) {
      const total = futureValue(pv, result, rate, y);
      const contributed = pv + result * 12 * y;
      points.push({ year: y, contributed: Math.min(contributed, total), growth: Math.max(0, total - contributed) });
    }
    const last = yearsValue;
    if (points.length === 0 || points[points.length - 1].year !== last) {
      const total = futureValue(pv, result, rate, last);
      const contributed = pv + result * 12 * last;
      points.push({ year: last, contributed: Math.min(contributed, total), growth: Math.max(0, total - contributed) });
    }
    return points;
  }, [target, years, currentSavings, annualReturn, result]);

  const resultsRef = useScrollIntoView<HTMLDivElement>(result !== null);

  const isDirty =
    target !== "" || years !== "" || currentSavings !== "0" || annualReturn !== "10";

  function handleReset() {
    setTarget("");
    setYears("");
    setCurrentSavings("0");
    setAnnualReturn("10");
  }

  return (
    <div className="space-y-4">
      <NumberField id="target" label="Savings target (Ksh)" value={target} onChange={setTarget} placeholder="e.g. 500000" />
      <NumberField id="years" label="Time to reach it (years)" value={years} onChange={setYears} placeholder="e.g. 3" />
      <NumberField
        id="currentSavings"
        label="Current savings (Ksh)"
        value={currentSavings}
        onChange={setCurrentSavings}
        placeholder="0"
      />
      <NumberField
        id="annualReturn"
        label="Expected annual return"
        value={annualReturn}
        onChange={setAnnualReturn}
        suffix="%"
      />
      <div className="flex flex-wrap gap-2">
        {RATE_PRESETS.map((preset) => (
          <button
            key={preset.value}
            type="button"
            onClick={() => setAnnualReturn(preset.value)}
            aria-pressed={annualReturn === preset.value}
            className={`inline-flex min-h-11 items-center justify-center rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${
              annualReturn === preset.value
                ? "border-accent bg-accent text-ink"
                : "border-border bg-white text-ink-soft hover:bg-canvas"
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>
      <ResetLink show={isDirty} onReset={handleReset} />

      {result !== null && (
        <>
          <div ref={resultsRef} className="animate-rise space-y-4" aria-live="polite">
            <ResultCard
              label="Monthly savings needed"
              value={formatKES(result)}
              sublabel="Assumes returns compound monthly at the rate above."
              tone="success"
            />
            <CompoundGrowthChart data={chartData} />
            {sensitivity && (
              <div className="grid grid-cols-2 gap-3" data-testid="goal-sensitivity">
                <ResultCard
                  label={`In ${Number(years) - 1} years instead`}
                  value={formatKES(sensitivity.faster)}
                  sublabel="/month"
                />
                <ResultCard
                  label={`In ${Number(years) + 1} years instead`}
                  value={formatKES(sensitivity.slower)}
                  sublabel="/month"
                  tone="success"
                />
              </div>
            )}
            <ShareResultButton
              message={`🎯 *My Savings Goal*\n\nTarget: ${formatKES(Number(target))} in ${years} years\nMonthly savings needed: ${formatKES(result)}\n\nCalculate yours → jipangefinance.org/tools/savings-goal`}
            />
          </div>
          <ExportCardButton containerRef={resultsRef} filename="savings-goal" />
          <CalculatorDisclaimer
            extraNotes={[
              "Returns compound monthly at the rate entered. Actual MMF yields fluctuate daily — check your provider's current rate before setting contribution amounts.",
              "This calculator assumes you contribute every month without interruption. A buffer month of missed contributions delays your goal.",
            ]}
          />
          <ProductLinks products={MMF_LINKS.slice(0, 3)} heading="Top MMFs for this goal" />
        </>
      )}

      <HowItWorks
        steps={[
          "Enter the amount you're saving toward and your deadline in years.",
          "Add anything already saved — it works for you the whole time and lowers the monthly figure.",
          `Pick where the money will sit: the same goal needs far less per month in an MMF at ~${assumedMmfYieldPct()}% than in a bank at 3.23%.`,
          "Compare the ±1 year cards — one extra year of patience is often the cheapest lever you have.",
        ]}
      />
    </div>
  );
}
