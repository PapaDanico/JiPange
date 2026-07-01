"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
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

      const { data: profileRow } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

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

      const { data: planRow } = await supabase
        .from("plans")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (planRow) {
        setStoredCalculations({
          netMonthly: Number(planRow.net_monthly ?? 0),
          budgetSplit: { needs: 0, socialObligations: 0, wants: 0, savings: 0 },
          savingsCapacity: Number(planRow.savings_capacity ?? 0),
          savingsRate: Number(planRow.savings_rate ?? 0),
        });
        if (planRow.ai_recommendations) {
          setStoredPlan(planRow.ai_recommendations as ActionPlan);
        }
      }

      router.replace("/plan");
    }

    void check();
  }, [router]);

  return null;
}
