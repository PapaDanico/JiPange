import ToolLayout from "@/components/tools/ToolLayout";
import EducationSavingsCalculator from "@/components/tools/EducationSavingsCalculator";

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
