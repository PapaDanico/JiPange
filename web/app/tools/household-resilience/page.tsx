import type { Metadata } from "next";
import ToolLayout from "@/components/tools/ToolLayout";
import HouseholdResilienceCalculator from "@/components/tools/HouseholdResilienceCalculator";
import MoneyRunwayCalculator from "@/components/tools/MoneyRunwayCalculator";

export const metadata: Metadata = {
  title: "Household Financial Resilience Calculator — Kenya",
  description: "Stress-test twelve months of household cash flow against income loss, debt repayments and upcoming school fees, and see how long your savings would last with no income.",
};

export default function HouseholdResiliencePage() {
  return (
    <ToolLayout
      path="/tools/household-resilience"
      title="Household financial resilience"
      description="See how income shocks, monthly commitments and upcoming bills affect your accessible savings over the next twelve months."
    >
      <HouseholdResilienceCalculator />
      {/* Money Runway lived on its own page until 27 Nov 2026. It answers the
          narrower question this tool's twelve months leave open, "how long
          until the money runs out?", so it sits here rather than in a second
          directory entry. /tools/money-runway redirects to this section. */}
      <section id="runway" className="mt-10 scroll-mt-24">
        <h2 className="mb-1 text-xl font-semibold text-ink">How long would your savings last?</h2>
        <p className="mb-4 text-sm text-ink-soft">With no income at all: your savings, a monthly withdrawal, and any return they earn.</p>
        <MoneyRunwayCalculator />
      </section>
    </ToolLayout>
  );
}
