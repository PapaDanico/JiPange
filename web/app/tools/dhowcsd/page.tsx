import type { Metadata } from "next";
import ToolLayout from "@/components/tools/ToolLayout";
import DhowcsdLadderCalculator from "@/components/tools/DhowcsdLadderCalculator";

export const metadata: Metadata = {
  title: "DhowCSD T-Bill Ladder Calculator Kenya",
  description:
    "Split capital across 91, 182 and 364-day Treasury Bills for quarterly liquidity and a blended yield that beats bank savings.",
};

export default function DhowcsdPage() {
  return (
    <ToolLayout
      title="DhowCSD T-Bill Ladder"
      description="Three tenors, one ladder: quarterly liquidity with a blended yield that crushes the 3.23% bank average."
      insights={[
        {
          icon: "⚠️",
          tone: "caution",
          stat: "2%",
          label: "of Kenyans invest in Treasury Bills despite them being risk-free, government-backed, and accessible from KSh 3,000.",
          source: "CBK DhowCSD subscriber data, 2025",
        },
        {
          icon: "🏆",
          tone: "hopeful",
          stat: "KSh 7,000+",
          label: "earned per year on a KSh 50,000 T-Bill ladder — more than most savings accounts earn on KSh 200,000.",
          source: "CBK T-Bill yields, June 2026",
        },
      ]}
    >
      <DhowcsdLadderCalculator />
    </ToolLayout>
  );
}
