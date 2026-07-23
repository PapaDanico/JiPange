"use client";

import { useMemo } from "react";
import { futureValueWithStepUp, inflationAdjust } from "@/lib/projections";
import { formatKES } from "@/lib/budget";
import { useStickyState, useScrollIntoView } from "@/lib/hooks";
import dynamic from "next/dynamic";
import CalculatorDisclaimer from "./CalculatorDisclaimer";
import { type GrowthDataPoint } from "./CompoundGrowthChart";
import HowItWorks from "./HowItWorks";

const CompoundGrowthChart = dynamic(() => import("./CompoundGrowthChart"), { ssr: false });
import NumberField from "./NumberField";
import ResetLink from "./ResetLink";
import ExportCardButton from "./ExportCardButton";
import ProductLinks from "./ProductLinks";
import ResultCard from "./ResultCard";
import ShareResultButton from "./ShareResultButton";
import { MMF_AND_TBILL_LINKS } from "@/lib/affiliate-links";

const RATE_PRESETS = [
  { label: "Bank 3.23%", value: "3.23" },
  { label: "T-Bill ~8.9%", value: "8.9" },
  { label: "MMF ~11.5%", value: "11.5" },
];

export default function InvestmentReturnsCalculator() {
  const [lumpSum, setLumpSum] = useStickyState(
    "jipange:tool:investment-returns:lumpSum",
    "0"
  );
  const [monthly, setMonthly] = useStickyState(
    "jipange:tool:investment-returns:monthly",
    ""
  );
  const [annualReturn, setAnnualReturn] = useStickyState(
    "jipange:tool:investment-returns:annualReturn",
    "10"
  );
  const [years, setYears] = useStickyState(
    "jipange:tool:investment-returns:years",
    ""
  );
  const [stepUp, setStepUp] = useStickyState<number>(
    "jipange:tool:investment-returns:stepUp",
    0
  );

  const result = useMemo(() => {
    const yearsValue = Number(years);
    if (!yearsValue || yearsValue <= 0) return null;

    const { total, totalContributed } = futureValueWithStepUp(
      Number(lumpSum) || 0,
      Number(monthly) || 0,
      Math.max(0, Number(annualReturn) || 0) / 100,
      yearsValue,
      stepUp / 100
    );

    return {
      total,
      totalContributed,
      growth: total - totalContributed,
      realValue: inflationAdjust(total, yearsValue),
    };
  }, [lumpSum, monthly, annualReturn, years, stepUp]);

  const chartData = useMemo((): GrowthDataPoint[] => {
    const yearsValue = Number(years);
    if (!yearsValue || yearsValue <= 0) return [];
    const rate = Math.max(0, Number(annualReturn) || 0) / 100;
    const pv = Number(lumpSum) || 0;
    const mo = Number(monthly) || 0;
    const su = stepUp / 100;
    const step = Math.max(1, Math.ceil(yearsValue / 30));
    const points: GrowthDataPoint[] = [];
    for (let y = step; y <= yearsValue; y += step) {
      const { total, totalContributed } = futureValueWithStepUp(pv, mo, rate, y, su);
      points.push({ year: y, contributed: totalContributed, growth: Math.max(0, total - totalContributed) });
    }
    const last = yearsValue;
    if (points.length === 0 || points[points.length - 1].year !== last) {
      const { total, totalContributed } = futureValueWithStepUp(pv, mo, rate, last, su);
      points.push({ year: last, contributed: totalContributed, growth: Math.max(0, total - totalContributed) });
    }
    return points;
  }, [lumpSum, monthly, annualReturn, years, stepUp]);

  const resultsRef = useScrollIntoView<HTMLDivElement>(result !== null);

  const monthlySliderMax = Math.max(50_000, Math.ceil(((Number(monthly) || 0) * 1.5) / 1000) * 1000);

  const isDirty =
    lumpSum !== "0" || monthly !== "" || annualReturn !== "10" || years !== "" || stepUp !== 0;

  function handleReset() {
    setLumpSum("0");
    setMonthly("");
    setAnnualReturn("10");
    setYears("");
    setStepUp(0);
  }

  return (
    <div className="space-y-4">
      <NumberField
        id="lumpSum"
        label="Starting lump sum (KES)"
        value={lumpSum}
        onChange={setLumpSum}
        placeholder="0"
      />
      <NumberField
        id="monthly"
        label="Monthly contribution (KES)"
        value={monthly}
        onChange={setMonthly}
        placeholder="e.g. 10000"
      />
      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="monthly-slider" className="text-xs text-ink-soft">
            Drag to explore instantly
          </label>
          <span className="text-sm font-semibold text-primary">
            {formatKES(Number(monthly) || 0)}/mo
          </span>
        </div>
        <input
          id="monthly-slider"
          type="range"
          min={0}
          max={monthlySliderMax}
          step={500}
          value={Math.min(Number(monthly) || 0, monthlySliderMax)}
          onChange={(event) => setMonthly(event.target.value)}
          className="mt-2 h-2 w-full accent-primary"
          aria-label="Explore monthly contribution"
        />
      </div>
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
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              annualReturn === preset.value
                ? "border-accent bg-accent text-ink"
                : "border-border bg-white text-ink-soft hover:bg-canvas"
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>
      <NumberField
        id="years"
        label="Investment period (years)"
        value={years}
        onChange={setYears}
        placeholder="e.g. 10"
      />

      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="stepUp" className="text-sm font-medium text-ink-soft">
            Increase contribution each year (as income grows)
          </label>
          <span className="text-sm font-semibold text-primary">+{stepUp}%/yr</span>
        </div>
        <input
          id="stepUp"
          type="range"
          min={0}
          max={25}
          value={stepUp}
          onChange={(event) => setStepUp(Number(event.target.value))}
          className="mt-2 h-2 w-full accent-primary"
        />
      </div>

      <ResetLink show={isDirty} onReset={handleReset} />

      {result && (
        <>
          <div ref={resultsRef} className="space-y-4" aria-live="polite">
            <ResultCard
              label="Projected future value"
              value={formatKES(result.total)}
              sublabel={`At ${annualReturn}% annual return over ${years} years.`}
              tone="success"
            />
            <CompoundGrowthChart data={chartData} />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ResultCard label="Total contributed" value={formatKES(result.totalContributed)} />
              <ResultCard label="Growth earned" value={formatKES(result.growth)} tone="success" />
              <ResultCard
                label="Real value (today's shillings)"
                value={formatKES(result.realValue)}
                sublabel="After 6.5% Kenya CPI inflation"
              />
            </div>
            <ShareResultButton
              message={`📈 *My Investment Projection*\n\nIn ${years} years: ${formatKES(result.total)}\nGrowth earned: ${formatKES(result.growth)}\n\nCalculate yours → jipangefinance.org/tools/investment-returns`}
            />
          </div>
          <ExportCardButton containerRef={resultsRef} filename="investment-returns" />
          <CalculatorDisclaimer
            extraNotes={[
              "Returns shown are nominal and compound monthly. Actual returns vary with market conditions and are not guaranteed.",
              "The inflation adjustment uses Kenya's long-run CPI average of ~6.5% p.a. Actual inflation will differ.",
              "Past returns on T-Bills, MMFs, and SACCOs do not guarantee future performance. Rates change regularly.",
            ]}
          />
          <ProductLinks products={MMF_AND_TBILL_LINKS} heading="Where to invest this" />
        </>
      )}

      <HowItWorks
        steps={[
          "Enter what you have now and what you can add monthly.",
          "Pick a return preset (bank, T-Bill, MMF) or type your own rate.",
          "Use the step-up slider if your contributions will grow with your income — even +10%/yr changes the ending dramatically.",
          "Check the 'today's shillings' line: that is what the money will actually buy after inflation.",
        ]}
      />
    </div>
  );
}
