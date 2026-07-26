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
      path="/tools/inflation-reality"
      title="What is your salary really worth?"
      description="See how much purchasing power your salary loses to inflation over time."
      insights={[
        {
          icon: "⚠️",
          tone: "caution",
          stat: "Ksh 73,000",
          label: "is what Ksh 100,000 in savings is worth after 5 years at 6.3% inflation — a Ksh 27,000 silent loss.",
          source: "KNBS CPI data, 2025 average",
        },
        {
          icon: "📈",
          tone: "hopeful",
          stat: "Ksh 20,000+",
          label: "extra earned over 3 years by moving Ksh 50,000 from a bank (3.23%) to an MMF (11.5%) — same money, right vehicle.",
          source: "CMA / CBK rate data, 2026",
        },
      ]}
    >
      <InflationRealityCalculator />
    </ToolLayout>
  );
}
