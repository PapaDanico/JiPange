"use client";

import { useEffect, useMemo, useState } from "react";
import { formatKES } from "@/lib/budget";
import { solveYearsToTarget } from "@/lib/goal-planner";
import {
  MILESTONE_YIELD,
  mapJourney,
  microMilestoneTarget,
  type JourneyAnswers,
  type Vehicle,
} from "@/lib/journey";

// ── Module 1: the Micro-Milestone Generator ──

function MicroMilestone({ answers }: { answers: JourneyAnswers }) {
  const target = microMilestoneTarget(answers);
  const [monthly, setMonthly] = useState(Math.max(500, Math.round(target / 10 / 500) * 500));

  const months = useMemo(() => {
    const years = solveYearsToTarget({
      targetAmount: target,
      monthlyContribution: monthly,
      annualRate: MILESTONE_YIELD,
    });
    return Number.isFinite(years) ? Math.max(1, Math.ceil(years * 12)) : null;
  }, [target, monthly]);

  return (
    <section aria-label="Micro-milestone" className="rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-primary">Your first milestone</h2>
      <p className="mt-1 rounded-xl bg-[#E9F5EC] p-4 text-sm text-[#2b4a2b]">
        🎯 Hit your first <strong>{formatKES(target)}</strong>
        {months !== null && (
          <>
            {" "}
            in <strong data-testid="milestone-months">{months} {months === 1 ? "month" : "months"}</strong> by
            saving <strong>{formatKES(monthly)}</strong> monthly.
          </>
        )}
      </p>

      <div className="mt-4">
        <div className="flex items-center justify-between">
          <label htmlFor="milestone-monthly" className="text-sm font-medium text-[#4B4238]">
            Monthly contribution
          </label>
          <span className="text-sm font-semibold text-primary">{formatKES(monthly)}/mo</span>
        </div>
        <input
          id="milestone-monthly"
          type="range"
          min={500}
          max={Math.max(5_000, target / 2)}
          step={500}
          value={monthly}
          onChange={(event) => setMonthly(Number(event.target.value))}
          className="mt-2 h-2 w-full accent-primary"
        />
      </div>
      <p className="mt-2 text-xs text-[#6f6e69]">
        Assumes an {(MILESTONE_YIELD * 100).toFixed(1)}% p.a. MMF baseline compounded monthly —
        an assumption, not a promise. Check live rates before committing.
      </p>
    </section>
  );
}

// ── Module 2: the Direct Vendor Referral Blueprint ──

const BLUEPRINTS: Record<
  Vehicle["id"],
  { title: string; steps: string[]; guideName: string; guide: string }
> = {
  sacco: {
    title: "🏛️ Action Item: Establish Your Sacco Core",
    steps: [
      "Choose a SASRA-regulated Tier-1 Sacco (e.g., Stima, Safaricom, Police).",
      "Commit to a fixed monthly deposit (aligns with the milestone slider above).",
      "Activate a standing instruction on your primary salary account to process a day after payday.",
    ],
    guideName: "jipange-sacco-onboarding-guide.txt",
    guide: `JiPange — Sample Sacco Onboarding Guide

1. Confirm the Sacco is SASRA-regulated (search the SASRA licensed list).
2. Gather: national ID, KRA PIN, passport photo, and a payslip or bank statement.
3. Open the membership account and buy the minimum share capital.
4. Set your fixed monthly deposit — the amount from your JiPange milestone.
5. At your bank/app, create a standing order dated one day after payday.
6. After ~6 months of steady deposits, ask about the 3x development loan multiplier.

Verify all requirements and current dividend rates with the Sacco directly.
For guidance only — not financial advice.`,
  },
  mmf: {
    title: "📈 Action Item: Open Your Money Market Fund",
    steps: [
      "Pick a CMA-regulated MMF with M-Pesa deposits and T+1 withdrawals (e.g., Britam, ICEA Lion, Sanlam).",
      "Complete the app/USSD sign-up with your ID and KRA PIN — most start from about KSh 500.",
      "Automate a monthly M-Pesa deposit for the amount on the milestone slider above.",
    ],
    guideName: "jipange-mmf-onboarding-guide.txt",
    guide: `JiPange — Sample MMF Onboarding Guide

1. Confirm the fund is CMA-regulated and check its latest daily yield.
2. Sign up in the provider's app or USSD with national ID + KRA PIN.
3. Make the opening deposit from M-Pesa (minimums often around KSh 500).
4. Set a monthly auto-deposit for your JiPange milestone amount.
5. Test one withdrawal early so you trust the T+1 M-Pesa payout.

Verify current yields and fees with the fund manager directly.
For guidance only — not financial advice.`,
  },
  ifb: {
    title: "🏦 Action Item: Stage Your Infrastructure Bond Entry",
    steps: [
      "Register on CBK DhowCSD (app or web) with your ID and KRA PIN.",
      "Park monthly savings in an MMF until you reach the bond minimum (typically KSh 50,000).",
      "Bid in the next IFB auction and diarise the bi-annual, tax-free coupon dates.",
    ],
    guideName: "jipange-ifb-onboarding-guide.txt",
    guide: `JiPange — Sample Infrastructure Bond (IFB) Guide

1. Create your CBK DhowCSD account (ID + KRA PIN + bank details).
2. Build the entry amount in a liquid MMF first — don't rush the auction.
3. Watch CBK auction announcements for the next IFB issue and its coupon.
4. Place your bid via DhowCSD; competitive or non-competitive as suits you.
5. Coupons pay bi-annually, tax-free; reinvest them for compounding.

Check current auction calendars and minimums at cbk.go.ke.
For guidance only — not financial advice.`,
  },
};

