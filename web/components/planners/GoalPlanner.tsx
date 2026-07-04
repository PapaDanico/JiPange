"use client";

import { useEffect, useMemo, useState } from "react";
import { formatKES } from "@/lib/budget";
import {
  buildGoalPlan,
  type Feasibility,
  type GoalConfig,
} from "@/lib/goal-planner";
import { inflateToFutureCost } from "@/lib/projections";
import { getStoredCalculations } from "@/lib/storage";
import type { GoalStrategy } from "@/lib/types";
import NumberField from "@/components/tools/NumberField";
import ResultCard from "@/components/tools/ResultCard";

const FEASIBILITY_BADGE: Record<
  Exclude<Feasibility, "unknown">,
  { label: string; className: string }
> = {
  comfortable: { label: "Comfortably doable", className: "bg-[#E9F5EC] text-success" },
  tight: { label: "Doable but tight", className: "bg-[#FFF4DC] text-[#946213]" },
  stretch: { label: "A real stretch", className: "bg-[#FFF4DC] text-[#946213]" },
  "beyond-reach": { label: "Beyond current capacity", className: "bg-[#FBEAEA] text-danger" },
};

function formatYears(years: number): string {
  if (years < 1) return `${Math.max(1, Math.round(years * 12))} months`;
  const rounded = Math.round(years * 10) / 10;
  return `${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)} years`;
}

