import type { Metadata } from "next";
import ToolLayout from "@/components/tools/ToolLayout";
import ChamaGroupCalculator from "@/components/tools/ChamaGroupCalculator";

export const metadata: Metadata = {
  title: "Chama / Group Savings Optimizer",
  description:
    "Simulate your chama's merry-go-round rotation payouts and welfare fund, or model group investment returns over time.",
};

export default function ChamaPage() {
  return (
    <ToolLayout
      title="Chama / Group savings optimizer"
      description="Simulate merry-go-round rotation payouts and welfare fund, or model what your group achieves by investing together."
      insights={[
        {
          icon: "🤝",
          tone: "hopeful",
          stat: "11.4M",
          label:
            "Kenyans participate in chamas, making group finance one of the largest informal financial networks in Africa.",
          source: "FSD Kenya FinAccess 2024",
        },
        {
          icon: "📈",
          tone: "hopeful",
          stat: "KSh 700B+",
          label:
            "estimated value of assets held by registered chamas and investment clubs in Kenya — peer accountability turns small contributions into real wealth.",
          source: "CBK Financial Stability Report 2024",
        },
      ]}
    >
      <ChamaGroupCalculator />
    </ToolLayout>
  );
}
