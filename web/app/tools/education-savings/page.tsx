import type { Metadata } from "next";
import ToolLayout from "@/components/tools/ToolLayout";
import EducationSavingsCalculator from "@/components/tools/EducationSavingsCalculator";

export const metadata: Metadata = {
  title: "Kids' School Fees Savings Calculator Kenya (CBC)",
  description:
    "Plan monthly savings for Junior and Senior Secondary fees, based on your child's current CBC grade.",
};

export default function EducationSavingsPage() {
  return (
    <ToolLayout
      title="Kids' Education Savings Calculator"
      description="Plan monthly savings for Junior and Senior Secondary fees under Kenya's CBC system."
    >
      <EducationSavingsCalculator />
    </ToolLayout>
  );
}
