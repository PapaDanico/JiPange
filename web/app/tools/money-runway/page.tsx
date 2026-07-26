import type { Metadata } from "next";
import ToolLayout from "@/components/tools/ToolLayout";
import MoneyRunwayCalculator from "@/components/tools/MoneyRunwayCalculator";

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
          stat: "15 months",
          label: "is all it takes to build a 3-month Ksh 30,000 emergency fund by saving Ksh 2,000/month — start today.",
          source: "JiPange projection",
        },
      ]}
    >
      <MoneyRunwayCalculator />
    </ToolLayout>
  );
}
