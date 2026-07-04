"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { mapJourney, type DashboardModel } from "@/lib/journey";
import { getStoredJourneyAnswers } from "@/lib/storage";
import DebtFreedomTracker from "./DebtFreedomTracker";
import FulizaTaxCounter from "./FulizaTaxCounter";
import InflationDragCard from "./InflationDragCard";
import YieldMatchmaker from "./YieldMatchmaker";

/**
 * The tailored action dashboard. Recomputes the model from stored answers
 * with the same pure engine the API uses — nothing is persisted server-side.
 */
export default function DashboardView() {
  const [model, setModel] = useState<DashboardModel | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const answers = getStoredJourneyAnswers();
    if (answers) setModel(mapJourney(answers));
    setChecked(true);
  }, []);

  if (!checked) {
    return <p className="text-center text-[#4B4238]">Building your dashboard...</p>;
  }

  // No answers yet: invite, don't shove — and keep every explore path open.
  if (!model) {
    return (
      <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-sm">
        <p className="text-2xl" aria-hidden="true">
          📊
        </p>
        <h2 className="mt-2 text-lg font-semibold text-primary">
          Your dashboard is five taps away
        </h2>
        <p className="mt-1 text-sm text-[#4B4238]">
          Answer five quick questions — anonymous, no typing — and we&apos;ll map your money to
          the right Kenyan vehicles.
        </p>
        <Link
          href="/profile"
          className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-accent px-6 text-sm font-medium text-[#171717] transition-colors hover:bg-[#d6961f]"
        >
          Start the 90-second check →
        </Link>
        <p className="mt-4 text-xs text-[#6f6e69]">
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
    <div className="w-full max-w-md space-y-6">
      {/* Priority banner */}
      <div
        className={`rounded-2xl p-5 ${
          recovery ? "bg-primary text-white" : "border-2 border-success bg-[#E9F5EC]"
        }`}
      >
        <p
          className={`text-xs font-semibold uppercase tracking-wide ${
            recovery ? "text-[#E8A838]" : "text-success"
          }`}
        >
          {recovery ? "Recovery mode — priority 1" : "Priority 1"}
        </p>
        <h1 className={`mt-1 text-xl font-semibold ${recovery ? "text-white" : "text-primary"}`}>
          {model.priority1}
        </h1>
        {recovery && model.microFundTarget !== null && (
          <p className="mt-2 text-sm text-[#F1ECE3]">
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

      {model.inflationDrag && <InflationDragCard drag={model.inflationDrag} />}

      <YieldMatchmaker
        match={model.match}
        alternatives={model.alternatives}
        suppressedNote={model.suppressedNote}
      />

      {/* The upgrade path: shilling-exact numbers via the deep profile. */}
      <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
        <p className="text-sm font-medium text-primary">Want shilling-exact numbers?</p>
        <p className="mt-1 text-xs text-[#4B4238]">
          Take the 90-second deep profile for your precise take-home pay, budget split, and an
          AI action plan built on real KRA tax maths.
        </p>
        <Link
          href="/profile/full"
          className="mt-3 inline-flex h-10 items-center justify-center rounded-full bg-accent px-5 text-sm font-medium text-[#171717] transition-colors hover:bg-[#d6961f]"
        >
          Build my full Pesa Picture →
        </Link>
      </div>

      <div className="flex items-center justify-center gap-4 text-xs">
        <Link href="/picture" className="font-medium text-primary underline">
          My Pesa Picture
        </Link>
        <span aria-hidden="true" className="text-[#C9BFB2]">
          ·
        </span>
        <Link href="/profile" className="font-medium text-primary underline">
          Retake the quiz
        </Link>
        <span aria-hidden="true" className="text-[#C9BFB2]">
          ·
        </span>
        <Link href="/planners" className="font-medium text-primary underline">
          Plan a specific goal
        </Link>
      </div>

      <p className="text-xs text-[#4B4238]">
        Estimates use documented tier assumptions and quoted market baselines — verify current
        rates with any institution before moving money. For guidance only, not financial advice.
      </p>
    </div>
  );
}
