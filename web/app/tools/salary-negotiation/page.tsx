import type { Metadata } from "next";
import ToolLayout from "@/components/tools/ToolLayout";
import SalaryNegotiationCalculator from "@/components/tools/SalaryNegotiationCalculator";
import { raiseWorthAnnual, EXAMPLE_RAISE_KES } from "@/lib/tool-stats";

export const metadata: Metadata = {
  title: "Salary Negotiation Calculator — What Gross Should I Ask For?",
  description:
    "Reverse-engineer the gross salary you need to negotiate to hit your target take-home pay in Kenya.",
};

export default function SalaryNegotiationPage() {
  return (
    <ToolLayout
      path="/tools/salary-negotiation"
      title="What gross should I ask for?"
      description="Enter your target take-home pay and we'll work out the gross salary to negotiate for."
      insights={[
        {
          icon: "⚠️",
          tone: "caution",
          stat: "68%",
          label: "of Kenyan employees have never negotiated their salary — most leave Ksh 20,000–80,000/year on the table.",
          source: "BrighterMonday Kenya Salary Survey 2024",
        },
        {
          icon: "🎯",
          tone: "hopeful",
          stat: `Ksh ${raiseWorthAnnual().toLocaleString("en-KE")}`,
          label: `extra per year — what a Ksh ${EXAMPLE_RAISE_KES.toLocaleString("en-KE")} gross raise delivers after deductions. Compounding with each promotion.`,
          source: "JiPange PAYE calculation",
        },
      ]}
    >
      <SalaryNegotiationCalculator />
    </ToolLayout>
  );
}
