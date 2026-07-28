import type { Metadata } from "next";
import ToolLayout from "@/components/tools/ToolLayout";
import MoneyRunwayCalculator from "@/components/tools/MoneyRunwayCalculator";
import {
  emergencyFundMonths,
  EMERGENCY_FUND_TARGET_KES,
  EMERGENCY_FUND_MONTHLY_KES,
} from "@/lib/tool-stats";

export const metadata: Metadata = {
  title: "Money Runway Calculator — How Long Will My Savings Last",
  description:
    "See how many months or years your savings will last at a given monthly withdrawal rate.",
};

export default function MoneyRunwayPage() {
  return (
    <ToolLayout
      path="/tools/money-runway"
      title="Money Runway Calculator"
      description="See how long your savings will last at a given monthly withdrawal."
      insights={[
        {
          icon: "⚠️",
          tone: "caution",
          stat: "67%",
          label: "of Kenyans have less than one month of expenses saved — one job loss or medical bill away from a crisis.",
          source: "FinAccess Household Survey 2024",
        },
        {
          icon: "🛡️",
          tone: "hopeful",
          stat: `${emergencyFundMonths()} months`,
          label: `is all it takes to build a 3-month Ksh ${EMERGENCY_FUND_TARGET_KES.toLocaleString("en-KE")} emergency fund by saving Ksh ${EMERGENCY_FUND_MONTHLY_KES.toLocaleString("en-KE")}/month — start today.`,
          source: "Computed by JiPange — flat saving, no return assumed",
        },
      ]}
    >
      <MoneyRunwayCalculator />
    </ToolLayout>
  );
}
