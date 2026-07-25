import type { Metadata } from "next";
import ToolLayout from "@/components/tools/ToolLayout";
import SalaryPlannerHub from "@/components/tools/SalaryPlannerHub";

export const metadata: Metadata = {
  title: "Salary & Pay Hub — Kenya Take-Home, Budget, Shield, Negotiate",
  description:
    "Five salary tools in one: calculate your exact take-home pay, split your budget 50/25/25, route your payday surplus, find unused KRA tax relief, and calculate the gross to negotiate.",
};

export default function SalaryHubPage() {
  return (
    <ToolLayout
      path="/tools/salary"
      title="Salary & Pay Hub"
      description="Take-home pay, budget split, payday routing, tax shield, and salary negotiation — all from one gross salary."
      insights={[
        {
          icon: "💸",
          tone: "caution",
          stat: "≈37%",
          label: "of a Ksh 100,000 gross salary goes to PAYE, NSSF, SHIF, and the Housing Levy before you see a shilling.",
          source: "JiPange tax engine (Feb 2026 rates)",
        },
        {
          icon: "🛡️",
          tone: "hopeful",
          stat: "Ksh 9,000+",
          label: "per month recoverable for most salaried Kenyans through unused pension and mortgage relief headroom — money KRA keeps by default.",
          source: "KRA Income Tax Act s.15(3)",
        },
      ]}
    >
      <SalaryPlannerHub />
    </ToolLayout>
  );
}
