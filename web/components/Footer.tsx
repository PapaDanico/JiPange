import Link from "next/link";

const COLUMNS: { heading: string; links: { href: string; label: string }[] }[] = [
  {
    heading: "Goal planners",
    links: [
      { href: "/planners/education", label: "Education fees" },
      { href: "/planners/home", label: "Home deposit" },
      { href: "/planners/emergency", label: "Emergency fund" },
      { href: "/planners/business", label: "Business capital" },
      { href: "/planners/retirement", label: "Retirement" },
      { href: "/planners/hustle", label: "Cycle venture planner" },
    ],
  },
  {
    heading: "Calculators",
    links: [
      { href: "/tools/salary", label: "Salary & Pay Hub" },
      { href: "/tools/fire-number", label: "FIRE number" },
      { href: "/tools/investment-returns", label: "Investment returns" },
      { href: "/tools/loan-repayment", label: "Loan repayment" },
      { href: "/tools/debt-escape", label: "Debt Stack Buster" },
      { href: "/tools/money-runway", label: "Money runway" },
      { href: "/tools", label: "All calculators →" },
    ],
  },
  {
    heading: "Company",
    links: [
      { href: "/partners", label: "Partners & products" },
      { href: "/faq", label: "Money questions, answered" },
      { href: "/glossary", label: "Money words, decoded" },
      { href: "/about", label: "About JiPange" },
      { href: "/terms", label: "Terms of use" },
      { href: "/privacy", label: "Privacy policy" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-border px-6 py-8 text-xs text-ink-soft print:hidden">
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-3">
        {COLUMNS.map((column) => (
          <div key={column.heading}>
            <h2 className="text-[11px] font-semibold uppercase tracking-wide text-primary">
              {column.heading}
            </h2>
            <ul className="mt-2 space-y-1.5">
              {column.links.map((link) => (
                <li key={link.href + link.label}>
                  <Link href={link.href} className="hover:text-primary hover:underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-8 flex max-w-5xl flex-col items-center gap-2 border-t border-border pt-4 text-center sm:flex-row sm:justify-between sm:text-left">
        <p>
          © {new Date().getFullYear()} JiPange. For guidance only — not licensed financial
          advice.
        </p>
        <div className="flex gap-4">
          <Link href="/about" className="underline hover:text-primary">
            About
          </Link>
          <Link href="/terms" className="underline hover:text-primary">
            Terms
          </Link>
          <Link href="/privacy" className="underline hover:text-primary">
            Privacy
          </Link>
        </div>
      </div>
    </footer>
  );
}
