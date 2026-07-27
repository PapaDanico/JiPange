import type { Metadata } from "next";
import ToolLayout from "@/components/tools/ToolLayout";
import TaxShieldCalculator from "@/components/tools/TaxShieldCalculator";
import { pensionReliefSavingAnnual } from "@/lib/tool-stats";

export const metadata: Metadata = {
  title: "KRA Tax Shield & Net-Pay Optimizer Kenya",
  description:
    "Find the PAYE you're overpaying every month: unused pension, mortgage-interest and insurance reliefs, computed at your real marginal band.",
};

export default function TaxShieldPage() {
  return (
    <ToolLayout
      path="/tools/tax-shield"
      title="KRA Tax Shield Optimizer"
      description="Claw back overpaid PAYE by maxing your legal pension, mortgage and insurance reliefs."
      insights={[
        {
          icon: "⚠️",
          tone: "caution",
          stat: "80%+",
          label: "of PAYE workers never use their pension, mortgage or insurance reliefs — paying KRA more than they legally owe.",
          source: "KRA Compliance Report 2024",
        },
        {
          icon: "💸",
          tone: "hopeful",
          stat: `Ksh ${pensionReliefSavingAnnual().toLocaleString("en-KE")}`,
          label: "back per year — the legal PAYE saving from maxing your pension contribution alone at higher salary bands.",
          source: "Income Tax Act s.15(3) cap, at the 30% band — computed by JiPange",
        },
      ]}
    >
      <TaxShieldCalculator />
    </ToolLayout>
  );
}
