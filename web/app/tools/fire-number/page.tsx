import type { Metadata } from "next";
import Link from "next/link";
import ToolLayout from "@/components/tools/ToolLayout";
import FireNumberCalculator from "@/components/tools/FireNumberCalculator";
import FireEducation from "@/components/tools/FireEducation";
import {
  earlyStartMultiple,
  earlyStartMultipleReal,
  earlyStartWealthRealKES,
  EARLY_START_AGE,
  LATE_START_AGE,
  RETIRE_AT_AGE,
  EARLY_START_MONTHLY_KES,
} from "@/lib/tool-stats";

export const metadata: Metadata = {
  title: "FIRE Number Calculator — Financial Independence Kenya",
  /* This used to name the 4% safe-withdrawal rule.
   *
   * The tool carries a section headed "Why there is no 20× or 25× rule here",
   * and 4% IS the 25× rule — so the description promised in search results the
   * one thing the page then declines to do, and sized the pot roughly 25%
   * above what this app's own model produces. No code implemented that rule
   * either: the constant was referenced nowhere. */
  description:
    "Work out what you need to retire in Kenya, in today's money — priced as the real cost of your years in retirement, with medical care rising faster than everything else.",
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
          /* Real, not nominal — the calculator directly below this works
           * entirely in today's money and says so. The nominal version of the
           * same figure is materially larger, and quoting that here put two
           * incompatible sets of shillings on one screen. Both are rendered
           * from the same functions, so neither can go stale. */
          stat: `${earlyStartMultipleReal()}× more`,
          label: `spending power at ${RETIRE_AT_AGE} by starting Ksh ${EARLY_START_MONTHLY_KES.toLocaleString("en-KE")}/month at ${EARLY_START_AGE} rather than ${LATE_START_AGE} — about Ksh ${earlyStartWealthRealKES().toLocaleString("en-KE")} in today's money. Starting early is still the single biggest lever.`,
          source: `Computed by JiPange at 10% p.a. compounded monthly, then deflated by inflation published by Mwangaza Yield. In nominal shillings the same figure reads ${earlyStartMultiple()}× — same money, different units.`,
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
      <FireEducation />
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
