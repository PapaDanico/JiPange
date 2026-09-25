import type { Metadata } from "next";
import Link from "next/link";
import { attributionFor } from "@/lib/statutes";
import { TOOL_META } from "@/lib/tool-meta";
import { attribution, inflationAttribution } from "@/lib/rates-feed";
import { CBK_BSAR_2025_CITE } from "@/lib/kenya-stats";

export const metadata: Metadata = {
  title: "About JiPange",
  description:
    "Why we built Kenya's free, anonymous financial planning companion — the information standard behind every figure, and what JiPange is (and isn't).",
};

/* Derived, as on the homepage. This page said "18+ free calculators" while
 * the site carried more; a count typed into prose is a count that goes stale
 * the day a tool is added. */
const TOOL_COUNT = Object.keys(TOOL_META).filter((h) => h.startsWith("/tools/")).length;

const STANDARD = [
  {
    icon: "🏛️",
    title: "From the source",
    body: "Every figure comes from the institution that publishes it — the Central Bank, KNBS, KRA and the Finance Acts, the RBA, the CMA, SASRA — not from a summary of a summary.",
  },
  {
    icon: "📅",
    title: "Dated and attributed",
    body: "A number is only true on a date. Every rate and statistic on JiPange carries its publisher and the period it describes, and each one has a review date after which our own tests refuse to ship it unchecked.",
  },
  {
    icon: "🧮",
    title: "Computed, not typed",
    body: "Headline figures are worked out by the same engine the calculators use, so a page can never say one thing while the tool beneath it says another.",
  },
  {
    icon: "🔎",
    title: "Honest about age",
    body: "When our rates source has not refreshed, we say so plainly rather than let an old number look new. A dated figure that admits its age is more useful than a fresh-looking guess.",
  },
];

