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
      insights={[
        {
          icon: "⚠️",
          tone: "caution",
          stat: "19–24%",
          label: "is the typical bank personal loan rate in Kenya. Most borrowers accept the first quote — without comparing.",
          source: "CBK Banking Supervision Report 2025",
        },
        {
          icon: "🤝",
          tone: "hopeful",
          stat: "KSh 180B",
          label: "estimated interest saved by Sacco members in 2023 vs equivalent bank loans — Saccos exist to serve members, not shareholders.",
          source: "SASRA Sacco Supervision Annual Report 2023",
        },
      ]}
    >
      <SaccoVsBankCalculator />
    </ToolLayout>
  );
}
