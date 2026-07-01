import ToolLayout from "@/components/tools/ToolLayout";
import SavingsGoalCalculator from "@/components/tools/SavingsGoalCalculator";

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
