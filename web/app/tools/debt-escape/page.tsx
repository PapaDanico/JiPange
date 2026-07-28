import type { Metadata } from "next";
import ToolLayout from "@/components/tools/ToolLayout";
import DebtEscapeCalculator from "@/components/tools/DebtEscapeCalculator";
import {
  fulizaMonthlyCostPct,
  FULIZA_EXAMPLE_KES,
  FULIZA_EXAMPLE_DAYS,
} from "@/lib/tool-stats";

export const metadata: Metadata = {
  title: "Debt Stack Buster — Escape Mobile Loans Faster",
  description:
    "Use the avalanche method to eliminate Fuliza, Tala, and other mobile loans. See exactly when you'll be debt-free and how much interest you'll save.",
};

export default function DebtEscapePage() {
  return (
    <ToolLayout
      path="/tools/debt-escape"
      title="Debt Stack Buster"
      description="Enter your mobile loans and a monthly repayment budget. The avalanche method (highest rate first) shows you the fastest, cheapest way out."
      insights={[
        {
          icon: "⚠️",
          tone: "caution",
          stat: `${fulizaMonthlyCostPct()}%/month`,
          label: `is what Ksh ${FULIZA_EXAMPLE_KES.toLocaleString("en-KE")} carried for ${FULIZA_EXAMPLE_DAYS} days costs in Fuliza fees. Clearing it first saves the most money.`,
          source: "Computed by JiPange from the published Fuliza tariff",
        },
        {
          icon: "💡",
          tone: "hopeful",
          stat: "Avalanche method",
          label: "saves more total interest than the snowball method. Pay minimums on every loan, then throw every spare shilling at the highest-rate debt first.",
          source: "Consumer finance research",
        },
      ]}
    >
      <DebtEscapeCalculator />
    </ToolLayout>
  );
}