export default function GoalPlanner({ config }: { config: GoalConfig }) {
  const [amount, setAmount] = useState("");
  const [years, setYears] = useState(String(config.defaultYears));
  const [currentSavings, setCurrentSavings] = useState("");
  const [annualReturn, setAnnualReturn] = useState(config.defaultAnnualReturn * 100);
  const [capacity, setCapacity] = useState("");
  const [capacityFromProfile, setCapacityFromProfile] = useState(false);

  const [strategy, setStrategy] = useState<GoalStrategy | null>(null);
  const [strategyLoading, setStrategyLoading] = useState(false);
  const [strategyError, setStrategyError] = useState<string | null>(null);

  // Prefill capacity from the onboarding journey when it exists.
  useEffect(() => {
    const stored = getStoredCalculations();
    if (stored && stored.savingsCapacity > 0) {
      setCapacity(String(Math.round(stored.savingsCapacity)));
      setCapacityFromProfile(true);
    }
  }, []);

  const parsedAmount = Number(amount);
  const parsedYears = Number(years);
  const parsedSavings = Number(currentSavings) || 0;
  const parsedCapacity = Number(capacity) || 0;
  const hasValidInputs = parsedAmount > 0 && parsedYears > 0;

  // For goals quoted in today's prices (school fees, home prices), the real
  // target is the inflated future cost — that's the reverse-engineering step
  // most planning tools skip.
  const nominalTarget =
    hasValidInputs && config.inflatesWithTime
      ? inflateToFutureCost(parsedAmount, parsedYears)
      : parsedAmount;

  const plan = useMemo(() => {
    if (!hasValidInputs) return null;
    return buildGoalPlan({
      targetAmount: nominalTarget,
      years: parsedYears,
      currentSavings: parsedSavings,
      annualReturn: annualReturn / 100,
      monthlyCapacity: parsedCapacity > 0 ? parsedCapacity : undefined,
    });
  }, [hasValidInputs, nominalTarget, parsedYears, parsedSavings, annualReturn, parsedCapacity]);

  async function fetchStrategy() {
    if (!plan || !hasValidInputs) return;
    setStrategyLoading(true);
    setStrategyError(null);
    try {
      const response = await fetch("/api/goal-strategy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goalType: config.type,
          goalTitle: config.title,
          targetAmount: nominalTarget,
          years: parsedYears,
          currentSavings: parsedSavings,
          requiredMonthly: plan.requiredMonthly,
          feasibility: plan.feasibility,
          monthlyCapacity: parsedCapacity > 0 ? parsedCapacity : null,
        }),
      });

      if (!response.ok) {
        const responseBody = await response.json().catch(() => null);
        throw new Error(responseBody?.error ?? "Something went wrong");
      }

      const data = await response.json();
      setStrategy(data.strategy);
    } catch (err) {
      setStrategyError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setStrategyLoading(false);
    }
  }

  const badge = plan && plan.feasibility !== "unknown" ? FEASIBILITY_BADGE[plan.feasibility] : null;

  return (
    <div className="space-y-6">
      {/* ── Inputs ── */}
      <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
        <div>
          <p className="block text-sm font-medium text-[#4B4238]">
            How much do you need{config.inflatesWithTime ? " (in today's prices)" : ""}?
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {config.amountPresets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => setAmount(String(preset.amount))}
                aria-pressed={amount === String(preset.amount)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  amount === String(preset.amount)
                    ? "border-accent bg-accent text-[#171717]"
                    : "border-[#E5E0D8] bg-white text-[#4B4238] hover:bg-[#F1ECE3]"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <div className="mt-3">
            <NumberField
              id="goal-amount"
              label="Target amount"
              value={amount}
              onChange={(v) => setAmount(v)}
              placeholder="e.g. 800000"
              suffix="KES"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="goal-years" className="block text-sm font-medium text-[#4B4238]">
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
            max={25}
            value={years}
            onChange={(event) => setYears(event.target.value)}
            className="mt-2 h-2 w-full accent-primary"
          />
        </div>

        <NumberField
          id="goal-current-savings"
          label="Already saved toward this goal (optional)"
          value={currentSavings}
          onChange={(v) => setCurrentSavings(v)}
          placeholder="0"
          suffix="KES"
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
            suffix="KES/mo"
          />
          {capacityFromProfile && (
            <p className="mt-1 text-xs text-[#6f6e69]">
              Pre-filled from your Pesa Picture — edit if it&apos;s changed.
            </p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="goal-return" className="block text-sm font-medium text-[#4B4238]">
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
            className="mt-2 h-2 w-full accent-primary"
          />
          <p className="mt-1 text-xs text-[#6f6e69]">
            An assumption, not a promise — bank savings sit low, money market funds and SACCO
            deposits typically higher. Check current rates before you commit.
          </p>
        </div>
      </div>

      {/* ── Results ── */}
      {plan && hasValidInputs && (
        <div className="space-y-4">
          {config.inflatesWithTime && nominalTarget > parsedAmount * 1.01 && (
            <p className="text-xs text-[#4B4238]">
              {formatKES(parsedAmount)} today will cost about{" "}
              <span className="font-semibold">{formatKES(nominalTarget)}</span> in{" "}
              {formatYears(parsedYears)} at ~6.5% inflation — we plan against the real future
              cost.
            </p>
          )}

          <ResultCard
            label={`Save this every month for ${formatYears(parsedYears)}`}
            value={`${formatKES(plan.requiredMonthly)}/mo`}
            sublabel={
              plan.requiredMonthly === 0
                ? "Your current savings already cover this goal. Well done!"
                : undefined
            }
            tone={
              plan.feasibility === "beyond-reach"
                ? "danger"
                : plan.feasibility === "comfortable" || plan.feasibility === "unknown"
                  ? "success"
                  : "warning"
            }
          />

          {badge && plan.capacityShare !== null && (
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}
                >
                  {badge.label}
                </span>
                <span className="text-xs text-[#4B4238]">
                  {Math.round(plan.capacityShare * 100)}% of your capacity
                </span>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#F1ECE3]">
                <div
                  className={`h-full rounded-full ${
                    plan.feasibility === "beyond-reach" ? "bg-danger" : "bg-success"
                  }`}
                  style={{ width: `${Math.min(100, plan.capacityShare * 100)}%` }}
                />
              </div>

              {plan.feasibility === "beyond-reach" && (
                <div className="mt-4 space-y-2 text-sm text-[#4B4238]">
                  <p className="font-medium text-primary">
                    The goal doesn&apos;t fit the timeline — but you have two levers:
                  </p>
                  {plan.yearsAtCapacity !== null && (
                    <p>
                      🕐 <span className="font-medium">Extend the timeline:</span> saving your
                      full {formatKES(parsedCapacity)}/mo, you reach it in{" "}
                      <span className="font-semibold">{formatYears(plan.yearsAtCapacity)}</span>.
                    </p>
                  )}
                  {plan.amountAtCapacityByTargetDate !== null && (
                    <p>
                      🎯 <span className="font-medium">Shrink the target:</span> by your original
                      date you&apos;d have{" "}
                      <span className="font-semibold">
                        {formatKES(plan.amountAtCapacityByTargetDate)}
                      </span>{" "}
                      — {Math.round((plan.amountAtCapacityByTargetDate / nominalTarget) * 100)}%
                      of the goal.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── AI strategy ── */}
          {!strategy && !strategyLoading && (
            <button
              type="button"
              onClick={() => void fetchStrategy()}
              className="h-12 w-full rounded-full bg-primary text-base font-medium text-white transition-colors hover:bg-[#584a3e]"
            >
              Where should this money live? Get my strategy →
            </button>
          )}

          {strategyLoading && (
            <div className="space-y-3">
              <p className="text-center text-sm text-[#4B4238]">
                JiPange is thinking about your goal...
              </p>
              <div className="h-40 animate-pulse rounded-2xl bg-[#F1ECE3]" />
            </div>
          )}

          {strategyError && !strategyLoading && (
            <div className="rounded-2xl bg-[#FBEAEA] p-5 text-center">
              <p className="text-sm text-danger">{strategyError}</p>
              <button
                type="button"
                onClick={() => void fetchStrategy()}
                className="mt-3 h-10 rounded-full bg-primary px-4 text-sm font-medium text-white"
              >
                Try again
              </button>
            </div>
          )}

          {strategy && !strategyLoading && (
            <div className="space-y-4">
              <div className="rounded-2xl border-2 border-accent bg-[#FFF8EA] p-5">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-[#946213]">
                  Recommended home for this money
                </h3>
                <p className="mt-1 text-lg font-semibold text-primary">{strategy.vehicle}</p>
                <p className="mt-1 text-sm text-[#4B4238]">{strategy.why}</p>
              </div>

              {strategy.steps.map((step) => (
                <div key={step.step} className="rounded-2xl bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-sm font-semibold text-[#171717]">
                      {step.step}
                    </span>
                    <h3 className="text-base font-semibold text-primary">{step.title}</h3>
                  </div>
                  <p className="mt-2 text-sm text-[#4B4238]">{step.description}</p>
                </div>
              ))}

              <div className="rounded-2xl bg-[#FBEAEA] p-5">
                <h3 className="text-sm font-semibold text-danger">⚠️ Watch out</h3>
                <p className="mt-1 text-sm text-[#4B4238]">{strategy.watchOut}</p>
              </div>

              <button
                type="button"
                onClick={() => void fetchStrategy()}
                className="h-10 w-full rounded-full border border-[#E5E0D8] text-sm font-medium text-[#4B4238]"
              >
                Try a different strategy
              </button>
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-[#4B4238]">
        For guidance only, not financial advice. Projections use your assumed return compounded
        monthly{config.inflatesWithTime ? " and ~6.5% annual inflation (Kenya CPI average)" : ""};
        actual returns vary. Verify product terms and current rates with the institution before
        committing money.
      </p>
    </div>
  );
}
