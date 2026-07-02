import type { Metadata } from "next";
import BrandHeader from "@/components/BrandHeader";
import ToolsIndexList, { type ToolGroup } from "@/components/tools/ToolsIndexList";

export const metadata: Metadata = {
  title: "Free Financial Calculators for Kenya",
  description:
    "Free, no-signup calculators for Kenyan money decisions: take-home pay, savings goals, loans, FIRE, and more.",
};

const CALCULATOR_GROUPS: ToolGroup[] = [
  {
    label: "Plan for today",
    calculators: [
      {
        href: "/tools/take-home-pay",
        icon: "💰",
        title: "Take-Home Pay Calculator",
        description: "See your exact net salary after PAYE, NSSF, SHIF, and the Housing Levy.",
        insight: "Used by 1,200+ Kenyans this month.",
      },
      {
        href: "/tools/savings-goal",
        icon: "🎯",
        title: "Savings Goal Calculator",
        description: "Work out how much to save each month to hit a target amount.",
        insight: "Small, consistent amounts beat big, irregular ones.",
      },
      {
        href: "/tools/loan-repayment",
        icon: "🏦",
        title: "Loan / HELB Repayment Calculator",
        description: "See your monthly installment and total interest on any loan.",
        insight: "A SACCO loan can cost a third of what a mobile lender charges for the same amount.",
      },
    ],
  },
  {
    label: "Plan for the future",
    calculators: [
      {
        href: "/tools/investment-returns",
        icon: "📈",
        title: "Investment Returns Calculator",
        description: "Project how a lump sum plus monthly contributions grows over time.",
        insight: "Compounding grows your money fastest in the later years — start now.",
      },
      {
        href: "/tools/fire-number",
        icon: "🔥",
        title: "FIRE Number Calculator",
        description: "Find your Financial Independence number and how many years to reach it.",
        insight: "At 6.5% Kenya inflation, you may need a lower withdrawal rate than the standard 4% rule.",
      },
      {
        href: "/tools/money-runway",
        icon: "⏳",
        title: "Money Runway Calculator",
        description: "See how long your savings will last at a given monthly withdrawal.",
        insight: "A modest return can make your savings last years longer.",
      },
      {
        href: "/tools/education-savings",
        icon: "🎓",
        title: "Kids' Education Savings Calculator",
        description: "Plan monthly savings for Junior and Senior Secondary fees, CBC-aware.",
        insight: "CBC's 6-year secondary system means two fee step-ups, not one — plan for both.",
      },
    ],
  },
  {
    label: "Pesa realities",
    calculators: [
      {
        href: "/tools/salary-negotiation",
        icon: "💼",
        title: "Salary Negotiation Calculator",
        description: "Work out the gross salary to negotiate for a target take-home pay.",
        insight: "Every Kenyan starting a new job should run this before agreeing to a number.",
        isNew: true,
      },
      {
        href: "/tools/sacco-vs-bank",
        icon: "⚖️",
        title: "SACCO vs Bank Loan Comparison",
        description: "Compare SACCO, bank, and mobile lender costs for the same loan.",
        insight: "Most Kenyans don't realise how much cheaper SACCO loans are.",
        isNew: true,
      },
      {
        href: "/tools/inflation-reality",
        icon: "📉",
        title: "Inflation Reality Calculator",
        description: "See what your salary will really be worth in the future.",
        insight: "Kenya CPI has averaged 6.5% per year — your salary needs to keep pace.",
        isNew: true,
      },
      {
        href: "/tools/fuliza-cost",
        icon: "📱",
        title: "True Cost of Fuliza Calculator",
        description: "Find out what Fuliza really costs before you borrow.",
        insight: "Fuliza costs ~400% APR — more than a payday lender.",
        isNew: true,
      },
      {
        href: "/tools/one-third-rule",
        icon: "⚠️",
        title: "1/3 Rule Checker",
        description: "Check if your SACCO and loan deductions are legally compliant.",
        insight: "Many Kenyans unknowingly have illegal deductions taken from their pay.",
        isNew: true,
      },
    ],
  },
];

export default function ToolsPage() {
  return (
    <div className="flex flex-1 flex-col items-center px-6 py-12">
      <div className="w-full max-w-md">
        <BrandHeader />
        <h1 className="text-2xl font-semibold text-primary">Free Financial Calculators</h1>
        <p className="mt-1 text-sm text-[#4B4238]">
          Quick tools for everyday Kenyan money decisions — no account needed.
        </p>
      </div>
      <ToolsIndexList groups={CALCULATOR_GROUPS} />
    </div>
  );
}
