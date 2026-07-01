import Link from "next/link";
import BrandHeader from "@/components/BrandHeader";

const CALCULATORS = [
  {
    href: "/tools/take-home-pay",
    icon: "💰",
    title: "Take-Home Pay Calculator",
    description: "See your exact net salary after PAYE, NSSF, and SHIF deductions.",
  },
  {
    href: "/tools/savings-goal",
    icon: "🎯",
    title: "Savings Goal Calculator",
    description: "Work out how much to save each month to hit a target amount.",
  },
  {
    href: "/tools/investment-returns",
    icon: "📈",
    title: "Investment Returns Calculator",
    description: "Project how a lump sum plus monthly contributions grows over time.",
  },
  {
    href: "/tools/fire-number",
    icon: "🔥",
    title: "FIRE Number Calculator",
    description: "Find your Financial Independence number and how many years to reach it.",
  },
  {
    href: "/tools/money-runway",
    icon: "⏳",
    title: "Money Runway Calculator",
    description: "See how long your savings will last at a given monthly withdrawal.",
  },
  {
    href: "/tools/education-savings",
    icon: "🎓",
    title: "Kids' Education Savings Calculator",
    description: "Plan monthly savings toward a future school fees target.",
  },
  {
    href: "/tools/loan-repayment",
    icon: "🏦",
    title: "Loan / HELB Repayment Calculator",
    description: "See your monthly installment and total interest on any loan.",
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
      <div className="mt-8 w-full max-w-md space-y-3">
        {CALCULATORS.map((calc) => (
          <Link
            key={calc.href}
            href={calc.href}
            className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm transition-colors hover:bg-[#F1ECE3]"
          >
            <span className="text-2xl">{calc.icon}</span>
            <span className="flex-1">
              <span className="block text-sm font-semibold text-primary">{calc.title}</span>
              <span className="block text-xs text-[#4B4238]">{calc.description}</span>
            </span>
            <span className="text-primary">→</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
