import ToolLayout from "@/components/tools/ToolLayout";
import LoanRepaymentCalculator from "@/components/tools/LoanRepaymentCalculator";

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
