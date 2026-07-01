import type { Metadata } from "next";
import ToolLayout from "@/components/tools/ToolLayout";
import EducationSavingsCalculator from "@/components/tools/EducationSavingsCalculator";

export const metadata: Metadata = {
  title: "Kids' School Fees Savings Calculator Kenya",
  description:
    "Plan how much to save monthly toward your child's future school fees target.",
};

export default function EducationSavingsPage() {
  return (
    <ToolLayout
      title="Kids' Education Savings Calculator"
      description="Plan monthly savings toward a future school fees target."
    >
      <EducationSavingsCalculator />
    </ToolLayout>
  );
}
