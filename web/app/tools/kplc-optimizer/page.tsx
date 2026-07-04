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
      title="⚡ KPLC Token Band Optimizer"
      description="Same budget, more units — split your token purchases to stay in the cheaper tariff band."
    >
      <KplcOptimizer />
    </ToolLayout>
  );
}
