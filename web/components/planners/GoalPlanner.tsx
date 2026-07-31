"use client";

import { useEffect, useMemo, useState } from "react";
import { formatKES } from "@/lib/budget";
import {
  buildMultiGoalPlan,
  type Feasibility,
  type GoalConfig,
  type PlanItemInput,
} from "@/lib/goal-planner";
import { buildGoalStrategy } from "@/lib/native-plan";
import { inflationAdjust } from "@/lib/projections";
import { getStoredCalculations, getStoredProfile, saveStoredGoal } from "@/lib/storage";
import type { GoalStrategy } from "@/lib/types";
import { useCountUp } from "@/hooks/useCountUp";
import NumberField from "@/components/tools/NumberField";
import ResultCard from "@/components/tools/ResultCard";
import ShareResultButton from "@/components/tools/ShareResultButton";

const FEASIBILITY_BADGE: Record<
  Exclude<Feasibility, "unknown">,
  { label: string; className: string }
> = {
  comfortable: { label: "Comfortably doable", className: "bg-success-soft text-success" },
  tight: { label: "Doable but tight", className: "bg-accent-wash text-accent-ink" },
  stretch: { label: "A real stretch", className: "bg-accent-wash text-accent-ink" },
  "beyond-reach": { label: "Beyond current capacity", className: "bg-danger-soft text-danger" },
};

const DEPOSIT_PERCENTAGES = [10, 15, 20, 30];
const COVER_MONTHS = [3, 6, 9, 12];
const RETIREMENT_INCOMES = [30_000, 50_000, 100_000, 150_000];
/**
 * Two numbers decide a retirement pot, and conflating them is how this page
 * went wrong twice in one day.
 *
 *   pot = (monthly spending NOW x REPLACEMENT) x 12 / WITHDRAWAL
 *
 * REPLACEMENT — how much of today's spending you still need once retired.
 * WITHDRAWAL  — how much of the pot you draw each year, after inflation.
 *
 * They pull in OPPOSITE directions, which is the trap. Lowering the withdrawal
 * rate makes the pot BIGGER (pot = income / rate), so "be more conservative
 * about returns" and "I need a smaller number" are not the same instruction.
 * The page first shipped 4% with no replacement at all — implicitly assuming a
 * retiree needs 100% of their working spending forever — and a first attempt at
 * fixing it cut the withdrawal rate to 2%, which doubled the target rather than
 * reducing it. Both are now explicit and both are adjustable, because the
 * honest answer is that the reader's own two judgements drive this, not ours.
 *
 * KENYAN DEFAULTS
 *
 * 50% replacement. Retirement spending falls everywhere, and the Western
 * literature's 70-80% replacement rules assume a mortgage that is gone, a
 * commute that has stopped and children who have left — which understates the
 * fall for a Kenyan household that also stops funding school fees, and
 * overstates it where extended-family obligation continues. 50% is the
 * operator's judgement for this market, sits below the Western band, and is a
 * SLIDER precisely because it is a judgement.
 *
 * 4% withdrawal. Held rather than lowered, now that replacement carries the
 * conservatism. Note what it makes this: a roughly 30-year DRAWDOWN, not an
 * income that never stops — a pot that never depletes needs 1 / real return,
 * which at a defensible Kenyan 2-3% real means 33-50x annual, not 25x. The
 * page says which it is, and lowering the slider toward 2% turns it back into
 * a perpetuity for a reader who wants that.
 *
 * See retirement-kenya.ts for the fuller model, which prices living costs and
 * medical as separate streams instead of applying any multiple at all.
 */
const REPLACEMENT_DEFAULT = 0.5;
const WITHDRAWAL_DEFAULT = 0.04;
const REPLACEMENT_CHOICES = [0.4, 0.5, 0.6, 0.8, 1];
const WITHDRAWAL_CHOICES = [0.02, 0.03, 0.04, 0.05];

/** The one place the arithmetic lives. */
function potFor(monthlyNow: number, replacement: number, withdrawal: number): number {
  return Math.round((monthlyNow * replacement * 12) / withdrawal);
}
const MAX_CHILDREN = 5;
const CHILD_TIMELINE_MAX = 18;