function VendorBlueprint({ vehicleId }: { vehicleId: Vehicle["id"] }) {
  const blueprint = BLUEPRINTS[vehicleId];
  const storageKey = `jipange:blueprint:${vehicleId}`;
  const [done, setDone] = useState<boolean[]>(() => blueprint.steps.map(() => false));

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) setDone(JSON.parse(stored));
    } catch {
      // Corrupt state — start fresh.
    }
  }, [storageKey]);

  function toggle(index: number) {
    setDone((prev) => {
      const next = prev.map((value, i) => (i === index ? !value : value));
      window.localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  }

  function downloadGuide() {
    const blob = new Blob([blueprint.guide], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = blueprint.guideName;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section aria-label="Execution blueprint" className="rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-primary">{blueprint.title}</h2>
      <ul className="mt-3 space-y-3">
        {blueprint.steps.map((step, index) => (
          <li key={step}>
            <label className="flex cursor-pointer items-start gap-3 text-sm text-[#4B4238]">
              <input
                type="checkbox"
                checked={done[index] ?? false}
                onChange={() => toggle(index)}
                className="mt-0.5 h-5 w-5 shrink-0 accent-primary"
              />
              <span className={done[index] ? "line-through opacity-60" : ""}>{step}</span>
            </label>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={downloadGuide}
        className="mt-4 h-11 w-full rounded-full border border-primary text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-white"
      >
        Download Sample {vehicleId === "sacco" ? "Sacco" : vehicleId === "mmf" ? "MMF" : "IFB"}{" "}
        Onboarding Guide
      </button>
    </section>
  );
}

// ── Module 3: the viral "Share My Milestone" loop ──

const SITE_ROOT = "https://jipangefinance.netlify.app";
const SHARE_TEXT = `🔥 Yo! I just mapped my pesa in 90 seconds — anonymous, zero typing, and it showed me exactly where inflation is eating my savings. Jipange kabla pesa ikupange 😅 → ${SITE_ROOT}`;

function ViralShare() {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(SITE_ROOT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable — silently ignore.
    }
  }

  return (
    <section
      aria-label="Share JiPange"
      className="rounded-2xl border-2 border-accent bg-[#FFF8EA] p-5 text-center"
    >
      <p className="text-sm font-semibold text-primary">
        🔥 Help your friends protect their cash from inflation drag.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <a
          href={`https://wa.me/?text=${encodeURIComponent(SHARE_TEXT)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-11 flex-1 items-center justify-center rounded-full bg-[#0E7C56] text-sm font-medium text-white"
        >
          Share Tool on WhatsApp
        </a>
        <button
          type="button"
          onClick={() => void copyLink()}
          className="h-11 flex-1 rounded-full border border-[#E5E0D8] bg-white text-sm font-medium text-[#4B4238]"
        >
          {copied ? "Copied!" : "Copy Anonymous Plan Link"}
        </button>
      </div>
      <p className="mt-2 text-xs text-[#6f6e69]">
        The link carries nothing about you — it just opens JiPange.
      </p>
    </section>
  );
}

/** The /plan roadmap for quiz-takers: milestone → execution steps → share loop. */
export default function JourneyActionPlan({ answers }: { answers: JourneyAnswers }) {
  const model = mapJourney(answers);

  return (
    <div className="w-full max-w-md space-y-6">
      <MicroMilestone answers={answers} />
      <VendorBlueprint vehicleId={model.match.id} />
      <ViralShare />
    </div>
  );
}
