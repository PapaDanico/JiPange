import Link from "next/link";
import { PESA_SMART_CHANNEL, PESA_SMART_NAME } from "@/lib/channel";

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
      /* Reachable, or it is not shipped.
       *
       * The same rule that put /licensing here, and the same one that had
       * Mwangaza's rates feed live and CORS-open for months with exactly one
       * reference to it anywhere in the codebase — an internal import. A page
       * findable only from the tools index is findable only by someone already
       * browsing tools, which is not the reader this one is for. */
      { href: "/tools/where-to-save", label: "Where to save" },
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
      { href: "/support", label: "Supporting JiPange" },
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
            {/* Measured at 390px, these links were 14px tall on a 22px pitch
                (14 + an 8px gap). WCAG 2.5.8 asks for a 24x24 target, and the
                spacing exception does not rescue it either: 24px circles on a
                22px pitch overlap. Twenty-five links, on every page.

                `block py-1.5` makes the whole row the target rather than the
                glyphs — 26px tall — and the gap drops to 0.5 so the pitch lands
                at 28px, clearing the floor while adding only ~4px per link
                instead of the ~30 a full 44px target would cost a stacked
                mobile footer. Height is bought from the gap, not from the
                page. */}
            <ul className="mt-2 space-y-0.5">
              {column.links.map((link) => (
                <li key={link.href + link.label}>
                  <Link
                    href={link.href}
                    className="block py-1.5 hover:text-primary hover:underline"
                  >
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
          {/* Reachable, or it is not shipped.
            *
            * /licensing went in with nothing linking to it — no footer entry,
            * no nav, no sitemap reference. A page you can only reach by typing
            * the URL is a page nobody reaches, and the whole point of it is
            * that an institution can find how to work with us. */}
          <Link href="/licensing" className="underline hover:text-primary">
            Licensing
          </Link>
          {/* The quiet, permanent placement — the same standing the money ask
            * gets, and for the same reason. A reader who wants more of us can
            * always find it here; nobody is stopped on their way to a
            * calculator and asked for their attention first. */}
          <a
            href={PESA_SMART_CHANNEL}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-primary"
          >
            {PESA_SMART_NAME} on WhatsApp
          </a>
        </div>
      </div>
    </footer>
  );
}
