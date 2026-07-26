import type { Metadata } from "next";
import ToolLayout from "@/components/tools/ToolLayout";
import DhowcsdLadderCalculator from "@/components/tools/DhowcsdLadderCalculator";

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
          // Was "Ksh 7,000+ ... on a Ksh 50,000 ladder", which implies 14% —
          // roughly the tax-free yield on a long infrastructure bond, not a
          // bill. At the current blended 8.15% net, Ksh 50,000 earns about
          // Ksh 4,080. The bank comparison is the honest version of the same
          // point and is arguably stronger: it takes ~Ksh 126,000 in a savings
          // account at 3.23% to earn what Ksh 50,000 earns here.
          stat: "Ksh 8,100+",
          label: "earned per year, after tax, on a Ksh 100,000 bill — what a savings account pays on more than twice the money.",
          source: "CBK auction yields via Mwangaza Yield, net of 15% withholding tax",
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
