import type { Metadata } from "next";
import ToolLayout from "@/components/tools/ToolLayout";
import LoanRepaymentCalculator from "@/components/tools/LoanRepaymentCalculator";

export const metadata: Metadata = {
  title: "Loan & HELB Repayment Calculator Kenya",
  description:
    "Calculate your monthly loan or HELB installment and total interest — free Kenyan loan repayment calculator.",
};

export default function LoanRepaymentPage() {
  return (
    <ToolLayout
      title="Loan / HELB Repayment Calculator"
      description="See your monthly installment and total interest on any loan."
      insights={[
        {
          icon: "⚠️",
          tone: "caution",
          stat: "KSh 1,500",
          label: "is the typical fee on a KSh 10,000 mobile loan for 30 days — that's 18% for one month, or 216% annualised.",
          source: "CBK Digital Credit Providers Audit, 2025",
        },
        {
          icon: "💰",
          tone: "hopeful",
          stat: "KSh 12,000",
          label: "saved in interest by choosing a Sacco (12% p.a.) over a bank (19% p.a.) on a KSh 100,000 loan over 2 years.",
          source: "SASRA & CBK rate comparisons, 2025",
        },
      ]}
    >
      <LoanRepaymentCalculator />
    </ToolLayout>
  );
}