interface ChildGoal {
  /** Child's age today — drives the derived timeline when a stage is picked. */
  age: string;
  amount: string;
  years: string;
  stageLabel: string | null;
}

function formatYears(years: number): string {
  if (years < 1) return `${Math.max(1, Math.round(years * 12))} months`;
  const rounded = Math.round(years * 10) / 10;
  return `${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)} years`;
}

function chipClass(selected: boolean): string {
  return `inline-flex min-h-11 items-center justify-center rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${
    selected
      ? "border-accent bg-accent text-ink"
      : "border-border bg-white text-ink-soft hover:bg-canvas"
  }`;
}

export default function GoalPlanner({ config }: { config: GoalConfig }) {
  const isChildrenBuilder = config.builder === "children";
  const maxYears = config.maxYears ?? 25;

  // ── Generic target state (single-item goals) ──
  const [amount, setAmount] = useState("");
  const [years, setYears] = useState(String(config.defaultYears));

  // ── Builder-specific variables ──
  const [children, setChildren] = useState<ChildGoal[]>([
    { age: "", amount: "", years: "8", stageLabel: null },
  ]);
  const [expenses, setExpenses] = useState(""); // emergency: monthly expenses
  const [coverMonths, setCoverMonths] = useState(6); // emergency: months of cover
  const [price, setPrice] = useState(""); // home: property price
  const [depositPct, setDepositPct] = useState(20); // home: deposit %
  const [income, setIncome] = useState(""); // retirement: monthly spending TODAY
  const [replacement, setReplacement] = useState(REPLACEMENT_DEFAULT);
  const [withdrawal, setWithdrawal] = useState(WITHDRAWAL_DEFAULT);

  const [currentSavings, setCurrentSavings] = useState("");
  const [annualReturn, setAnnualReturn] = useState(config.defaultAnnualReturn * 100);
  const [capacity, setCapacity] = useState("");
  const [capacityFromProfile, setCapacityFromProfile] = useState(false);

  const [strategy, setStrategy] = useState<GoalStrategy | null>(null);
  const [goalSaved, setGoalSaved] = useState(false);

  // Prefill from the onboarding journey when it exists. One-time seed into
  // hand-editable fields — every value here can be typed over afterward, so
  // this doesn't fit useSyncExternalStore's continuous-mirror model.
  useEffect(() => {
    const stored = getStoredCalculations();
    if (stored && stored.savingsCapacity > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time prefill into hand-editable fields; see comment above
      setCapacity(String(Math.round(stored.savingsCapacity)));
      setCapacityFromProfile(true);
    }
    if (config.builder === "expenses-months" && stored) {
      // Their real spending: take-home minus what they can save.
      const spending = Math.round(stored.netMonthly - stored.savingsCapacity);
      if (spending > 0) setExpenses(String(spending));
    }
    if (config.retireAtAge !== undefined) {
      const profile = getStoredProfile();
      if (profile) {
        const derived = Math.min(maxYears, Math.max(1, config.retireAtAge - profile.age));
        setYears(String(derived));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Builders derive the target amount (still hand-editable afterwards) ──
  function applyEmergency(nextExpenses: string, nextMonths: number) {
    setExpenses(nextExpenses);
    setCoverMonths(nextMonths);
    const exp = Number(nextExpenses);
    if (exp > 0) setAmount(String(Math.round(exp * nextMonths)));
  }

  function applyHome(nextPrice: string, nextPct: number) {
    setPrice(nextPrice);
    setDepositPct(nextPct);
    const p = Number(nextPrice);
    if (p > 0) setAmount(String(Math.round((p * nextPct) / 100)));
  }

  function applyIncome(
    nextIncome: string,
    nextReplacement = replacement,
    nextWithdrawal = withdrawal
  ) {
    setIncome(nextIncome);
    setReplacement(nextReplacement);
    setWithdrawal(nextWithdrawal);
    const inc = Number(nextIncome);
    if (inc > 0) setAmount(String(potFor(inc, nextReplacement, nextWithdrawal)));
  }

  function updateChild(index: number, patch: Partial<ChildGoal>) {
    setChildren((prev) => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  }

  function stageStartAge(stageLabel: string | null): number | undefined {
    return config.amountPresets.find((p) => p.label === stageLabel)?.startAge;
  }

  /** Years until the stage's typical start age, clamped to the slider range. */
  function deriveChildYears(ageValue: string, startAge: number | undefined): string | null {
    const age = Number(ageValue);
    if (ageValue.trim() === "" || !Number.isFinite(age) || age < 0 || startAge === undefined) {
      return null;
    }
    return String(Math.min(CHILD_TIMELINE_MAX, Math.max(1, Math.round(startAge - age))));
  }

  function handleChildStage(index: number, preset: { label: string; amount: number; startAge?: number }) {
    const derived = deriveChildYears(children[index].age, preset.startAge);
    updateChild(index, {
      amount: String(preset.amount),
      stageLabel: preset.label,
      ...(derived !== null ? { years: derived } : {}),
    });
  }

  function handleChildAge(index: number, ageValue: string) {
    const derived = deriveChildYears(ageValue, stageStartAge(children[index].stageLabel));
    updateChild(index, {
      age: ageValue,
      ...(derived !== null ? { years: derived } : {}),
    });
  }

  const parsedAmount = Number(amount);
  const parsedYears = Number(years);
  // Clamp: a pasted/typed negative would inflate the required monthly and be
  // rejected by the strategy endpoint's schema.
  const parsedSavings = Math.max(0, Number(currentSavings) || 0);
  const parsedCapacity = Math.max(0, Number(capacity) || 0);

  const items: PlanItemInput[] = useMemo(() => {
    if (isChildrenBuilder) {
      return children
        .filter((c) => Number(c.amount) > 0 && Number(c.years) > 0)
        .map((c) => ({ todayValue: Number(c.amount), years: Number(c.years) }));
    }
    return parsedAmount > 0 && parsedYears > 0
      ? [{ todayValue: parsedAmount, years: parsedYears }]
      : [];
  }, [isChildrenBuilder, children, parsedAmount, parsedYears]);

  const multi = useMemo(() => {
    if (items.length === 0) return null;
    return buildMultiGoalPlan(items, {
      inflates: config.inflatesWithTime,
      currentSavings: parsedSavings,
      annualReturn: annualReturn / 100,
      monthlyCapacity: parsedCapacity > 0 ? parsedCapacity : undefined,
    });
  }, [items, config.inflatesWithTime, parsedSavings, annualReturn, parsedCapacity]);

  // The single-item view keeps the levers; multi-child totals don't have a
  // single meaningful lever, so they get a per-child breakdown instead.
  const singleItem = items.length === 1 && multi ? multi.items[0] : null;
  const displayYears = isChildrenBuilder && multi ? multi.maxYears : parsedYears;
  const nominalTarget = multi?.totalNominalTarget ?? 0;

  const animatedRequiredMonthly = useCountUp(multi ? multi.totalRequiredMonthly : null);

  // A strategy is grounded in the numbers it was generated for — clear it
  // when those numbers change so we never show advice for a different goal.
  // Bumping the sequence also invalidates any request still in flight. The
  // ref bump has to happen here (mutating a ref during render isn't safe —
  // a render can be discarded and retried without committing), and the
  // A shown strategy must not outlive the numbers it was computed from. With
  // generation synchronous there is no in-flight request to invalidate any
  // more — the reset is all that is left of the old sequencing machinery.
  const itemsKey = items.map((i) => `${i.todayValue}:${i.years}`).join("|");
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deliberate reset when the inputs change
    setStrategy(null);
    setGoalSaved(false);
  }, [itemsKey, parsedSavings, parsedCapacity]);

  function buildContext(): string | undefined {
    if (isChildrenBuilder && items.length > 0) {
      const parts = children
        .filter((c) => Number(c.amount) > 0)
        .map(
          (c, i) =>
            `child ${i + 1}: ${c.stageLabel ?? formatKES(Number(c.amount))} in ${c.years} yrs`
        );
      return `${parts.length} ${parts.length === 1 ? "child" : "children"} — ${parts.join("; ")}`.slice(0, 240);
    }
    if (config.builder === "expenses-months" && Number(expenses) > 0) {
      return `${coverMonths} months of cover × ${formatKES(Number(expenses))} monthly expenses`;
    }
    if (config.builder === "price-deposit" && Number(price) > 0) {
      return `${depositPct}% deposit on a ${formatKES(Number(price))} property`;
    }
    if (config.builder === "income" && Number(income) > 0) {
      return `target income ${formatKES(Number(income))}/month for life via the 4% rule`;
    }
    return undefined;
  }

  function handleSaveGoal() {
    if (!multi) return;
    const title = isChildrenBuilder
      ? `Education (${items.length} ${items.length === 1 ? "child" : "children"})`
      : config.title.replace(" Planner", "");
    saveStoredGoal({
      goalType: config.type,
      title,
      emoji: config.emoji,
      amountToday: items.reduce((sum, i) => sum + i.todayValue, 0),
      nominalTarget,
      years: displayYears,
      requiredMonthly: multi.totalRequiredMonthly,
      savedAt: new Date().toISOString(),
    });
    setGoalSaved(true);
  }

  /** Lever 1: adopt the timeline that fits saving the full capacity. */
  function applyTimeline() {
    if (singleItem?.yearsAtCapacity == null) return;
    setYears(String(Math.min(maxYears, Math.max(1, Math.ceil(singleItem.yearsAtCapacity)))));
  }

  /** Lever 2: adopt the target reachable by the original date. */
  function applyAmount() {
    if (singleItem?.amountAtCapacityByTargetDate == null) return;
    const reachableToday = config.inflatesWithTime
      ? inflationAdjust(singleItem.amountAtCapacityByTargetDate, parsedYears)
      : singleItem.amountAtCapacityByTargetDate;
    setAmount(String(Math.max(1000, Math.floor(reachableToday / 1000) * 1000)));
  }

  const canApplyTimeline =
    singleItem?.yearsAtCapacity != null && Math.ceil(singleItem.yearsAtCapacity) <= maxYears;

  /**
   * Computed on the device — no fetch, no request sequencing, no mid-flight
   * cancellation, because there is no flight. The strategy comes from the same
   * numbers the planner just showed the reader, through lib/native-plan.ts.
   */
  function fetchStrategy() {
    if (!multi) return;
    setStrategy(
      buildGoalStrategy({
        goalType: config.type,
        goalTitle: config.title,
        targetAmount: nominalTarget,
        years: displayYears,
        currentSavings: parsedSavings,
        requiredMonthly: multi.totalRequiredMonthly,
        feasibility: multi.feasibility,
        monthlyCapacity: parsedCapacity > 0 ? parsedCapacity : null,
        context: buildContext(),
      })
    );
  }

  const badge =
    multi && multi.feasibility !== "unknown" ? FEASIBILITY_BADGE[multi.feasibility] : null;

  return (
    <div className="space-y-6">
      {/* ── Inputs ── */}
      <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
        {/* Children builder (education) */}
        {isChildrenBuilder && (
          <div className="space-y-4">
            {children.map((child, index) => (
              <div key={index} className="rounded-xl border border-border p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-primary">Child {index + 1}</p>
                  {children.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setChildren((prev) => prev.filter((_, i) => i !== index))}
                      aria-label={`Remove child ${index + 1}`}
                      className="rounded-full border border-border px-2.5 py-1 text-xs text-faint hover:bg-canvas"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="mt-3">
                  <NumberField
                    id={`child-${index}-age`}
                    label="Child's age today (optional)"
                    value={child.age}
                    onChange={(v) => handleChildAge(index, v)}
                    placeholder="e.g. 7"
                    suffix="yrs"
                  />
                  <p className="mt-1 text-xs text-faint">
                    With an age, we work out when fees start for the stage you pick.
                  </p>
                </div>

                <p className="mt-3 text-sm font-medium text-ink-soft">
                  What are you saving for?
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {config.amountPresets.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => handleChildStage(index, preset)}
                      aria-pressed={child.stageLabel === preset.label}
                      className={chipClass(child.stageLabel === preset.label)}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <div className="mt-3">
                  <NumberField
                    id={`child-${index}-amount`}
                    label="Cost in today's prices"
                    value={child.amount}
                    onChange={(v) => updateChild(index, { amount: v, stageLabel: null })}
                    placeholder="e.g. 800000"
                    suffix="Ksh"
                  />
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor={`child-${index}-years`}
                      className="block text-sm font-medium text-ink-soft"
                    >
                      Fees start in
                    </label>
                    <span className="text-sm font-semibold text-primary">
                      {formatYears(Number(child.years) || 0)}
                    </span>
                  </div>
                  <input
                    id={`child-${index}-years`}
                    type="range"
                    min={1}
                    max={CHILD_TIMELINE_MAX}
                    value={child.years}
                    onChange={(event) => updateChild(index, { years: event.target.value })}
                    className="mt-2 h-11 w-full cursor-pointer accent-primary"
                  />
                  {child.age.trim() !== "" && stageStartAge(child.stageLabel) !== undefined && (
                    <p className="mt-1 text-xs text-faint">
                      ≈ when they turn {stageStartAge(child.stageLabel)} — nudge the slider if
                      their path differs.
                    </p>
                  )}
                </div>
              </div>
            ))}

            {children.length < MAX_CHILDREN && (
              <button
                type="button"
                onClick={() =>
                  setChildren((prev) => [...prev, { age: "", amount: "", years: "8", stageLabel: null }])
                }
                className="h-11 w-full rounded-xl border border-dashed border-border-strong text-sm font-medium text-ink-soft hover:bg-canvas"
              >
                + Add another child
              </button>
            )}
          </div>
        )}

        {/* Emergency builder: expenses × months of cover */}
        {config.builder === "expenses-months" && (
          <div className="space-y-3">
            <NumberField
              id="goal-expenses"
              label="Your monthly expenses"
              value={expenses}
              onChange={(v) => applyEmergency(v, coverMonths)}
              placeholder="e.g. 45000"
              suffix="Ksh/mo"
            />
            <div>
              <p className="text-sm font-medium text-ink-soft">Months of cover</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {COVER_MONTHS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => applyEmergency(expenses, m)}
                    aria-pressed={coverMonths === m}
                    className={chipClass(coverMonths === m)}
                  >
                    {m} months
                  </button>
                ))}
              </div>
              <p className="mt-1 text-xs text-faint">
                3 months is a start; 6 months is the standard cushion.
              </p>
            </div>
          </div>
        )}

        {/* Home builder: property price × deposit % */}
        {config.builder === "price-deposit" && (
          <div className="space-y-3">
            <NumberField
              id="goal-price"
              label="Property or plot price"
              value={price}
              onChange={(v) => applyHome(v, depositPct)}
              placeholder="e.g. 8000000"
              suffix="Ksh"
            />
            <div>
              <p className="text-sm font-medium text-ink-soft">Deposit</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {DEPOSIT_PERCENTAGES.map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => applyHome(price, pct)}
                    aria-pressed={depositPct === pct}
                    className={chipClass(depositPct === pct)}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
              <p className="mt-1 text-xs text-faint">
                Kenyan lenders typically ask for 10-20% down; a bigger deposit means smaller
                repayments.
              </p>
            </div>
          </div>
        )}

        {/* Retirement builder: desired monthly income → pot via the 4% rule */}
        {config.builder === "income" && (
          <div className="space-y-3">
            <NumberField
              id="goal-income"
              label="What you spend a month now (today's money)"
              value={income}
              onChange={(v) => applyIncome(v)}
              placeholder="e.g. 50000"
              suffix="Ksh/mo"
            />
            <div className="flex flex-wrap gap-2">
              {RETIREMENT_INCOMES.map((inc) => (
                <button
                  key={inc}
                  type="button"
                  onClick={() => applyIncome(String(inc))}
                  aria-pressed={income === String(inc)}
                  className={chipClass(income === String(inc))}
                >
                  {formatKES(inc)}/mo
                </button>
              ))}
            </div>

            <div className="mt-4">
              <p className="block text-sm font-medium text-ink-soft">
                How much of that will you still need once retired?
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {REPLACEMENT_CHOICES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => applyIncome(income, r, withdrawal)}
                    aria-pressed={replacement === r}
                    className={chipClass(replacement === r)}
                  >
                    {Math.round(r * 100)}%
                  </button>
                ))}
              </div>
              <p className="mt-1 text-xs text-faint">
                Most spending falls: no commute, no school fees, usually no mortgage. Medical
                goes the other way. 50% is our read for Kenya — move it if yours differs.
              </p>
            </div>

            <div className="mt-4">
              <p className="block text-sm font-medium text-ink-soft">
                How much of the pot will you draw a year, after inflation?
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {WITHDRAWAL_CHOICES.map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => applyIncome(income, replacement, w)}
                    aria-pressed={withdrawal === w}
                    className={chipClass(withdrawal === w)}
                  >
                    {Math.round(w * 100)}%
                  </button>
                ))}
              </div>
              <p className="mt-1 text-xs text-faint">
                A lower rate needs a <strong>bigger</strong> pot, not a smaller one — it is the
                slice you live on, so a thinner slice means a larger cake. At 4% the pot lasts
                roughly 30 years; at 2–3% it need never run out, which is what Kenyan real
                yields of 2–3% can support once today&apos;s unusually high rates normalise.
              </p>
            </div>

            <p className="mt-3 rounded-xl bg-canvas p-3 text-xs text-ink-soft">
              {formatKES(Number(income) || 0)}/mo now × {Math.round(replacement * 100)}% ={" "}
              <strong>{formatKES(Math.round((Number(income) || 0) * replacement))}/mo</strong> in
              retirement, drawn at {Math.round(withdrawal * 100)}% a year →{" "}
              <strong>
                {formatKES(potFor(Number(income) || 0, replacement, withdrawal))}
              </strong>
              . An estimate, not a promise.
            </p>
          </div>
        )}

        {/* Plain presets (business) */}
        {config.builder === "presets" && (
          <div>
            <p className="block text-sm font-medium text-ink-soft">How much do you need?</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {config.amountPresets.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setAmount(String(preset.amount))}
                  aria-pressed={amount === String(preset.amount)}
                  className={chipClass(amount === String(preset.amount))}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Target amount — hidden for the children builder (per-child costs). */}
        {!isChildrenBuilder && (
          <NumberField
            id="goal-amount"
            label={
              config.builder === "presets"
                ? "Target amount"
                : `Target amount${config.inflatesWithTime ? " (today's prices)" : ""} — auto-calculated, edit freely`
            }
            value={amount}
            onChange={(v) => setAmount(v)}
            placeholder="e.g. 800000"
            suffix="Ksh"
          />
        )}

        {/* Timeline — per-child for education, global otherwise. */}
        {!isChildrenBuilder && (
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="goal-years" className="block text-sm font-medium text-ink-soft">
                When do you need it?
              </label>
              <span className="text-sm font-semibold text-primary">
                {formatYears(Number(years) || 0)}
              </span>
            </div>
            <input
              id="goal-years"
              type="range"
              min={1}
              max={maxYears}
              value={years}
              onChange={(event) => setYears(event.target.value)}
              className="mt-2 h-11 w-full cursor-pointer accent-primary"
            />
          </div>
        )}

        <NumberField
          id="goal-current-savings"
          label={
            isChildrenBuilder
              ? "Already saved toward education, all children (optional)"
              : "Already saved toward this goal (optional)"
          }
          value={currentSavings}
          onChange={(v) => setCurrentSavings(v)}
          placeholder="0"
          suffix="Ksh"
        />

        <div>
          <NumberField
            id="goal-capacity"
            label="Your monthly savings capacity (optional)"
            value={capacity}
            onChange={(v) => {
              setCapacity(v);
              setCapacityFromProfile(false);
            }}
            placeholder="e.g. 15000"
            suffix="Ksh/mo"
          />
          {capacityFromProfile && (
            <p className="mt-1 text-xs text-faint">
              Pre-filled from your Pesa Picture — edit if it&apos;s changed.
            </p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="goal-return" className="block text-sm font-medium text-ink-soft">
              Assumed annual return
            </label>
            <span className="text-sm font-semibold text-primary">
              {annualReturn.toFixed(0)}%
            </span>
          </div>
          <input
            id="goal-return"
            type="range"
            min={0}
            max={16}
            value={annualReturn}
            onChange={(event) => setAnnualReturn(Number(event.target.value))}
            className="mt-2 h-11 w-full cursor-pointer accent-primary"
          />
          <p className="mt-1 text-xs text-faint">
            An assumption, not a promise — bank savings sit low, money market funds and SACCO
            deposits typically higher. Check current rates before you commit.
          </p>
        </div>
      </div>

      {/* ── Results ── */}
      {multi && (
        <div className="space-y-4">
          {config.inflatesWithTime && nominalTarget > 0 && (
            <div className="grid grid-cols-2 gap-3">
              <ResultCard
                label="You'll need (future cash)"
                value={formatKES(nominalTarget)}
                sublabel={`In ${formatYears(displayYears)}, at ~6.5% inflation`}
              />
              <ResultCard
                label="Same buying power today"
                value={formatKES(items.reduce((sum, item) => sum + item.todayValue, 0))}
                tone="warning"
              />
            </div>
          )}
          {config.inflatesWithTime && !isChildrenBuilder && nominalTarget > parsedAmount * 1.01 && (
            <p className="text-xs text-ink-soft">
              {formatKES(parsedAmount)} today will cost about{" "}
              <span className="font-semibold">{formatKES(nominalTarget)}</span> in{" "}
              {formatYears(parsedYears)} — the gap is why your monthly saving rate has to rise
              faster than a flat plan would suggest.
            </p>
          )}
          {config.inflatesWithTime && isChildrenBuilder && (
            <p className="text-xs text-ink-soft">
              School costs inflate ~6.5% a year — each child&apos;s target above is already
              planned at the price it will actually be when their fees start.
            </p>
          )}

          <ResultCard
            label={
              isChildrenBuilder && items.length > 1
                ? `Save this every month (all ${items.length} children)`
                : `Save this every month for ${formatYears(displayYears)}`
            }
            value={`${formatKES(animatedRequiredMonthly)}/mo`}
            sublabel={
              multi.totalRequiredMonthly === 0
                ? "Your current savings already cover this goal. Well done!"
                : undefined
            }
            tone={
              multi.feasibility === "beyond-reach"
                ? "danger"
                : multi.feasibility === "comfortable" || multi.feasibility === "unknown"
                  ? "success"
                  : "warning"
            }
          />

          {/* Per-child breakdown */}
          {isChildrenBuilder && items.length > 1 && (
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-primary">Per child</h3>
              <ul className="mt-2 space-y-2 text-sm">
                {multi.items.map((item, i) => {
                  const child = children.filter(
                    (c) => Number(c.amount) > 0 && Number(c.years) > 0
                  )[i];
                  return (
                    <li key={i} className="flex items-center justify-between gap-2">
                      <span className="min-w-0 truncate text-ink-soft">
                        Child {i + 1}
                        {child?.stageLabel ? ` — ${child.stageLabel}` : ""} · in{" "}
                        {formatYears(item.years)}
                      </span>
                      <span className="shrink-0 font-semibold text-primary">
                        {formatKES(item.requiredMonthly)}/mo
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {badge && multi.capacityShare !== null && (
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}
                >
                  {badge.label}
                </span>
                <span className="text-xs text-ink-soft">
                  {Math.round(multi.capacityShare * 100)}% of your capacity
                </span>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-canvas">
                <div
                  className={`h-full rounded-full ${
                    multi.feasibility === "beyond-reach" ? "bg-danger" : "bg-success"
                  }`}
                  style={{ width: `${Math.min(100, multi.capacityShare * 100)}%` }}
                />
              </div>

              {multi.feasibility === "beyond-reach" && singleItem && (
                <div className="mt-4 space-y-3 text-sm text-ink-soft">
                  <p className="font-medium text-primary">
                    The goal doesn&apos;t fit the timeline — but you have two levers:
                  </p>
                  {singleItem.yearsAtCapacity !== null && (
                    <div className="flex items-start justify-between gap-3">
                      <p>
                        🕐 <span className="font-medium">Extend the timeline:</span> saving your
                        full {formatKES(parsedCapacity)}/mo, you reach it in{" "}
                        <span className="font-semibold">
                          {formatYears(singleItem.yearsAtCapacity)}
                        </span>
                        .
                      </p>
                      {canApplyTimeline && (
                        <button
                          type="button"
                          onClick={applyTimeline}
                          className="shrink-0 rounded-full border border-primary px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary hover:text-white"
                        >
                          Use it
                        </button>
                      )}
                    </div>
                  )}
                  {singleItem.amountAtCapacityByTargetDate !== null && (
                    <div className="flex items-start justify-between gap-3">
                      <p>
                        🎯 <span className="font-medium">Shrink the target:</span> by your
                        original date you&apos;d have{" "}
                        <span className="font-semibold">
                          {formatKES(singleItem.amountAtCapacityByTargetDate)}
                        </span>{" "}
                        —{" "}
                        {Math.round(
                          (singleItem.amountAtCapacityByTargetDate / nominalTarget) * 100
                        )}
                        % of the goal.
                      </p>
                      <button
                        type="button"
                        onClick={applyAmount}
                        className="shrink-0 rounded-full border border-primary px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary hover:text-white"
                      >
                        Use it
                      </button>
                    </div>
                  )}
                </div>
              )}

              {multi.feasibility === "beyond-reach" && !singleItem && (
                <p className="mt-4 text-sm text-ink-soft">
                  The combined amount doesn&apos;t fit your capacity. Try extending a
                  child&apos;s timeline, choosing a more affordable stage, or building the fund
                  one child at a time — the breakdown above shows where each shilling goes.
                </p>
              )}
            </div>
          )}

          {/* ── AI strategy ── */}
          <div aria-live="polite">
          {!strategy && (
            <button
              type="button"
              onClick={fetchStrategy}
              className="h-12 w-full rounded-full bg-primary text-base font-medium text-white transition-colors hover:bg-primary-deep"
            >
              Where should this money live? Get my strategy →
            </button>
          )}

          {strategy && (
            <div className="space-y-4">
              <div className="rounded-2xl border-2 border-accent bg-accent-soft p-5">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-accent-ink">
                  Recommended home for this money
                </h3>
                <p className="mt-1 text-lg font-semibold text-primary">{strategy.vehicle}</p>
                <p className="mt-1 text-sm text-ink-soft">{strategy.why}</p>
              </div>

              {strategy.steps.map((step) => (
                <div key={step.step} className="rounded-2xl bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-sm font-semibold text-ink">
                      {step.step}
                    </span>
                    <h3 className="text-base font-semibold text-primary">{step.title}</h3>
                  </div>
                  <p className="mt-2 text-sm text-ink-soft">{step.description}</p>
                </div>
              ))}

              <div className="rounded-2xl bg-danger-soft p-5">
                <h3 className="text-sm font-semibold text-danger">⚠️ Watch out</h3>
                <p className="mt-1 text-sm text-ink-soft">{strategy.watchOut}</p>
              </div>

              <button
                type="button"
                onClick={() => void fetchStrategy()}
                className="h-11 w-full rounded-full border border-border text-sm font-medium text-ink-soft"
              >
                Try a different strategy
              </button>
            </div>
          )}
          </div>

          {multi.totalRequiredMonthly > 0 && (
            <>
              <button
                type="button"
                onClick={handleSaveGoal}
                disabled={goalSaved}
                className={`h-11 w-full rounded-full text-sm font-medium transition-colors ${
                  goalSaved
                    ? "bg-success-soft text-success"
                    : "border border-primary text-primary hover:bg-primary hover:text-white"
                }`}
              >
                {goalSaved ? "✓ Saved — see it on your Pesa Picture" : "Save this goal to my plan"}
              </button>
              <ShareResultButton
                message={`${config.emoji} *My JiPange ${config.title.replace(" Planner", "")} Goal*\n\nTarget: ${formatKES(nominalTarget)} in ${formatYears(displayYears)}${buildContext() ? `\n(${buildContext()})` : ""}\nMonthly saving needed: ${formatKES(multi.totalRequiredMonthly)}${strategy ? `\nWhere it lives: ${strategy.vehicle}` : ""}\n\nPlan yours → jipangefinance.org/planners`}
              />
            </>
          )}
        </div>
      )}

      <p className="text-xs text-ink-soft">
        For guidance only, not financial advice. Projections use your assumed return compounded
        monthly{config.inflatesWithTime ? " and ~6.5% annual inflation (Kenya CPI average)" : ""};
        actual returns vary. Verify product terms and current rates with the institution before
        committing money.
      </p>
    </div>
  );
}
