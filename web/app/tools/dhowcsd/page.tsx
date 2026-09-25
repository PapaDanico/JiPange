import type { Metadata } from "next";
import ToolLayout from "@/components/tools/ToolLayout";
import DhowcsdLadderCalculator from "@/components/tools/DhowcsdLadderCalculator";
import { formatKES } from "@/lib/budget";
import { CBK_BSAR_2025_CITE } from "@/lib/kenya-stats";
import { attribution } from "@/lib/rates-feed";
import { BILL_EXAMPLE_KES, bankMultipleForBillIncome, bestBillAnnualNetKES } from "@/lib/tool-stats";

export const metadata: Metadata = {
  title: "DhowCSD T-Bill Ladder Calculator Kenya",
  description:
    "Split capital across 91, 182 and 364-day Treasury Bills for quarterly liquidity and a blended yield that beats bank savings.",
};

export default function DhowcsdPage() {
  return (
    <ToolLayout
      path="/tools/dhowcsd"
      title="DhowCSD T-Bill Ladder"
      description="Split capital across the 91, 182 and 364-day bills however suits you — weighted for liquidity, for yield, or evenly — and see the blended return after tax."
      insights={[
        {
          icon: "⚠️",
          tone: "caution",
          stat: "2%",
          label: "of Kenyans invest in Treasury Bills, despite a government guarantee behind every shilling. A single bill starts at Ksh 100,000.",
          source: "CBK DhowCSD subscriber data, 2025",
        },
        {
          icon: "🏆",
          tone: "hopeful",
          // Was "Ksh 7,000+ ... on a Ksh 50,000 ladder" (implying 14%), then
          // "Ksh 8,100+ ... what a savings account pays on more than twice the
          // money" — both typed, both overtaken by the market. Computed now:
          // the best bill's after-tax income, and the multiple of money the
          // average bank deposit (CBK, after tax) needs to match it.
          stat: formatKES(bestBillAnnualNetKES()),
          label: `earned per year, after tax, on ${formatKES(BILL_EXAMPLE_KES)} in the best-paying bill — the average bank deposit would need about ${bankMultipleForBillIncome().toFixed(1)}× the money to match it.`,
          source: `${attribution()}, net of 15% withholding tax · bank: ${CBK_BSAR_2025_CITE}, §3.7`,
        },
      ]}
      deeper={{
        question: "A T-bill ladder tops out at 364 days. What about the years beyond it?",
        answer: "Treasury bonds run 2 to 30 years and pay a coupon every 182 days. Mwangaza Yield prices them after Kenyan withholding tax — 15%, 10%, or nothing at all on an infrastructure bond — and builds a bond ladder the same way this one builds a bill ladder.",
        href: "https://mwangazayield.org/ladder/",
        label: "Build a bond ladder",
      }}
    >
      <DhowcsdLadderCalculator />
    </ToolLayout>
  );
}
