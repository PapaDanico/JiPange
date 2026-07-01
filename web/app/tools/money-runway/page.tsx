import ToolLayout from "@/components/tools/ToolLayout";
import MoneyRunwayCalculator from "@/components/tools/MoneyRunwayCalculator";

export default function MoneyRunwayPage() {
  return (
    <ToolLayout
      title="Money Runway Calculator"
      description="See how long your savings will last at a given monthly withdrawal."
    >
      <MoneyRunwayCalculator />
    </ToolLayout>
  );
}
