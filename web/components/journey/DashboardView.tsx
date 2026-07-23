"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ASSUMED_CURRENT_YIELD,
  CURRENT_INFLATION,
  TARGET_MMF_YIELD,
  mapJourney,
  type DashboardModel,
} from "@/lib/journey";
import { FULIZA_DAILY_RATE } from "@/lib/fuliza";
import { getStoredJourneyAnswers } from "@/lib/storage";
import { useStorageValue } from "@/lib/hooks";
import { formatKES as kes } from "@/lib/budget";
import DebtFreedomTracker from "./DebtFreedomTracker";
import FulizaTaxCounter from "./FulizaTaxCounter";
import InflationDragCard from "./InflationDragCard";
import YieldMatchmaker from "./YieldMatchmaker";

/**
 * The tailored action dashboard. Recomputes the model from stored answers
 * with the same pure engine the API uses — nothing is persisted server-side.
 */
const pctOf = (rate: number) => `${parseFloat((rate * 100).toFixed(2))}%`;

/** Analyst mode: the constants and rule outcomes behind every card, in the open. */
function AnalystCard({ model }: { model: DashboardModel }) {
  const rows: [string, string][] = [
    ["Engine theme", model.theme === "recovery" ? "Recovery (Rule A: expensive-debt intercept)" : "Growth"],
    ["Matched vehicle (Rule C)", model.match.name],
  ];
  if (model.fulizaTax) {
    rows.push(
      ["Est. Fuliza outstanding (income-bracket table)", kes(model.fulizaTax.estOutstanding)],
      ["Daily fee rate", `${parseFloat((FULIZA_DAILY_RATE * 100).toFixed(3))}%/day → ${kes(model.fulizaTax.dailyFee)}/day`],
      ["Est. monthly cost (~20 borrowed days)", kes(model.fulizaTax.estMonthlyCost)],
      ["Annualised", kes(model.fulizaTax.estAnnualCost)]
    );
  }
  if (model.inflationDrag) {
    rows.push(
      ["Median savings for your bracket", kes(model.inflationDrag.medianSavings)],
      [
        "Bank yield vs inflation",
        `${pctOf(ASSUMED_CURRENT_YIELD)} vs ${pctOf(CURRENT_INFLATION)} → −${kes(model.inflationDrag.netLossAnnual)}/yr real`,
      ],
      [
        "MMF baseline upside",
        `${pctOf(TARGET_MMF_YIELD)} (+${model.inflationDrag.upsidePoints} pts) → +${kes(model.inflationDrag.mmfExtraAnnual)}/yr`,
      ]
    );
  }
  if (model.suppressedNote) rows.push(["Suppressed vehicles", model.suppressedNote]);

  return (
    <div
      data-testid="analyst-card"
      className="rounded-2xl border border-dashed border-border-strong bg-white p-5"
    >
      <h2 className="text-sm font-semibold text-primary">📊 Under the hood</h2>
      <p className="mt-1 text-xs text-faint">
        Every figure above comes from these documented assumptions — no black box.
      </p>
      <dl className="mt-3 space-y-2">
        {rows.map(([term, value]) => (
          <div key={term} className="flex items-baseline justify-between gap-4 text-xs">
            <dt className="text-ink-soft">{term}</dt>
            <dd className="text-right font-medium text-primary">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default function DashboardView() {
  const [analytical, setAnalytical] = useState(false);
  const answers = useStorageValue(getStoredJourneyAnswers, () => null);
  const model = useMemo<DashboardModel | null>(
    () => (answers ? mapJourney(answers) : null),
    [answers]
  );

  // No answers yet: invite, don't shove — and keep every explore path open.
  if (!model) {
    return (
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 text-center shadow-sm">
        <p className="text-2xl" aria-hidden="true">
          📊
        </p>
        <h2 className="mt-2 text-lg font-semibold text-primary">
          Your dashboard is five taps away
        </h2>
        <p className="mt-1 text-sm text-ink-soft">
          Answer five quick questions — anonymous, no typing — and we&apos;ll map your money to
          the right Kenyan vehicles.
        </p>
        <Link
          href="/profile"
          className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-accent px-6 text-sm font-medium text-ink transition-colors hover:bg-accent-deep"
        >
          Start the 90-second check →
        </Link>
        <p className="mt-4 text-xs text-faint">
          Or explore freely:{" "}
          <Link href="/tools" className="font-medium text-primary underline">
            calculators
          </Link>{" "}
          ·{" "}
          <Link href="/planners" className="font-medium text-primary underline">
            goal planners
          </Link>
        </p>
      </div>
    );
  }

  const recovery = model.theme === "recovery";

  return (
    <div className="w-full max-w-2xl space-y-6">
      {/* Simple ↔ analytical view switch */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setAnalytical((v) => !v)}
          aria-pressed={analytical}
          data-testid="analyst-toggle"
          className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${
            analytical
              ? "border-primary bg-primary text-white"
              : "border-border bg-white text-ink-soft hover:bg-canvas"
          }`}
        >
          📊 Analyst mode {analytical ? "on" : "off"}
        </button>
      </div>

      {/* Priority banner */}
      <div
        className={`rounded-2xl p-5 ${
          recovery ? "bg-primary text-white" : "border-2 border-success bg-success-soft"
        }`}
      >
        <p
          className={`text-xs font-semibold uppercase tracking-wide ${
            recovery ? "text-accent" : "text-success"
          }`}
        >
          {recovery ? "Recovery mode — priority 1" : "Priority 1"}
        </p>
        <h1 className={`mt-1 text-xl font-semibold ${recovery ? "text-white" : "text-primary"}`}>
          {model.priority1}
        </h1>
        {recovery && model.microFundTarget !== null && (
          <p className="mt-2 text-sm text-canvas">
            First target: a{" "}
            <span className="font-semibold text-white">
              KSh {model.microFundTarget.toLocaleString("en-KE")}
            </span>{" "}
            micro-emergency fund, so the next surprise doesn&apos;t land on the overdraft.
          </p>
        )}
      </div>

      {recovery && model.fulizaTax && <FulizaTaxCounter fulizaTax={model.fulizaTax} />}
      {recovery && model.fulizaTax && model.microFundTarget !== null && (
        <DebtFreedomTracker
          fulizaTax={model.fulizaTax}
          microFundTarget={model.microFundTarget}
        />
      )}

      {analytical && <AnalystCard model={model} />}

      {model.inflationDrag && <InflationDragCard drag={model.inflationDrag} />}

      <YieldMatchmaker
        match={model.match}
        alternatives={model.alternatives}
        suppressedNote={model.suppressedNote}
      />

      {/* The upgrade path: shilling-exact numbers via the deep profile. */}
      <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
        <p className="text-sm font-medium text-primary">Want shilling-exact numbers?</p>
        <p className="mt-1 text-xs text-ink-soft">
          Take the 90-second deep profile for your precise take-home pay, budget split, and an
          AI action plan built on real KRA tax maths.
        </p>
        <Link
          href="/profile/full"
          className="mt-3 inline-flex h-10 items-center justify-center rounded-full bg-accent px-5 text-sm font-medium text-ink transition-colors hover:bg-accent-deep"
        >
          Build my full Pesa Picture →
        </Link>
      </div>

      <div className="flex items-center justify-center gap-4 text-xs">
        <Link href="/picture" className="font-medium text-primary underline">
          My Pesa Picture
        </Link>
        <span aria-hidden="true" className="text-border-strong">
          ·
        </span>
        <Link href="/profile" className="font-medium text-primary underline">
          Retake the quiz
        </Link>
        <span aria-hidden="true" className="text-border-strong">
          ·
        </span>
        <Link href="/planners" className="font-medium text-primary underline">
          Plan a specific goal
        </Link>
      </div>

      <p className="text-xs text-ink-soft">
        Estimates use documented tier assumptions and quoted market baselines — verify current
        rates with any institution before moving money. For guidance only, not financial advice.
      </p>
    </div>
  );
}
