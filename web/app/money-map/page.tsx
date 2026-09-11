import type { Metadata } from "next";
import Link from "next/link";
import CashFlowMap from "@/components/dashboard/CashFlowMap";
import ExportableSection from "@/components/tools/ExportableSection";
import PrintLetterhead from "@/components/tools/PrintLetterhead";

export const metadata: Metadata = {
  title: "Net Cash Flow & Liquidity Map",
  description:
    "Every planner's monthly commitment against one savings capacity, mapped to the horizon each goal's money can actually sit in.",
};

/**
 * Deliberately NOT at /dashboard.
 *
 * /dashboard is the journey funnel's payoff screen, built from the five quiz
 * answers and reachable with no profile at all. This page needs the profile's
 * computed take-home pay and at least one saved goal, so it answers a
 * different question for a reader further along. Putting this here would have
 * deleted the funnel's ending — which is precisely what nearly happened.
 */
export default function MoneyMapPage() {
  return (
    <div className="flex flex-1 flex-col items-center px-6 py-12">
      <div className="w-full max-w-2xl">
        <PrintLetterhead title="Net Cash Flow & Liquidity Map" />
        <div className="print:hidden">
          <h1 className="text-2xl font-semibold text-primary lg:text-3xl">
            Net cash flow &amp; liquidity map
          </h1>
          <p className="mt-1 text-sm text-ink-soft lg:text-base">
            Your goals are not separate plans — they are claims on one pot. This is that pot.
          </p>
        </div>
      </div>
      <div className="mt-6 w-full max-w-2xl">
        <ExportableSection
          filename="cash-flow-map"
          title="Net Cash Flow & Liquidity Map"
        >
          <div className="flex w-full justify-center">
            <CashFlowMap />
          </div>
        </ExportableSection>
      </div>
      <div className="mt-8 w-full max-w-2xl">
        <p className="text-center text-xs text-faint print:hidden">
          Everything here is computed on your device from what you have already entered.{" "}
          <Link href="/picture" className="font-medium text-primary underline">
            Your Pesa Picture
          </Link>{" "}
          has the budget it comes from.
        </p>
      </div>
    </div>
  );
}
