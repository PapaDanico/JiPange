"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { calculateFinancials } from "@/lib/budget";
import {
  getStoredJourneyAnswers,
  getStoredProfile,
  setStoredCalculations,
  setStoredPlan,
  setStoredProfile,
} from "@/lib/storage";
import type { ActionPlan, Profile } from "@/lib/types";

/**
 * Welcomes a returning visitor with a continue link instead of forcing a
 * redirect — the homepage stays explorable (the bottom-nav Home tab must
 * never bounce), while one tap resumes the journey.
 */
export default function ReturningUserRedirect() {
  const [destination, setDestination] = useState<{ href: string; label: string } | null>(null);

  useEffect(() => {
    async function check() {
      if (getStoredProfile()) {
        setDestination({ href: "/plan", label: "Continue to my action plan" });
        return;
      }
      if (getStoredJourneyAnswers()) {
        setDestination({ href: "/dashboard", label: "Continue to my dashboard" });
        return;
      }

      const supabase = createClient();
      if (!supabase) return;

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: profileRow }, { data: planRow }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase
          .from("plans")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      if (!profileRow) return;

      const profile: Profile = {
        fullName: profileRow.full_name ?? "",
        age: profileRow.age ?? 0,
        county: profileRow.county ?? "Nairobi",
        grossMonthlySalary: Number(profileRow.gross_monthly_salary ?? 0),
        dependants: profileRow.dependants ?? 0,
        chamaMember: Boolean(profileRow.chama_member),
      };
      setStoredProfile(profile);
      // Recompute from salary rather than trusting stale DB columns, so budgetSplit
      // (not persisted in `plans`) is always internally consistent with net/savings.
      setStoredCalculations(calculateFinancials(profile.grossMonthlySalary));

      if (planRow?.ai_recommendations) {
        setStoredPlan(planRow.ai_recommendations as ActionPlan);
      }

      setDestination({ href: "/plan", label: "Continue to my action plan" });
    }

    void check();
  }, []);

  if (!destination) return null;

  return (
    <div className="mb-6 w-full max-w-md rounded-2xl border border-border bg-white p-4 text-center shadow-sm">
      <p className="text-sm text-ink-soft">
        <span aria-hidden="true">👋 </span>Welcome back — pick up where you left off.
      </p>
      <Link
        href={destination.href}
        className="mt-2 inline-flex h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-medium text-white transition-colors hover:bg-primary-deep"
      >
        {destination.label} →
      </Link>
    </div>
  );
}
