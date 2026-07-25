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
      path="/tools/investment-returns"
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
      deeper={{
        question: "On a government bond, the quoted return is not what you keep.",
        answer: "Withholding tax takes 15% of the coupon under ten years and 10% at ten or over, while infrastructure bonds pay theirs whole. Mwangaza Yield shows the after-tax figure for every bond CBK has on issue.",
        href: "https://mwangazayield.org/calculator/",
        label: "See the after-tax yield",
      }}
    >
      <InvestmentReturnsCalculator />
    </ToolLayout>
  );
}
