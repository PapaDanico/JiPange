import type { Metadata } from "next";
import ToolLayout from "@/components/tools/ToolLayout";
import LoanRepaymentCalculator from "@/components/tools/LoanRepaymentCalculator";
import { formatKES } from "@/lib/budget";
import {
  CBK_AVG_LENDING_RATE_PCT,
  CBK_BSAR_2025_CITE,
  CBK_DIGITAL_CREDIT_BILLION_KSH,
  CBK_DIGITAL_CREDIT_GROWTH_PCT,
} from "@/lib/kenya-stats";
import {
  LOAN_EXAMPLE_KES,
  LOAN_EXAMPLE_MONTHS,
  SACCO_EXAMPLE_ANNUAL_RATE_PCT,
  saccoVsBankInterestSavingKES,
} from "@/lib/tool-stats";

export const metadata: Metadata = {
  title: "Loan & HELB Repayment Calculator Kenya",
  description:
    "Calculate your monthly loan or HELB instalment and total interest — free Kenyan loan repayment calculator.",
};

export default function LoanRepaymentPage() {
  return (
    <ToolLayout
      path="/tools/loan-repayment"
      title="Loan / HELB Repayment Calculator"
      description="See your monthly instalment and total interest on any loan."
      insights={[
        /* Both cards were hand-written and both were wrong: "Ksh 1,500 ... 18%
         * for one month, or 216% annualised" (1,500 on 10,000 is 15%, and the
         * cited "CBK Digital Credit Providers Audit, 2025" is not a
         * publication we can find), and a SACCO saving of "Ksh 12,000" that
         * the calculator below puts at about 8,000. Replaced with a figure
         * CBK prints and a saving the engine computes — see tool-stats.ts. */
        {
          icon: "⚠️",
          tone: "caution",
          stat: `Ksh ${CBK_DIGITAL_CREDIT_BILLION_KSH}bn`,
          label: `was owed to licensed digital lenders in December 2025, up ${CBK_DIGITAL_CREDIT_GROWTH_PCT}% in a single year. Price any app loan here as an annual rate before you take it.`,
          source: `${CBK_BSAR_2025_CITE}, §3.24`,
        },
        {
          icon: "💰",
          tone: "hopeful",
          stat: formatKES(saccoVsBankInterestSavingKES()),
          label: `saved in interest on a ${formatKES(LOAN_EXAMPLE_KES)} loan over ${LOAN_EXAMPLE_MONTHS / 12} years at a SACCO's ${SACCO_EXAMPLE_ANNUAL_RATE_PCT}% instead of the ${CBK_AVG_LENDING_RATE_PCT}% bank average (December 2025). Banks now publish their rates on the Total Cost of Credit website — compare before you sign.`,
          source: `Computed by JiPange; average lending rate from ${CBK_BSAR_2025_CITE}, §3.7`,
        },
      ]}
    >
      <LoanRepaymentCalculator />
    </ToolLayout>
  );
}
