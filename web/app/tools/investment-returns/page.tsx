import ToolLayout from "@/components/tools/ToolLayout";
import InvestmentReturnsCalculator from "@/components/tools/InvestmentReturnsCalculator";

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
