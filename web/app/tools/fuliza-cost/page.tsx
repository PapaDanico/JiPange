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
    >
      <FulizaCostCalculator />
    </ToolLayout>
  );
}
