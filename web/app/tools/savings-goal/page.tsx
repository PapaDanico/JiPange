import type { Metadata } from "next";
import ToolLayout from "@/components/tools/ToolLayout";
import SavingsGoalCalculator from "@/components/tools/SavingsGoalCalculator";

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
          stat: "Ksh 100,000+",
          label: "is what Ksh 2,000/month reaches in 3 years at 11% MMF — not Ksh 72,000 flat. Compounding is the difference.",
          source: "JiPange projection at 11% p.a.",
        },
      ]}
    >
      <SavingsGoalCalculator />
    </ToolLayout>
  );
}
