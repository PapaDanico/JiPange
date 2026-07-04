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
    >
      <DhowcsdLadderCalculator />
    </ToolLayout>
  );
}
