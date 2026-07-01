import ToolLayout from "@/components/tools/ToolLayout";
import FireNumberCalculator from "@/components/tools/FireNumberCalculator";

export default function FireNumberPage() {
  return (
    <ToolLayout
      title="FIRE Number Calculator"
      description="Find your Financial Independence number and how many years to reach it."
    >
      <FireNumberCalculator />
    </ToolLayout>
  );
}
