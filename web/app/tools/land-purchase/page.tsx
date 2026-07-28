import type { Metadata } from "next";
import ToolLayout from "@/components/tools/ToolLayout";
import LandPurchaseCalculator from "@/components/tools/LandPurchaseCalculator";
import {
  landCostSharePct,
  LAND_SMALL_PLOT_KES,
  LAND_LARGE_PLOT_KES,
} from "@/lib/tool-stats";

export const metadata: Metadata = {
  title: "Kenya Land Purchase True Cost Calculator",
  description:
    "See the full cost of buying land in Kenya: stamp duty, legal fees, valuation, title transfer, survey, and agent commission — before you sign anything.",
};

export default function LandPurchasePage() {
  return (
    <ToolLayout
      path="/tools/land-purchase"
      title="True Cost of Buying Land in Kenya"
      description="The quoted plot price is only the start. Enter the price and land type to see stamp duty, legal fees, valuation, and every other cost you must budget for."
      insights={[
        {
          icon: "⚠️",
          tone: "caution",
          stat: `${landCostSharePct(LAND_SMALL_PLOT_KES)}%`,
          label: `is what transaction fees add to a Ksh ${LAND_SMALL_PLOT_KES.toLocaleString("en-KE")} plot — against just ${landCostSharePct(LAND_LARGE_PLOT_KES)}% on a Ksh ${(LAND_LARGE_PLOT_KES / 1_000_000)}m one. The advocate\u2019s fixed minimum falls hardest on the smallest buyers.`,
          source: "Computed by JiPange — Stamp Duty Act Cap 480 and the Advocates Remuneration Order scale, plus VAT",
        },
        {
          icon: "💡",
          tone: "hopeful",
          stat: "Title search first",
          label: "Always conduct a land search at the Lands Registry before paying any deposit. Verify title, caveats, and encumbrances — it costs only Ksh 500.",
          source: "Lands Registry Kenya",
        },
      ]}
    >
      <LandPurchaseCalculator />
    </ToolLayout>
  );
}