export default function AboutPage() {
  const sources = [
    `Treasury bill yields — ${attribution()}, shown after withholding tax`,
    `Inflation — ${inflationAttribution()}`,
    `Banking-sector rates, deposits, lending and mobile money — ${CBK_BSAR_2025_CITE}`,
    `PAYE bands and personal relief — ${attributionFor("paye")}`,
    `${attributionFor("nssf")}; SHIF at 2.75% under the Social Health Insurance Act; the 1.5% Affordable Housing Levy`,
    "Pensions — Retirement Benefits Authority surveys and industry briefs",
    "Money market funds — Capital Markets Authority quarterly reports",
    "SACCO dividends and deposit rates — SASRA supervision reports",
    "Financial inclusion and literacy — FinAccess Household Survey 2024 (CBK, KNBS, FSD Kenya)",
    "Fuliza — Safaricom PLC annual results",
  ];

  return (
    <div className="flex flex-1 flex-col items-center px-6 py-12">
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-semibold text-primary">About JiPange</h1>
        <p className="mt-1 text-sm text-ink-soft">Built in Nairobi. Free for every Kenyan.</p>

        <div className="mt-10 space-y-10 text-sm leading-relaxed text-ink-soft">
          <section>
            <h2 className="text-base font-semibold text-primary">Why we built this</h2>
            <p className="mt-2">
              Kenyans are remarkably active with money — saving in chamas
              and SACCOs, investing through DhowCSD, running side businesses alongside a salary,
              supporting family near and far. What has often been missing is not effort. It is
              clear, trustworthy information at the moment a decision is being made.
            </p>
            <p className="mt-3">
              What will NSSF, SHIF and the Housing Levy actually leave in my pay? What does
              carrying Fuliza for a month really cost? Is a Treasury bill worth the wait over a
              money market fund? Good answers existed — scattered across regulators&apos;
              reports, statutes and auction results. JiPange brings them together, keeps them
              current, and turns them into a next step you can take today.
            </p>
            <p className="mt-3 font-medium text-primary">
              Free, and yours. Every calculator runs in your browser. There is no account, no
              sign-in and no AI provider — even your action plan is worked out on your own device.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-primary">Information is our pillar</h2>
            <p className="mt-2">
              A figure on a money website gets acted on. So we hold every number to one standard:
            </p>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {STANDARD.map((s) => (
                <li key={s.title} className="rounded-2xl border border-border bg-white p-4">
                  <p className="font-semibold text-primary">
                    <span aria-hidden="true">{s.icon} </span>
                    {s.title}
                  </p>
                  <p className="mt-1">{s.body}</p>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-primary">Where our numbers come from</h2>
            <ul className="mt-3 list-disc space-y-1.5 pl-5">
              {sources.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
            <p className="mt-3">
              When the law changes — and Kenyan tax law changes with every Finance Act — or a
              regulator publishes new figures, we update the calculators and the dates beside them.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-primary">What JiPange does</h2>
            <ul className="mt-3 space-y-3">
              <li className="flex gap-3">
                <span className="text-lg" aria-hidden="true">🧮</span>
                <div>
                  <strong className="text-primary">{TOOL_COUNT} free calculators</strong>
                  <p className="mt-0.5">
                    Take-home pay, savings goals, loans, your FIRE number, inflation, SACCO versus
                    bank, the true cost of Fuliza, guarantor risk, your KPLC band, a DhowCSD bill
                    ladder and more — each one running entirely in your browser.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="text-lg" aria-hidden="true">🎯</span>
                <div>
                  <strong className="text-primary">Goal planners</strong>
                  <p className="mt-0.5">
                    Work out what to set aside each month for school fees, a home deposit, an
                    emergency fund, business capital or retirement — using the savings vehicles
                    actually available in Kenya.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="text-lg" aria-hidden="true">🗺</span>
                <div>
                  <strong className="text-primary">A 90-second money check</strong>
                  <p className="mt-0.5">
                    Five anonymous taps about your situation, and a personalised plan with
                    specific next steps. No signup, no phone number.
                  </p>
                </div>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-primary">What JiPange is not</h2>
            <ul className="mt-3 space-y-2">
              <li className="flex gap-2">
                <span className="font-semibold text-muted" aria-hidden="true">—</span>
                <span>
                  A licensed financial adviser, broker or investment manager. For major decisions,
                  a certified professional who knows your full situation is worth consulting.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-muted" aria-hidden="true">—</span>
                <span>
                  A bank, lender or investment platform. We calculate; we never hold your money.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-muted" aria-hidden="true">—</span>
                <span>
                  A data business. Your financial inputs stay on your device, so there is nothing
                  to sell.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-muted" aria-hidden="true">—</span>
                <span>
                  An app that asks for your phone number, national ID or email to get started.
                </span>
              </li>
            </ul>
          </section>

          {/* Corrected September 2026. This box said "The only time data touches
              a server is the AI-powered journey", directly contradicting the
              paragraph above it. There is no AI provider, and since the unused
              journey upload was removed the answers never leave the device. */}
          <section className="rounded-2xl border border-[#CFE3CF] bg-[#f0f7f0] px-5 py-5">
            <h2 className="text-base font-semibold text-success-deep">
              <span aria-hidden="true">🔒 </span>Privacy by design
            </h2>
            <p className="mt-2 text-success-deep">
              JiPange is anonymous. Your calculations, your journey answers and any profile details
              you choose to add stay in your browser&apos;s storage on your own device. Clear your
              browser data and they are gone, with nothing held anywhere else.
            </p>
            <p className="mt-2 text-success-deep">
              Like any website, our host sees the ordinary technical details of a visit — the
              privacy notice sets out exactly what, and for how long.
            </p>
            <p className="mt-2">
              <Link href="/privacy" className="font-medium text-success-deep underline">
                Read the full privacy notice →
              </Link>
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-primary">Help us keep it right</h2>
            <p className="mt-2">
              Spotted a figure that looks out of date, or have an idea for a tool that would help
              everyday Kenyans? A reader with a fresh payslip or a new prospectus often notices a
              change before we do, and we would genuinely like to hear from you.{" "}
              <a
                href="mailto:hello@jipangefinance.org"
                className="font-medium text-primary underline"
              >
                hello@jipangefinance.org
              </a>
            </p>
          </section>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/tools"
              className="flex h-12 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-white transition-colors hover:bg-primary-deep"
            >
              Explore the calculators →
            </Link>
            <Link
              href="/profile"
              className="flex h-12 items-center justify-center rounded-full border border-primary px-6 text-sm font-semibold text-primary transition-colors hover:bg-canvas"
            >
              Start my 90-second money check
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
