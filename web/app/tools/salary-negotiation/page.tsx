import type { Metadata } from "next";
import ToolLayout from "@/components/tools/ToolLayout";
import SalaryNegotiationCalculator from "@/components/tools/SalaryNegotiationCalculator";

export const metadata: Metadata = {
  title: "Salary Negotiation Calculator — What Gross Should I Ask For?",
  description:
    "Reverse-engineer the gross salary you need to negotiate to hit your target take-home pay in Kenya.",
};

export default function SalaryNegotiationPage() {
  return (
    <ToolLayout
      title="What gross should I ask for?"
      description="Enter your target take-home pay and we'll work out the gross salary to negotiate for."
    >
      <SalaryNegotiationCalculator />
    </ToolLayout>
  );
}
