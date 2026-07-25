import type { Metadata } from "next";
import ToolLayout from "@/components/tools/ToolLayout";
import LandPurchaseCalculator from "@/components/tools/LandPurchaseCalculator";

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
          stat: "8–12%",
          label: "is the typical cost of transaction fees on top of the quoted land price in Kenya — stamp duty, legal fees, valuation, title transfer, and survey alone.",
          source: "Stamp Duty Act Cap 480 · Advocates Remuneration Order · JiPange",
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
