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
    >
      <LoanRepaymentCalculator />
    </ToolLayout>
  );
}
