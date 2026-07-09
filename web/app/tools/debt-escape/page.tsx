import type { Metadata } from "next";
import ToolLayout from "@/components/tools/ToolLayout";
import DebtEscapeCalculator from "@/components/tools/DebtEscapeCalculator";

export const metadata: Metadata = {
  title: "Debt Stack Buster — Escape Mobile Loans Faster",
  description:
    "Use the avalanche method to eliminate Fuliza, Tala, and other mobile loans. See exactly when you'll be debt-free and how much interest you'll save.",
};

export default function DebtEscapePage() {
  return (
    <ToolLayout
      title="Debt Stack Buster"
      description="Enter your mobile loans and a monthly repayment budget. The avalanche method (highest rate first) shows you the fastest, cheapest way out."
      insights={[
        {
          icon: "⚠️",
          tone: "caution",
          stat: "32%/month",
          label: "is Fuliza's effective monthly rate — KSh 1,000 borrowed for 30 days costs KSh 320 in fees alone. Clearing it first saves the most money.",
          source: "Safaricom Fuliza tariff · JiPange calculation",
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
