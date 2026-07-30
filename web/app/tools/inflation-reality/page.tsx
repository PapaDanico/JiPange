import type { Metadata } from "next";
import { assumedMmfYield, assumedMmfYieldPct } from "@/lib/mmf-assumption";
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
          /* Computed from the same anchor the calculators use. The typed
           * "Ksh 20,000+" did not follow from any pair of rates on this page:
           * 50,000 at 11.5% against 3.23% over three years is about 14,300,
           * so the figure was stale even against the assumption it cited. */
          stat: `Ksh ${(Math.round(
            (50_000 * (Math.pow(1 + assumedMmfYield(), 3) - 1) - 50_000 * (Math.pow(1.0323, 3) - 1)) / 100
          ) * 100).toLocaleString("en-KE")}`,
          label: `extra earned over 3 years by moving Ksh 50,000 from a bank (3.23%) to an MMF (~${assumedMmfYieldPct()}%) — same money, right vehicle.`,
          source: "Assumed from the live CBK 91-day bill, via Mwangaza Yield",
        },
      ]}
    >
      <InflationRealityCalculator />
    </ToolLayout>
  );
}
