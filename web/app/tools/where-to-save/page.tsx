import type { Metadata } from "next";
import ToolLayout from "@/components/tools/ToolLayout";
import WhereToSave from "@/components/tools/WhereToSave";
import {
  CBK_AVG_DEPOSIT_RATE_NET_PCT,
  CBK_AVG_DEPOSIT_RATE_PCT,
  CBK_BSAR_2025_CITE,
  CBK_INSURED_SHARE_OF_DEPOSITS_PCT,
} from "@/lib/kenya-stats";

export const metadata: Metadata = {
  title: "Where to Save: T-Bills vs Money Market vs SACCO",
  description:
    "What Kenyan savings options actually pay after withholding tax — Treasury bills and money market funds ranked side by side, with SACCO dividends explained separately and honestly.",
};

export default function WhereToSavePage() {
  return (
    <ToolLayout
      path="/tools/where-to-save"
      exportAs="where-to-save"
      title="Where to put your savings"
      description="What each option pays after tax: the options that can be compared side by side, and the one that cannot kept separate."
      insights={[
        {
          icon: "⚠️",
          tone: "caution",
          stat: "Not insured",
          label: `the SACCO Deposit Guarantee Fund is not yet operational, so SACCO money has no statutory protection behind it. Bank deposit insurance is live but capped: it covered ${CBK_INSURED_SHARE_OF_DEPOSITS_PCT}% of bank deposits by value in December 2025.`,
          source: `Sacco Societies Act; Amendment Bill 2025 pending · ${CBK_BSAR_2025_CITE}, Appendix IX`,
        },
        /* The bank account is the option most readers already hold, and the
         * one missing from the ranking. CBK's average deposit rate is a
         * December 2025 figure, so it sits here as dated context rather than
         * as a row beside live rates it would be compared against unfairly. */
        {
          icon: "🏦",
          tone: "caution",
          stat: `${CBK_AVG_DEPOSIT_RATE_NET_PCT}%`,
          label: `is what the average Kenyan bank deposit paid after withholding tax in December 2025 (${CBK_AVG_DEPOSIT_RATE_PCT}% before it). Set it against the after-tax rates above.`,
          source: `${CBK_BSAR_2025_CITE}, §3.7`,
        },
      ]}
      /* THE QUESTION THIS PAGE DELIBERATELY DOES NOT SETTLE.
       *
       * /tools/dhowcsd already answers "fund or bill?" for a specific amount,
       * using verdictFor() — and it is amount-aware in a way this page is not,
       * because the DhowCSD minimum decides the question below a certain sum
       * regardless of any yield. This page surveys what the options pay and
       * why a SACCO is not among them; it must not restate a verdict a sister
       * tool reaches better, or a reader gets two answers and no way to tell
       * which is load-bearing. */
      deeper={{
        question: "So should I use a money market fund or a Treasury bill?",
        answer:
          "That depends on how much you have — below the DhowCSD minimum a bill is not an option at any yield. The ladder tool answers it for your amount.",
        href: "/tools/dhowcsd",
        label: "Open the T-bill ladder",
      }}
    >
      <WhereToSave />
    </ToolLayout>
  );
}
