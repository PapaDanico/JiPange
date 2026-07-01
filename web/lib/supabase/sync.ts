import { createClient } from "./client";
import { getStoredCalculations, getStoredPlan, getStoredProfile } from "../storage";

/** Migrates the guest's localStorage journey into Supabase once they've signed in. */
export async function migrateGuestDataToSupabase(): Promise<boolean> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const profile = getStoredProfile();
  if (!profile) return true;

  await supabase.from("profiles").upsert({
    id: user.id,
    full_name: profile.fullName,
    age: profile.age,
    county: profile.county,
    gross_monthly_salary: profile.grossMonthlySalary,
    dependants: profile.dependants,
    chama_member: profile.chamaMember,
  });

  const calculations = getStoredCalculations();
  const plan = getStoredPlan();

  if (calculations) {
    await supabase.from("plans").insert({
      user_id: user.id,
      net_monthly: calculations.netMonthly,
      savings_capacity: calculations.savingsCapacity,
      savings_rate: calculations.savingsRate,
      ai_recommendations: plan ?? null,
      is_active: true,
    });
  }

  return true;
}
