import type { Metadata } from "next";
import ToolLayout from "@/components/tools/ToolLayout";
import FulizaCostCalculator from "@/components/tools/FulizaCostCalculator";
import {
  fulizaAprAt,
  FULIZA_SMALL_BORROW_KES,
  FULIZA_LARGE_BORROW_KES,
} from "@/lib/tool-stats";

export const metadata: Metadata = {
  title: "True Cost of Fuliza Calculator",
  description:
    "Find out what Fuliza really costs in fees and annualised APR before you borrow.",
};

export default function FulizaCostPage() {
  return (
    <ToolLayout
      path="/tools/fuliza-cost"
      title="What does Fuliza really cost?"
      description="See the real fee and equivalent APR before you borrow on Fuliza."
      insights={[
        {
          icon: "⚠️",
          tone: "caution",
          stat: `${fulizaAprAt(FULIZA_SMALL_BORROW_KES)}%`,
          label: `is the annualised cost of a Ksh ${FULIZA_SMALL_BORROW_KES} overdraft — against ${fulizaAprAt(FULIZA_LARGE_BORROW_KES)}% on Ksh ${FULIZA_LARGE_BORROW_KES.toLocaleString("en-KE")}. The fee is a flat shilling amount per band, so the smallest borrowings cost by far the most.`,
          source: "Computed by JiPange from the published Fuliza tariff — banded daily fee, 1% access fee, 20% excise",
        },
        {
          icon: "💡",
          tone: "hopeful",
          stat: "Ksh 3,000",
          label: "as a standing M-Pesa float — funded once from savings — eliminates most Fuliza use and saves Ksh 2,000–4,000/year in fees.",
          source: "JiPange calculation",
        },
      ]}
    >
      <FulizaCostCalculator />
    </ToolLayout>
  );
}
