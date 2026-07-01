import type { Metadata } from "next";
import ToolLayout from "@/components/tools/ToolLayout";
import TakeHomePayCalculator from "@/components/tools/TakeHomePayCalculator";

export const metadata: Metadata = {
  title: "Take-Home Pay Calculator (KRA PAYE 2025/26)",
  description:
    "Calculate your exact net salary in Kenya after PAYE, NSSF, and SHIF deductions — free, instant, no sign-up required.",
};

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
