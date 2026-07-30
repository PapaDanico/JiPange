"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { smoothIncomes } from "@/lib/hustle-smoother";
import { TARGET_MMF_YIELD } from "@/lib/journey";
import { formatKES } from "@/lib/budget";
import { useStickyState, useScrollIntoView } from "@/lib/hooks";
import CalculatorDisclaimer from "./CalculatorDisclaimer";
import ExportCardButton from "./ExportCardButton";
import NumberField from "./NumberField";
import ResetLink from "./ResetLink";
import ProductLinks from "./ProductLinks";
import QuickFillChips from "./QuickFillChips";
import ResultCard from "./ResultCard";
import ShareResultButton from "./ShareResultButton";
import { MMF_LINKS } from "@/lib/affiliate-links";

const MONTH_CHIPS = [
  { label: "3 mo", value: "3" },
  { label: "6 mo", value: "6" },
  { label: "9 mo", value: "9" },
  { label: "12 mo", value: "12" },
];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function buildMonthLabels(count: number): string[] {
  const now = new Date().getMonth(); // 0 = Jan
  return Array.from({ length: count }, (_, i) => {
    const idx = ((now - count + 1 + i) + 12) % 12;
    return MONTH_NAMES[idx];
  });
}

export default function HustleIncomeSmootherCalculator() {
  const [monthCount, setMonthCount] = useStickyState(
    "jipange:tool:hustle-smoother:months",
    "6"
  );
  const [drawPct, setDrawPct] = useStickyState(
    "jipange:tool:hustle-smoother:drawPct",
    "80"
  );
  const count = Math.max(3, Math.min(12, Number(monthCount) || 6));

  const [incomes, setIncomes] = useState<string[]>(() => Array(count).fill(""));

  // Resize the incomes array when `count` changes, following React's own
  // "adjust state when a prop changes" pattern — setState during render is
  // safe (React re-renders before committing), so this doesn't need an
  // effect at all. https://react.dev/learn/you-might-not-need-an-effect
  const [lastCount, setLastCount] = useState(count);
  if (count !== lastCount) {
    setLastCount(count);
    setIncomes(
      incomes.length < count
        ? [...incomes, ...Array(count - incomes.length).fill("")]
        : incomes.slice(0, count)
    );
  }

  const monthLabels = useMemo(() => buildMonthLabels(count), [count]);

  const validIncomes = useMemo(
    () => incomes.slice(0, count).map(Number).filter((v) => v > 0),
    [incomes, count]
  );

  const result = useMemo(() => {
    if (validIncomes.length < 2) return null;
    return smoothIncomes(validIncomes, Number(drawPct) / 100);
  }, [validIncomes, drawPct]);

  const resultsRef = useScrollIntoView<HTMLDivElement>(result !== null);

  const maxBar = result
    ? Math.max(
        ...incomes.slice(0, count).map(Number).filter((v) => v > 0),
        result.monthlyDraw
      )
    : 0;

  const isDirty =
    monthCount !== "6" || drawPct !== "80" || incomes.some((v) => v !== "");

  function handleReset() {
    setMonthCount("6");
    setDrawPct("80");
    setIncomes(Array(6).fill(""));
  }

  function updateIncome(i: number, value: string) {
    setIncomes((prev) => {
      const next = [...prev];
      next[i] = value;
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-ink-soft">
          How many months of income to enter?
        </p>
        <QuickFillChips
          label=""
          options={MONTH_CHIPS}
          onSelect={setMonthCount}
          current={monthCount}
        />
      </div>

      <div className="space-y-3">
        {Array.from({ length: count }, (_, i) => (
          <NumberField
            key={i}
            id={`income-${i}`}
            label={`${monthLabels[i]} income (Ksh)`}
            value={incomes[i] ?? ""}
            onChange={(v) => updateIncome(i, v)}
            placeholder="e.g. 35000"
          />
        ))}
      </div>

      {validIncomes.length >= 2 && (
        <div>
          <div className="flex items-center justify-between">
            <label
              htmlFor="hustle-drawPct"
              className="text-sm font-medium text-ink-soft"
            >
              Pay yourself this % of your median income
            </label>
            <span className="text-sm font-semibold text-primary">{drawPct}%</span>
          </div>
          <input
            id="hustle-drawPct"
            type="range"
            min={50}
            max={100}
            step={5}
            value={drawPct}
            onChange={(e) => setDrawPct(e.target.value)}
            className="mt-2 h-11 w-full cursor-pointer accent-primary"
          />
          <div className="mt-1 flex justify-between text-[10px] text-muted">
            <span>50% (very conservative)</span>
            <span>100% (median)</span>
          </div>
        </div>
      )}

      <ResetLink show={isDirty} onReset={handleReset} />

      {result && (
        <>
          <div ref={resultsRef} className="animate-rise space-y-4" aria-live="polite">
            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3">
              <ResultCard label="Lowest month" value={formatKES(result.stats.min)} />
              <ResultCard
                label="Median month"
                value={formatKES(result.stats.median)}
              />
              <ResultCard
                label="Average month"
                value={formatKES(result.stats.average)}
              />
              <ResultCard label="Best month" value={formatKES(result.stats.max)} />
            </div>

            {/* Main result */}
            <ResultCard
              label="Your smoothed monthly salary"
              value={formatKES(result.monthlyDraw)}
              sublabel={`${drawPct}% of your median — a steady draw you can count on even in lean months.`}
              tone="success"
            />

            {/* Month-by-month bar chart */}
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-primary">
                Month-by-month view
              </p>
              <p className="mt-0.5 text-xs text-ink-soft">
                Bars = your income. Vertical line = your salary draw.
              </p>
              <div className="mt-3 space-y-2.5">
                {incomes.slice(0, count).map((raw, i) => {
                  const income = Number(raw) || 0;
                  if (income <= 0) return null;
                  const barPct = Math.round((income / maxBar) * 100);
                  const linePct = Math.round((result.monthlyDraw / maxBar) * 100);
                  const surplus = income - result.monthlyDraw;
                  const isLean = surplus < 0;
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-ink-soft">{monthLabels[i]}</span>
                        <span
                          className={`font-medium ${
                            isLean ? "text-danger" : "text-success"
                          }`}
                        >
                          {surplus >= 0 ? "+" : ""}
                          {formatKES(surplus)}
                        </span>
                      </div>
                      <div className="relative mt-1 h-4 overflow-hidden rounded-full bg-canvas">
                        <div
                          className={`h-full rounded-full ${
                            isLean ? "bg-[#f5a9a9]" : "bg-[#86c99a]"
                          }`}
                          style={{ width: `${barPct}%` }}
                        />
                        {/* Salary draw line */}
                        <div
                          className="absolute inset-y-0 w-0.5 bg-primary"
                          style={{ left: `${linePct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-ink-soft">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#86c99a]" />
                  Surplus month
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#f5a9a9]" />
                  Lean month
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-0.5 bg-primary" />
                  Your salary
                </span>
              </div>
            </div>

            {/*
              This comes FIRST on purpose. The buffer ending positive says
              nothing about the hole you had to climb out of, and the ORDER of
              the months decides that entirely: ending at +120,000 having been
              140,000 overdrawn in month two is a year that ended fine and could
              not actually be lived. The tool used to report only the ending, and
              report it in green.
            */}
            {result.goesNegative && (
              <div className="rounded-2xl border border-[#F0C06A] bg-accent-wash p-4 text-sm">
                <p className="font-semibold text-warning">
                  This plan runs dry in month {result.lowestBufferMonth}.
                </p>
                <p className="mt-1 text-xs text-ink-soft">
                  Taking {formatKES(result.monthlyDraw)} every month, your buffer bottoms out
                  at {formatKES(result.lowestBuffer)} — money you would have had to borrow,
                  because the lean months arrive before the good ones pay for them. You would
                  need {formatKES(result.requiredStartingBuffer)} already saved on day one for
                  this draw to work, or a smaller draw.
                  {result.finalBuffer > 0 && (
                    <>
                      {" "}
                      It does end the {validIncomes.length} months up at{" "}
                      {formatKES(result.finalBuffer)} — but that is where it finished, not
                      how it felt.
                    </>
                  )}
                </p>
              </div>
            )}

            {/* Buffer outcome */}
            {result.finalBuffer > 0 && !result.goesNegative ? (
              <div className="rounded-2xl bg-success-soft p-4 text-sm text-success-deep">
                <p className="font-semibold">
                  Buffer built:{" "}
                  {formatKES(result.finalBuffer)} (
                  {result.finalBufferMonths.toFixed(1)} months of salary)
                </p>
                <p className="mt-1 text-xs">
                  Over {validIncomes.length} months, surplus drawdowns built this
                  cushion — park it in an MMF at ~
                  {(TARGET_MMF_YIELD * 100).toFixed(1)}% and it earns{" "}
                  {formatKES(
                    Math.round(result.finalBuffer * TARGET_MMF_YIELD)
                  )}
                  /year while it protects you.
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-[#F0C06A] bg-accent-wash p-4 text-sm">
                <p className="font-semibold text-warning">
                  Your income is too variable for this draw level.
                </p>
                <p className="mt-1 text-xs text-ink-soft">
                  Lean months drain your buffer before the next surplus arrives.
                  Try lowering the draw % — 70% of median usually gives a safe
                  margin even with volatile income.
                </p>
              </div>
            )}

            {result.shortMonths > 0 && (
              <p className="text-xs text-ink-soft">
                {result.shortMonths} of {validIncomes.length} months fell below your salary
                draw — that&apos;s exactly what the buffer fund covers.
              </p>
            )}

            {/* The three-step system */}
            <div className="rounded-2xl bg-canvas p-4 text-sm text-ink-soft">
              <p className="font-semibold text-primary">The three-step system</p>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs">
                <li>
                  Every time income arrives, transfer the full amount to an MMF.
                </li>
                <li>
                  Set a recurring M-Pesa withdrawal of exactly{" "}
                  {formatKES(result.monthlyDraw)} on the 1st of every month — your
                  salary, on time, regardless of that month&apos;s earnings.
                </li>
                <li>
                  Leave the rest in the MMF — surplus months build the buffer; lean
                  months draw from it automatically.
                </li>
              </ol>
            </div>

            <p className="text-xs text-ink-soft">
              Running a cycle-based venture (poultry, horticulture, cash crops)?
              Try the{" "}
              <Link
                href="/planners/hustle"
                className="underline hover:text-primary"
              >
                Cycle Venture Planner
              </Link>{" "}
              — it handles lump-sum payouts and protects next-cycle seed capital.
            </p>

            <ShareResultButton
              message={`🔄 *My Hustle Income Smoother*\n\n${validIncomes.length} months · Median: ${formatKES(result.stats.median)}\nSmoothed monthly salary: ${formatKES(result.monthlyDraw)}\nBuffer built: ${formatKES(Math.max(0, result.finalBuffer))} (${result.finalBufferMonths.toFixed(1)} months)${result.goesNegative ? `\n⚠️ Runs dry in month ${result.lowestBufferMonth} — needs ${formatKES(result.requiredStartingBuffer)} saved up front` : ""}\n\nSmooth yours → jipangefinance.org/tools/hustle-smoother`}
            />
          </div>
          <ExportCardButton containerRef={resultsRef} filename="hustle-smoother" />
          <CalculatorDisclaimer
            extraNotes={[
              "This tool uses median income as the basis for your salary draw. Your actual median will shift as your income changes — re-run the smoother every 3–6 months.",
              "The buffer calculation assumes surplus months fully replenish the fund before lean months draw from it. Irregular income timing may require a larger buffer than shown.",
            ]}
          />
          <ProductLinks products={MMF_LINKS.slice(0, 3)} heading="MMFs to route your income through" />
        </>
      )}
    </div>
  );
}
