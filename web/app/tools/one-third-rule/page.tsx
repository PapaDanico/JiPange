import type { Metadata } from "next";
import ToolLayout from "@/components/tools/ToolLayout";
import OneThirdRuleCalculator from "@/components/tools/OneThirdRuleCalculator";

export const metadata: Metadata = {
  title: "Are Your Deductions Legal? 1/3 Rule Checker",
  description:
    "Check whether your SACCO and loan deductions comply with Kenya's Employment Act one-third rule.",
};

export default function OneThirdRulePage() {
  return (
    <ToolLayout
      title="Are your deductions legal?"
      description="Check your SACCO and loan deductions against the Employment Act's one-third rule."
      insights={[
        {
          icon: "⚠️",
          tone: "caution",
          stat: "1 in 4",
          label: "Kenyan employees has loan and Sacco deductions that exceed the Employment Act's legal one-third limit.",
          source: "Ministry of Labour Inspection Reports, 2024",
        },
        {
          icon: "⚖️",
          tone: "hopeful",
          stat: "Back pay",
          label: "can be recovered if your deductions are illegal — a Labour Officer can order your employer to refund overpayments.",
          source: "Employment Act Cap. 226, Section 19",
        },
      ]}
    >
      <OneThirdRuleCalculator />
    </ToolLayout>
  );
}
