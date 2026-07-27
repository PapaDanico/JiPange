import type { Metadata } from "next";
import ToolLayout from "@/components/tools/ToolLayout";
import { KplcOptimizer } from "@/components/tools/CashflowWidgets";

export const metadata: Metadata = {
  title: "KPLC Token Band Checker",
  description:
    "Work out your real cost per unit from your last token receipt, and see which KPLC tariff band your month lands in.",
};

export default function KplcOptimizerPage() {
  return (
    <ToolLayout
      path="/tools/kplc-optimizer"
      title="⚡ KPLC Token Band Checker"
      description="Your real cost per unit, from your own receipt — and which band your month actually lands in."
      insights={[
        {
          icon: "⚠️",
          tone: "caution",
          stat: "1 month",
          label:
            "is the Pre-paid Unit Purchase Period — units accumulate across every purchase in a calendar month, so splitting a buy in two changes nothing.",
          source: "EPRA/KPLC domestic tariff schedule",
        },
        {
          icon: "⚡",
          tone: "hopeful",
          stat: "3 months",
          label:
            "of rolling average consumption set your tariff category, so a heavy month raises what you pay in the months after it.",
          source: "EPRA/KPLC domestic tariff schedule",
        },
      ]}
    >
      <KplcOptimizer />
    </ToolLayout>
  );
}
