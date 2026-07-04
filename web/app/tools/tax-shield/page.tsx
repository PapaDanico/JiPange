import type { Metadata } from "next";
import ToolLayout from "@/components/tools/ToolLayout";
import TaxShieldCalculator from "@/components/tools/TaxShieldCalculator";

export const metadata: Metadata = {
  title: "KRA Tax Shield & Net-Pay Optimizer Kenya",
  description:
    "Find the PAYE you're overpaying every month: unused pension, mortgage-interest and insurance reliefs, computed at your real marginal band.",
};

export default function TaxShieldPage() {
  return (
    <ToolLayout
      title="KRA Tax Shield Optimizer"
      description="Claw back overpaid PAYE by maxing your legal pension, mortgage and insurance reliefs."
    >
      <TaxShieldCalculator />
    </ToolLayout>
  );
}
