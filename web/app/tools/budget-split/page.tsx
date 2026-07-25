import type { Metadata } from "next";
import ToolLayout from "@/components/tools/ToolLayout";
import BudgetSplitCalculator from "@/components/tools/BudgetSplitCalculator";

export const metadata: Metadata = {
  title: "50/25/25 Budget Split Calculator Kenya",
  description:
    "Split your take-home pay 50% household expenses, 25% savings/emergency fund, 25% investments.",
};

export default function BudgetSplitPage() {
  return (
    <ToolLayout
      path="/tools/budget-split"
      title="50/25/25 Budget Split Calculator"
      description="A simple 3-way split: 50% for daily living, 25% for a safety net, 25% for building wealth."
      insights={[
        {
          icon: "⚠️",
          tone: "caution",
          stat: "71%",
          label: "of Kenyans are in survival mode by the 3rd week of the month — spending without a plan means the month plans you.",
          source: "FinAccess Household Survey 2024",
        },
        {
          icon: "📊",
          tone: "hopeful",
          stat: "40% fewer",
          label: "end-of-month shortfalls for people who follow a written budget for 6+ months. One plan, compounding results.",
          source: "FSD Kenya Behavioural Research, 2024",
        },
      ]}
    >
      <BudgetSplitCalculator />
    </ToolLayout>
  );
}
