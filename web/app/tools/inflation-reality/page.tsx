import type { Metadata } from "next";
import ToolLayout from "@/components/tools/ToolLayout";
import InflationRealityCalculator from "@/components/tools/InflationRealityCalculator";

export const metadata: Metadata = {
  title: "Inflation Reality Calculator — What Is Your Salary Really Worth?",
  description:
    "See how Kenya's 6.5% average inflation erodes your salary's purchasing power over time.",
};

export default function InflationRealityPage() {
  return (
    <ToolLayout
      title="What is your salary really worth?"
      description="See how much purchasing power your salary loses to inflation over time."
    >
      <InflationRealityCalculator />
    </ToolLayout>
  );
}
