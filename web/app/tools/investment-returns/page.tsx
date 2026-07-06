import type { Metadata } from "next";
import ToolLayout from "@/components/tools/ToolLayout";
import InvestmentReturnsCalculator from "@/components/tools/InvestmentReturnsCalculator";

export const metadata: Metadata = {
  title: "Investment Returns Calculator — Compound Growth Kenya",
  description:
    "See how a lump sum plus monthly contributions could grow over time with compound interest — free investment calculator for Kenya.",
};

export default function InvestmentReturnsPage() {
  return (
    <ToolLayout
      title="Investment Returns Calculator"
      description="Project how a lump sum and monthly contributions could grow over time."
      insights={[
        {
          icon: "⚠️",
          tone: "caution",
          stat: "KSh 4.6T",
          label: "sits in Kenyan bank accounts earning 3.23% — below inflation — silently losing real value every day.",
          source: "CMA Collective Investment Schemes, July 2026",
        },
        {
          icon: "🚀",
          tone: "hopeful",
          stat: "KSh 1.1M",
          label: "is what KSh 5,000/month grows to over 10 years at 11.5% MMF — vs KSh 600,000 sitting flat in a bank.",
          source: "Based on CIC Money Market Fund average yield, 2025/26",
        },
      ]}
    >
      <InvestmentReturnsCalculator />
    </ToolLayout>
  );
}
