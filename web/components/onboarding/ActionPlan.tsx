"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  getStoredCalculations,
  getStoredPlan,
  getStoredProfile,
  setStoredPlan,
} from "@/lib/storage";
import { useStorageValue } from "@/lib/hooks";
import { buildRetirementComparison } from "@/lib/projections";
import { buildActionPlan } from "@/lib/native-plan";
import SaveMyPlan from "./SaveMyPlan";
import WhatsAppShare from "./WhatsAppShare";

const CATEGORY_ICON: Record<string, string> = {
  savings: "💰",
  debt: "💳",
  insurance: "🛡️",
  investment: "📈",
  tax: "📋",
};

const EFFORT_LABEL: Record<string, string> = {
  low: "Low effort",
  medium: "Medium effort",
  high: "High effort",
};

export default function ActionPlan() {
  const profile = useStorageValue(getStoredProfile, () => null);
  const calculations = useStorageValue(getStoredCalculations, () => null);
  const plan = useStorageValue(getStoredPlan, () => null);

  /**
   * The plan is computed here, on the device, from the same seven fields the
   * API used to forward to a model. No fetch, no loading state, no
   * "temporarily unavailable" — a deterministic engine cannot be down, costs
   * nothing at any scale, and the figures never leave the browser. See
   * lib/native-plan.ts for what that trades away (prose variety) and why that
   * is the right trade for financial guidance.
   */
  useEffect(() => {
    if (!profile || !calculations || plan) return;
    setStoredPlan(
      buildActionPlan({
        profile,
        net: calculations.netMonthly,
        surplus: calculations.savingsCapacity,
      })
    );
  }, [profile, calculations, plan]);

  // Quiz-only (or brand-new) visitors: the AI plan needs real salary numbers.
  // Invite them into the deep profile instead of bouncing them off the page.
  if (!profile || !calculations) {
    return (
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 text-center shadow-sm print:hidden">
        <p className="text-2xl" aria-hidden="true">
          🤖
        </p>
        <h2 className="mt-2 text-lg font-semibold text-primary">
          Your AI action plan needs your real numbers
        </h2>
        <p className="mt-1 text-sm text-ink-soft">
          Six quick questions — your actual salary and household — and JiPange generates a
          3-step plan built on real KRA tax maths. Still anonymous, still on your device.
        </p>
        <Link
          href="/profile/full"
          className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-accent px-6 text-sm font-medium text-ink transition-colors hover:bg-accent-deep"
        >
          Take the 90-second deep profile →
        </Link>
        <p className="mt-4 text-xs text-faint">
          <Link href="/dashboard" className="font-medium text-primary underline">
            Back to my dashboard
          </Link>{" "}
          ·{" "}
          <Link href="/tools" className="font-medium text-primary underline">
            explore calculators
          </Link>
        </p>
      </div>
    );
  }

  const retirement = buildRetirementComparison({
    currentAge: profile.age,
    netMonthlyIncome: calculations.netMonthly,
  });

  return (
    <div className="w-full max-w-2xl space-y-6 pb-28">
      {/* No loading skeleton and no error state on purpose: generation is a
          synchronous local computation now, so there is no moment to spin
          through and no network to fail. The one-render gap before the effect
          runs is imperceptible. */}
      {plan && (
        <div className="space-y-4">
          {plan.map((item) => (
            <div key={item.rank} className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-sm font-semibold text-ink">
                  {item.rank}
                </span>
                <span className="text-xl">{CATEGORY_ICON[item.category] ?? "💡"}</span>
                <h3 className="text-base font-semibold text-primary">{item.title}</h3>
              </div>
              <p className="mt-2 text-sm text-ink-soft">{item.description}</p>
              <p className="mt-2 text-sm font-medium text-success">{item.impact}</p>
              <span className="mt-2 inline-block rounded-full bg-canvas px-3 py-1 text-xs text-ink-soft">
                {EFFORT_LABEL[item.effort] ?? item.effort}
              </span>
            </div>
          ))}

          {/* "Try different recommendations" died with the model call: a
              deterministic engine gives the same answer to the same numbers,
              and pretending otherwise would be a slot machine. A different
              plan comes from different numbers, so that is the door offered. */}
          <Link
            href="/profile/full"
            className="flex h-11 w-full items-center justify-center rounded-full border border-border text-sm font-medium text-ink-soft"
          >
            Update my numbers to change the plan
          </Link>

          <div className="print:hidden"><SaveMyPlan /></div>
        </div>
      )}

      {plan && (
        <WhatsAppShare
          profile={profile}
          calculations={calculations}
          plan={plan}
          projectedWealth60={retirement.withPlan.nominalWealth}
        />
      )}
    </div>
  );
}
