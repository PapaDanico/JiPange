"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { calculateFinancials } from "@/lib/budget";
import {
  getStoredProfile,
  setStoredCalculations,
  setStoredPlan,
  setStoredProfile,
} from "@/lib/storage";
import type { ActionPlan, Profile } from "@/lib/types";

/** Sends a returning visitor straight to their saved plan instead of the profile form. */
export default function ReturningUserRedirect() {
  const router = useRouter();

  useEffect(() => {
    async function check() {
      if (getStoredProfile()) {
        router.replace("/plan");
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

      router.replace("/plan");
    }

    void check();
  }, [router]);

  return null;
}
