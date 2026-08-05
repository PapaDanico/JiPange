import type { Metadata } from "next";
import ToolLayout from "@/components/tools/ToolLayout";
import WhereToSave from "@/components/tools/WhereToSave";

export const metadata: Metadata = {
  title: "Where to Save: T-Bills vs Money Market vs SACCO",
  description:
    "What Kenyan savings options actually pay after withholding tax — Treasury bills and money market funds ranked side by side, with SACCO dividends explained separately and honestly.",
};

export default function WhereToSavePage() {
  return (
    <ToolLayout
      path="/tools/where-to-save"
      title="Where to put your savings"
      description="What each option pays after tax, with the things that can be compared compared — and the one that cannot kept separate."
      insights={[
        {
          icon: "📊",
          tone: "hopeful",
          stat: "15%",
          label: "withholding tax comes off every interest option here, so the headline rate is never what you keep",
        },
        {
          icon: "⚠️",
          tone: "caution",
          stat: "Not insured",
          label:
            "the SACCO Deposit Guarantee Fund is not yet operational, so SACCO money has no statutory protection behind it",
          source: "Sacco Societies Act; Amendment Bill 2025 pending",
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
