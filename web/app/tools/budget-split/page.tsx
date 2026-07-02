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
      title="50/25/25 Budget Split Calculator"
      description="A simple 3-way split: 50% for daily living, 25% for a safety net, 25% for building wealth."
    >
      <BudgetSplitCalculator />
    </ToolLayout>
  );
}
