import type { Metadata } from "next";
import ToolLayout from "@/components/tools/ToolLayout";
import FulizaCostCalculator from "@/components/tools/FulizaCostCalculator";

export const metadata: Metadata = {
  title: "True Cost of Fuliza Calculator",
  description:
    "Find out what Fuliza really costs in fees and annualised APR before you borrow.",
};

export default function FulizaCostPage() {
  return (
    <ToolLayout
      title="What does Fuliza really cost?"
      description="See the real fee and equivalent APR before you borrow on Fuliza."
      insights={[
        {
          icon: "⚠️",
          tone: "caution",
          stat: "~400%",
          label: "is Fuliza's real annualised cost. KSh 6.75/day on a KSh 600 borrow feels small — it's the most expensive credit most Kenyans ever use.",
          source: "Safaricom FY2026 · JiPange APR calculation",
        },
        {
          icon: "💡",
          tone: "hopeful",
          stat: "KSh 3,000",
          label: "as a standing M-Pesa float — funded once from savings — eliminates most Fuliza use and saves KSh 2,000–4,000/year in fees.",
          source: "JiPange calculation",
        },
      ]}
    >
      <FulizaCostCalculator />
    </ToolLayout>
  );
}
