import type { Metadata } from "next";
import ToolLayout from "@/components/tools/ToolLayout";
import SchoolFeesLifetimeCalculator from "@/components/tools/SchoolFeesLifetimeCalculator";
import {
  FEE_ESCALATION_TYPICAL_RANGE,
  DEFAULT_FEE_ESCALATION,
  buildChildPlan,
  solveLevelContribution,
  feeAnchor,
} from "@/lib/education-plan";
import { assumedMmfYield } from "@/lib/mmf-assumption";

export const metadata: Metadata = {
  title: "Private School Fees Calculator Kenya — The Full 14-Year Cost",
  description:
    "What educating one child privately in Kenya costs from now to Grade 12, with fee increases compounded — and the flat monthly saving that funds it.",
};

/* The headline is computed, not typed. A mid-tier private day place from
 * Grade 1, at the default escalation — the same path the calculator walks. */
const EXAMPLE = buildChildPlan({
  gradeValue: "grade1",
  annualFeeTodayKES: feeAnchor("private-day")!.annualKES,
});
const EXAMPLE_MONTHLY = solveLevelContribution({
  years: EXAMPLE.years,
  annualReturn: assumedMmfYield(),
});

export default function SchoolFeesLifetimePage() {
  return (
    <ToolLayout
      path="/tools/school-fees-lifetime"
      title="The Full Cost of Private School"
      description="Every year of fees from your child's current grade to Grade 12, with increases compounded — and what to save each month to meet them."
      insights={[
        {
          icon: "⚠️",
          tone: "caution",
          stat: `Ksh ${EXAMPLE.totalNominalKES.toLocaleString("en-KE")}`,
          label: `is what twelve years of a mid-tier private day school costs a family starting at Grade 1 — against Ksh ${EXAMPLE.totalIfFeesNeverRoseKES.toLocaleString("en-KE")} if you multiply this year’s fee by the years left. That gap is fee increases compounding, and it is the part that ambushes people.`,
          source: `Computed by JiPange from a published day fee, escalated at ${Math.round(DEFAULT_FEE_ESCALATION * 100)}% a year`,
        },
        {
          icon: "🎓",
          tone: "hopeful",
          stat: `Ksh ${EXAMPLE_MONTHLY.toLocaleString("en-KE")}/mo`,
          label: `funds every term of it from next January onward, without borrowing. Knowing the number early is what makes it a decision rather than an emergency each January.`,
          source: "Computed by JiPange — MMF rate anchored to the CBK 91-day bill",
        },
      ]}
      deeper={{
        question: "Will the money be there the term the fees fall due?",
        answer:
          "Mwangaza Yield matches bond maturities to each fee year, so principal returns just before the invoice instead of forcing a sale at whatever price the market offers that week.",
        href: "https://mwangazayield.org/goals/",
        label: "Match maturities to fee years",
      }}
    >
      <SchoolFeesLifetimeCalculator />
    </ToolLayout>
  );
}
