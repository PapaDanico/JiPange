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
      insights={[
        {
          icon: "⚠️",
          tone: "caution",
          stat: "KSh 165,000",
          label: "per year is the top-end cost for CBC Junior Secondary. Most families discover this in January — and borrow.",
          source: "MoE School Fees Guidelines 2025",
        },
        {
          icon: "🎓",
          tone: "hopeful",
          stat: "KSh 1,500/mo",
          label: "saved in an MMF from Standard 5 fully covers Junior Secondary fees — no loans, no scrambling every term.",
          source: "JiPange projection at 11% p.a.",
        },
      ]}
    >
      <EducationSavingsCalculator />
    </ToolLayout>
  );
}
