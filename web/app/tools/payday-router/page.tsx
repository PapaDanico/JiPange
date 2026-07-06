import type { Metadata } from "next";
import ToolLayout from "@/components/tools/ToolLayout";
import { PaydayRouter } from "@/components/tools/CashflowWidgets";

export const metadata: Metadata = {
  title: "M-Pesa Payday Safety Router",
  description:
    "Find your true weekly spend limit and how much surplus to move out of M-Pesa on payday.",
};

export default function PaydayRouterPage() {
  return (
    <ToolLayout
      title="📱 The M-Pesa Payday Safety Router"
      description="Your salary minus rent and bills, routed safely — know your weekly limit before M-Pesa spends it for you."
      insights={[
        {
          icon: "⚠️",
          tone: "caution",
          stat: "34%",
          label: "more is spent on non-essentials in the first week after salary by Kenyans without a payday allocation plan.",
          source: "FSD Kenya Spending Behaviour Study, 2024",
        },
        {
          icon: "📱",
          tone: "hopeful",
          stat: "28% less",
          label: "end-of-month shortfall for people who pre-route rent, bills and savings on payday — before M-Pesa sees it.",
          source: "FSD Kenya Behavioural Research, 2024",
        },
      ]}
    >
      <PaydayRouter />
    </ToolLayout>
  );
}
