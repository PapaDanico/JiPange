import type { Metadata } from "next";
import { assumedMmfYield, assumedMmfYieldPct, monthlyContributionFV } from "@/lib/mmf-assumption";
import ToolLayout from "@/components/tools/ToolLayout";
import InvestmentReturnsCalculator from "@/components/tools/InvestmentReturnsCalculator";
import { BANK_SAVINGS_EARNING_BELOW_INFLATION_TRILLION } from "@/lib/kenya-stats";

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
          stat: `Ksh ${BANK_SAVINGS_EARNING_BELOW_INFLATION_TRILLION}T`,
          label: "sits in Kenyan bank accounts earning 3.23% — below inflation — silently losing real value every day.",
          source: "CMA Collective Investment Schemes Quarterly Report, Q1 2026 · CBK",
        },
        {
          icon: "🚀",
          tone: "hopeful",
          /* Computed, not typed. This read "Ksh 1.1M" beside a rate that was
           * itself hardcoded at 11.5%, so when the assumption moved the
           * headline stayed — an illustration of compounding that had stopped
           * compounding the number it illustrates. */
          stat: `Ksh ${(monthlyContributionFV(5_000, assumedMmfYield(), 10) / 1_000_000).toFixed(1)}M`,
          label: `is what Ksh 5,000/month grows to over 10 years at ~${assumedMmfYieldPct()}% MMF — vs Ksh 600,000 sitting flat in a bank.`,
          source: "Assumed from the live CBK 91-day bill, via Mwangaza Yield",
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
