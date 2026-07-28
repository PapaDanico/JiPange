import type { Metadata } from "next";
import ToolLayout from "@/components/tools/ToolLayout";
import EducationSavingsCalculator from "@/components/tools/EducationSavingsCalculator";
import {
  educationSavingsPotKES,
  educationCoveragePct,
  seniorSchoolBoardingTotalKES,
  SENIOR_SCHOOL_BOARDING_ANNUAL_KES,
  SENIOR_SCHOOL_YEARS,
  EDUCATION_SAVING_MONTHLY_KES,
  EDUCATION_SAVING_YEARS,
} from "@/lib/tool-stats";

export const metadata: Metadata = {
  title: "Kids' School Fees Savings Calculator Kenya (CBC)",
  description:
    "Plan monthly savings for Junior and Senior Secondary fees, based on your child's current CBC grade.",
};

export default function EducationSavingsPage() {
  return (
    <ToolLayout
      path="/tools/education-savings"
      title="Kids' Education Savings Calculator"
      description="Plan monthly savings for Junior and Senior Secondary fees under Kenya's CBC system."
      insights={[
        {
          icon: "⚠️",
          tone: "caution",
          stat: `Ksh ${SENIOR_SCHOOL_BOARDING_ANNUAL_KES.toLocaleString("en-KE")}`,
          label: `a year is the government\u2019s uniform boarding fee for Senior School, Grades 10 to 12. Junior Secondary is capitated; this is the bill that actually arrives \u2014 and most families meet it in January, by borrowing.`,
          source: "Ministry of Education, uniform senior school fees for 2026",
        },
        {
          icon: "🎓",
          tone: "hopeful",
          stat: `Ksh ${EDUCATION_SAVING_MONTHLY_KES.toLocaleString("en-KE")}/mo`,
          label: `saved in an MMF for ${EDUCATION_SAVING_YEARS} years reaches Ksh ${educationSavingsPotKES().toLocaleString("en-KE")} \u2014 about ${educationCoveragePct()}% of the Ksh ${seniorSchoolBoardingTotalKES().toLocaleString("en-KE")} that ${SENIOR_SCHOOL_YEARS} years of senior school boarding costs. Most of it, without loans.`,
          source: "Computed by JiPange \u2014 MMF rate anchored to the CBK 91-day bill; fees per the Ministry of Education",
        },
      ]}
      deeper={{
        question: "Will the money be there the term the fees fall due?",
        answer: "Mwangaza Yield matches bond maturities to each fee year, so principal returns just before the invoice instead of forcing a sale at whatever price the market offers that week.",
        href: "https://mwangazayield.org/goals/",
        label: "Match maturities to fee years",
      }}
    >
      <EducationSavingsCalculator />
    </ToolLayout>
  );
}
