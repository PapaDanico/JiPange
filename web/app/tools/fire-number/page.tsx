import type { Metadata } from "next";
import Link from "next/link";
import ToolLayout from "@/components/tools/ToolLayout";
import FireNumberCalculator from "@/components/tools/FireNumberCalculator";
import {
  earlyStartMultiple,
  EARLY_START_AGE,
  LATE_START_AGE,
  RETIRE_AT_AGE,
  EARLY_START_MONTHLY_KES,
} from "@/lib/tool-stats";

export const metadata: Metadata = {
  title: "FIRE Number Calculator — Financial Independence Kenya",
  description:
    "Find your FIRE number and how many years until Financial Independence, based on the 4% safe withdrawal rule.",
};

export default function FireNumberPage() {
  return (
    <ToolLayout
      path="/tools/fire-number"
      title="FIRE Number Calculator"
      description="Find your Financial Independence number and how many years to reach it."
      insights={[
        {
          icon: "⚠️",
          tone: "caution",
          stat: "81%",
          label: "of Kenya's workforce contributes nothing to a pension — retirement will arrive whether they plan for it or not.",
          source: "RBA Pensioners Survey 2024",
        },
        {
          icon: "🌅",
          tone: "hopeful",
          stat: `${earlyStartMultiple()}× more`,
          label: `wealth at ${RETIRE_AT_AGE} by starting Ksh ${EARLY_START_MONTHLY_KES.toLocaleString("en-KE")}/month at ${EARLY_START_AGE} vs ${LATE_START_AGE} — at 10% return. Starting early is the single biggest lever.`,
          source: "Computed by JiPange at an assumed 10% p.a., compounded monthly",
        },
      ]}
      deeper={{
        question: "Your FIRE number depends entirely on the yield you assume.",
        answer: "Mwangaza Yield works that yield out from live CBK auction data rather than a typed-in guess: what a buildable bond ladder actually pays after tax, marked down for the fall the Central Bank Rate has genuinely made on the record.",
        href: "https://mwangazayield.org/goals/",
        label: "Check the yield behind the number",
      }}
    >
      <FireNumberCalculator />
      <div className="mt-6 rounded-2xl bg-canvas p-4 text-sm text-ink-soft print:hidden">
        <p className="font-semibold text-primary">Ready to build toward this number?</p>
        <p className="mt-1 text-xs">
          Use the{" "}
          <Link href="/planners" className="underline hover:text-primary">
            Retirement Planner
          </Link>{" "}
          to model your monthly contributions, investment growth, and the exact year you reach
          Financial Independence — with Kenya&apos;s MMF and T-Bill yields built in.
        </p>
      </div>
    </ToolLayout>
  );
}
