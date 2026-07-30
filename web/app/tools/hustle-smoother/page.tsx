import type { Metadata } from "next";
import { assumedMmfYieldPct } from "@/lib/mmf-assumption";
import ToolLayout from "@/components/tools/ToolLayout";
import HustleIncomeSmootherCalculator from "@/components/tools/HustleIncomeSmootherCalculator";

export const metadata: Metadata = {
  title: "Hustle Income Smoother — JiPange",
  description:
    "Turn months of variable freelance or informal income into a steady monthly salary — with a buffer fund that covers the lean months.",
};

export default function HustleSmootherPage() {
  return (
    <ToolLayout
      path="/tools/hustle-smoother"
      title="Hustle Income Smoother"
      description="Variable income in, steady salary out. Enter your last few months, get the monthly draw you can count on."
      insights={[
        {
          icon: "📊",
          tone: "caution",
          stat: "3 in 5",
          label:
            "informal Kenyan workers have zero financial buffer for a bad month — income arrives, bills are paid, nothing is set aside. The smoother breaks this cycle.",
          source: "FinAccess Kenya 2021",
        },
        {
          icon: "💡",
          tone: "hopeful",
          stat: `${assumedMmfYieldPct()}%`,
          label:
            "is what your smoothing buffer earns in a Money Market Fund while it waits to cover lean months — your safety net pays you interest.",
          source: "Assumed from the live CBK 91-day bill, via Mwangaza Yield",
        },
      ]}
    >
      <HustleIncomeSmootherCalculator />
    </ToolLayout>
  );
}
