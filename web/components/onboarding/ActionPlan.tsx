"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getStoredCalculations,
  getStoredPlan,
  getStoredProfile,
  setStoredPlan,
} from "@/lib/storage";
import { buildRetirementComparison } from "@/lib/projections";
import type { ActionPlan as ActionPlanType, Calculations, Profile } from "@/lib/types";
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
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [calculations, setCalculations] = useState<Calculations | null>(null);
  const [plan, setPlan] = useState<ActionPlanType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedProfile = getStoredProfile();
    const storedCalculations = getStoredCalculations();
    if (!storedProfile || !storedCalculations) {
      router.replace("/profile");
      return;
    }
    setProfile(storedProfile);
    setCalculations(storedCalculations);
    setPlan(getStoredPlan());
  }, [router]);

  useEffect(() => {
    if (!profile || !calculations || plan) return;
    void generatePlan(profile, calculations);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, calculations]);

  async function generatePlan(currentProfile: Profile, currentCalculations: Calculations) {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: currentProfile,
          calculations: {
            netMonthly: currentCalculations.netMonthly,
            savingsCapacity: currentCalculations.savingsCapacity,
          },
        }),
      });

      if (!response.ok) {
        const responseBody = await response.json().catch(() => null);
        throw new Error(responseBody?.error ?? "Something went wrong");
      }

      const data = await response.json();
      setPlan(data.recommendations);
      setStoredPlan(data.recommendations);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (!profile || !calculations) {
    return <p className="text-center text-[#4B4238]">Loading...</p>;
  }

  const retirement = buildRetirementComparison({
    currentAge: profile.age,
    netMonthlyIncome: calculations.netMonthly,
  });

  return (
    <div className="w-full max-w-md space-y-6 pb-28">
      {loading && (
        <div className="space-y-4">
          <p className="text-center text-sm text-[#4B4238]">
            JiPange is thinking about your situation...
          </p>
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-[#F1ECE3]" />
          ))}
        </div>
      )}

      {error && !loading && (
        <div className="rounded-2xl bg-[#FBEAEA] p-6 text-center">
          <p className="text-sm text-danger">{error}</p>
          <button
            onClick={() => void generatePlan(profile, calculations)}
            className="mt-3 h-10 rounded-full bg-primary px-4 text-sm font-medium text-white"
          >
            Try again
          </button>
        </div>
      )}

      {plan && !loading && (
        <div className="space-y-4">
          {plan.map((item) => (
            <div key={item.rank} className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-sm font-semibold text-[#171717]">
                  {item.rank}
                </span>
                <span className="text-xl">{CATEGORY_ICON[item.category] ?? "💡"}</span>
                <h3 className="text-base font-semibold text-primary">{item.title}</h3>
              </div>
              <p className="mt-2 text-sm text-[#4B4238]">{item.description}</p>
              <p className="mt-2 text-sm font-medium text-success">{item.impact}</p>
              <span className="mt-2 inline-block rounded-full bg-[#F1ECE3] px-3 py-1 text-xs text-[#4B4238]">
                {EFFORT_LABEL[item.effort] ?? item.effort}
              </span>
            </div>
          ))}

          <button
            onClick={() => void generatePlan(profile, calculations)}
            className="h-10 w-full rounded-full border border-[#E5E0D8] text-sm font-medium text-[#4B4238]"
          >
            Try different recommendations
          </button>

          <SaveMyPlan />
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
