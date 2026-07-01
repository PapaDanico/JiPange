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
    >
      <OneThirdRuleCalculator />
    </ToolLayout>
  );
}
