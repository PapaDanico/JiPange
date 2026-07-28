import type { Metadata } from "next";
import ToolLayout from "@/components/tools/ToolLayout";
import SavingsGoalCalculator from "@/components/tools/SavingsGoalCalculator";
import {
  savingsGoalFutureValueKES,
  savingsGoalContributedKES,
  SAVINGS_GOAL_MONTHLY_KES,
  SAVINGS_GOAL_YEARS,
  mmfAssumedReturn,
} from "@/lib/tool-stats";

export const metadata: Metadata = {
  title: "Savings Goal Calculator — How Much to Save Monthly",
  description:
    "Work out exactly how much to save each month in Kenya to hit any savings target, based on your expected return.",
};

export default function SavingsGoalPage() {
  return (
    <ToolLayout
      path="/tools/savings-goal"
      title="Savings Goal Calculator"
      description="Enter a target amount and timeline to see how much to save each month."
      insights={[
        {
          icon: "⚠️",
          tone: "caution",
          stat: "78%",
          label: "of Kenyans have a financial goal in mind — but no written monthly plan to reach it. Goals without numbers stay wishes.",
          source: "FinAccess Household Survey 2024",
        },
        {
          icon: "🌱",
          tone: "hopeful",
          stat: `Ksh ${savingsGoalFutureValueKES().toLocaleString("en-KE")}`,
          label: `is what Ksh ${SAVINGS_GOAL_MONTHLY_KES.toLocaleString("en-KE")}/month reaches in ${SAVINGS_GOAL_YEARS} years at ${(mmfAssumedReturn() * 100).toFixed(1)}% MMF — not Ksh ${savingsGoalContributedKES().toLocaleString("en-KE")} flat. Compounding is the difference.`,
          source: "Computed by JiPange — MMF rate anchored to the CBK 91-day bill",
        },
      ]}
    >
      <SavingsGoalCalculator />
    </ToolLayout>
  );
}
