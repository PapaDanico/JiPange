import type { Metadata } from "next";
import ToolLayout from "@/components/tools/ToolLayout";
import { KplcOptimizer } from "@/components/tools/CashflowWidgets";

export const metadata: Metadata = {
  title: "KPLC Token Band Optimizer",
  description:
    "Buy KPLC tokens in two half-month purchases to stay in a lower tariff band and get extra units on the same budget.",
};

export default function KplcOptimizerPage() {
  return (
    <ToolLayout
      path="/tools/kplc-optimizer"
      title="⚡ KPLC Token Band Optimizer"
      description="Same budget, more units — split your token purchases to stay in the cheaper tariff band."
      insights={[
        {
          icon: "⚠️",
          tone: "caution",
          stat: "~40%",
          label: "more per unit is what most Kenyans pay by buying Ksh 1,000+ at once and jumping into the higher tariff band.",
          source: "KPLC Tariff Structure 2025",
        },
        {
          icon: "⚡",
          tone: "hopeful",
          stat: "~15 units",
          label: "of extra electricity per month — free — by splitting Ksh 1,000 into two Ksh 500 purchases on the same budget.",
          source: "KPLC Band 1 vs Band 2 rates, 2025",
        },
      ]}
    >
      <KplcOptimizer />
    </ToolLayout>
  );
}
