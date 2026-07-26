import type { Metadata } from "next";
import ToolLayout from "@/components/tools/ToolLayout";
import TakeHomePayCalculator from "@/components/tools/TakeHomePayCalculator";

export const metadata: Metadata = {
  title: "Take-Home Pay Calculator (KRA PAYE 2025/26)",
  description:
    "Calculate your exact net salary in Kenya after PAYE, NSSF, SHIF, and the Housing Levy — free, instant, no sign-up required.",
};

export default function TakeHomePayPage() {
  return (
    <ToolLayout
      path="/tools/take-home-pay"
      title="Take-Home Pay Calculator"
      description="Enter your gross monthly salary to see your exact net pay after PAYE, NSSF, SHIF, and the Housing Levy."
      insights={[
        {
          icon: "⚠️",
          tone: "caution",
          stat: "80%+",
          label: "of PAYE employees never claim the pension, mortgage or insurance reliefs they're legally entitled to — overpaying tax every month.",
          source: "KRA Compliance Report 2024",
        },
        {
          icon: "💡",
          tone: "hopeful",
          stat: "Ksh 4,500",
          label: "is the monthly PAYE saving you can unlock by maxing your pension contribution — legally, every month, right now.",
          source: "KRA Tax Relief Bands 2025/26",
        },
      ]}
    >
      <TakeHomePayCalculator />
    </ToolLayout>
  );
}
