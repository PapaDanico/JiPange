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
      title="Savings Goal Calculator"
      description="Enter a target amount and timeline to see how much to save each month."
    >
      <SavingsGoalCalculator />
    </ToolLayout>
  );
}
