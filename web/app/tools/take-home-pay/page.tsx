import ToolLayout from "@/components/tools/ToolLayout";
import TakeHomePayCalculator from "@/components/tools/TakeHomePayCalculator";

export default function TakeHomePayPage() {
  return (
    <ToolLayout
      title="Take-Home Pay Calculator"
      description="Enter your gross monthly salary to see your exact net pay after PAYE, NSSF, and SHIF."
    >
      <TakeHomePayCalculator />
    </ToolLayout>
  );
}
