import type { Metadata } from "next";
import { assumedMmfYieldPct } from "@/lib/mmf-assumption";
import ToolLayout from "@/components/tools/ToolLayout";
import InflationRealityCalculator from "@/components/tools/InflationRealityCalculator";
import { formatKES } from "@/lib/budget";
import { CURRENT_INFLATION } from "@/lib/journey";
import { CBK_AVG_DEPOSIT_RATE_PCT, CBK_BSAR_2025_CITE } from "@/lib/kenya-stats";
import { inflationAttribution } from "@/lib/rates-feed";
import {
  EROSION_EXAMPLE_KES,
  EROSION_EXAMPLE_YEARS,
  MOVE_EXAMPLE_KES,
  MOVE_EXAMPLE_YEARS,
  bankToMmfExtraKES,
  erosionRealValueKES,
} from "@/lib/tool-stats";

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
        /* Both computed. The first read "Ksh 73,000 ... at 6.3% inflation",
         * credited to a 2025 KNBS average the feed has since moved past; the
         * second compared an MMF against an unsourced 3.23% bank rate. Both
         * now follow the live inflation reading and CBK's measured deposit
         * rate, after tax on both sides. */
        {
          icon: "🧭",
          tone: "caution",
          stat: formatKES(erosionRealValueKES()),
          label: `is what ${formatKES(EROSION_EXAMPLE_KES)} buys after ${EROSION_EXAMPLE_YEARS} years if inflation stays at ${(CURRENT_INFLATION * 100).toFixed(1)}% — which is why idle savings deserve a home that grows.`,
          source: inflationAttribution(),
        },
        {
          icon: "📈",
          tone: "hopeful",
          stat: formatKES(bankToMmfExtraKES()),
          label: `more, after tax, over ${MOVE_EXAMPLE_YEARS} years by moving ${formatKES(MOVE_EXAMPLE_KES)} from the average bank deposit (${CBK_AVG_DEPOSIT_RATE_PCT}%) to an MMF (~${assumedMmfYieldPct()}%) — same money, better-paying home.`,
          source: `${CBK_BSAR_2025_CITE}, §3.7 · MMF assumed from the CBK 91-day bill`,
        },
      ]}
    >
      <InflationRealityCalculator />
    </ToolLayout>
  );
}
