import type { Metadata } from "next";
import ToolLayout from "@/components/tools/ToolLayout";
import InvestmentReturnsCalculator from "@/components/tools/InvestmentReturnsCalculator";

export const metadata: Metadata = {
  title: "Investment Returns Calculator — Compound Growth Kenya",
  description:
    "See how a lump sum plus monthly contributions could grow over time with compound interest — free investment calculator for Kenya.",
};

export default function InvestmentReturnsPage() {
  return (
    <ToolLayout
      title="Investment Returns Calculator"
      description="Project how a lump sum and monthly contributions could grow over time."
    >
      <InvestmentReturnsCalculator />
    </ToolLayout>
  );
}
