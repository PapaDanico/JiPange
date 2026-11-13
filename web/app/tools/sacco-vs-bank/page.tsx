import type { Metadata } from "next";
import ToolLayout from "@/components/tools/ToolLayout";
import SaccoVsBankCalculator from "@/components/tools/SaccoVsBankCalculator";

export const metadata: Metadata = {
  title: "SACCO vs Bank — Illustrative Loan Costs",
  description:
    "Compare SACCO, bank, and mobile lender loan costs side by side for the same amount and term in Kenya.",
};

export default function SaccoVsBankPage() {
  return (
    <ToolLayout
      path="/tools/sacco-vs-bank"
      title="SACCO vs bank: explore borrowing costs"
      description="Explore hypothetical borrowing costs. Confirm eligibility, actual lender quotations and all fees before deciding."
    >
      <SaccoVsBankCalculator />
    </ToolLayout>
  );
}
