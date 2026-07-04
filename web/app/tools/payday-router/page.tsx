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
    >
      <PaydayRouter />
    </ToolLayout>
  );
}
