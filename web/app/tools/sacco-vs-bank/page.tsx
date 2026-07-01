import type { Metadata } from "next";
import ToolLayout from "@/components/tools/ToolLayout";
import SaccoVsBankCalculator from "@/components/tools/SaccoVsBankCalculator";

export const metadata: Metadata = {
  title: "SACCO or Bank? Find the Cheaper Loan",
  description:
    "Compare SACCO, bank, and mobile lender loan costs side by side for the same amount and term in Kenya.",
};

export default function SaccoVsBankPage() {
  return (
    <ToolLayout
      title="SACCO or bank? Find the cheaper loan"
      description="Compare SACCO, bank, and mobile lender costs for the same loan amount and term."
    >
      <SaccoVsBankCalculator />
    </ToolLayout>
  );
}
