import Link from "next/link";

const COLUMNS: { heading: string; links: { href: string; label: string }[] }[] = [
  {
    heading: "Goal planners",
    links: [
      { href: "/planners/education", label: "Education" },
      { href: "/planners/home", label: "Home deposit" },
      { href: "/planners/emergency", label: "Emergency fund" },
      { href: "/planners/business", label: "Business capital" },
      { href: "/planners/retirement", label: "Retirement" },
      { href: "/planners/hustle", label: "Hustle income smoother" },
    ],
  },
  {
    heading: "Popular calculators",
    links: [
      { href: "/tools/take-home-pay", label: "Take-home pay" },
      { href: "/tools/fire-number", label: "FIRE number" },
      { href: "/tools/loan-repayment", label: "Loan repayment" },
      { href: "/tools/tax-shield", label: "KRA tax shield" },
      { href: "/tools/guarantor-shield", label: "Sacco guarantor shield" },
      { href: "/tools/fuliza-cost", label: "Fuliza cost" },
      { href: "/tools", label: "All calculators →" },
    ],
  },
  {
    heading: "Your journey",
    links: [
      { href: "/profile", label: "Start my plan" },
      { href: "/picture", label: "My Pesa Picture" },
      { href: "/plan", label: "My action plan" },
      { href: "/partners", label: "Partners & products" },
      { href: "/about", label: "About JiPange" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-[#E5E0D8] px-6 py-8 text-xs text-[#4B4238] print:hidden">
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
      <div className="mx-auto mt-8 flex max-w-5xl flex-col items-center gap-2 border-t border-[#E5E0D8] pt-4 text-center sm:flex-row sm:justify-between sm:text-left">
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
