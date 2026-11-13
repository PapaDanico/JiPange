import type { Metadata } from "next";
import ToolLayout from "@/components/tools/ToolLayout";
import HouseholdResilienceCalculator from "@/components/tools/HouseholdResilienceCalculator";

export const metadata: Metadata = {
  title: "Household Financial Resilience Calculator — Kenya",
  description: "Stress-test twelve months of household cash flow against income loss, debt repayments and upcoming school fees.",
};

export default function HouseholdResiliencePage() {
  return (
    <ToolLayout
      path="/tools/household-resilience"
      title="Household financial resilience"
      description="See how income shocks, monthly commitments and upcoming bills affect your accessible savings over the next twelve months."
    >
      <HouseholdResilienceCalculator />
    </ToolLayout>
  );
}
