import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About JiPange",
  description:
    "Why we built Kenya's free, anonymous financial planning copilot — and what it is (and isn't).",
};

export default function AboutPage() {
  return (
    <div className="flex flex-1 flex-col items-center px-6 py-12">
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-semibold text-primary">About JiPange</h1>
        <p className="mt-1 text-sm text-ink-soft">Built in Nairobi. Free forever.</p>

        <div className="mt-10 space-y-10 text-sm leading-relaxed text-ink-soft">
          <section>
            <h2 className="text-base font-semibold text-primary">Why we built this</h2>
            <p className="mt-2">
              Most Kenyans don&apos;t know their real take-home pay until payday. Many are
              stuck in Fuliza and M-Shwari cycles they could break with a clearer picture of
              their cash flow. Side hustlers and jua kali workers have no planning tools for
              irregular income. And the good financial calculators? Either built for the West,
              locked behind a login, or priced in dollars.
            </p>
            <p className="mt-3">
              JiPange started from a simple frustration: there was no free, honest,
              Kenya-specific tool that showed you exactly what NSSF, SHIF, and the Affordable
              Housing Levy take from your salary — let alone one that understood M-Pesa fees,
              DhowCSD bonds, SACCO rates, or what rolling Fuliza for three months actually costs.
            </p>
            <p className="mt-3 font-medium text-primary">
              So we built it. Free, and yours: every calculator runs in your browser and sends nothing anywhere. Two things are optional and asked for — an AI action plan, and saving a plan across devices. Neither is required, and the privacy notice says exactly what each one sends.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-primary">What JiPange does</h2>
            <ul className="mt-3 space-y-3">
              <li className="flex gap-3">
                <span className="text-lg" aria-hidden="true">🧮</span>
                <div>
                  <strong className="text-primary">18+ free calculators</strong>
                  <p className="mt-0.5">
                    Take-home pay, savings goals, loans, FIRE number, inflation, SACCO vs bank,
                    Fuliza cost, guarantor risk, KPLC bill optimizer, DhowCSD returns, and more
                    — all running entirely in your browser.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="text-lg" aria-hidden="true">🎯</span>
                <div>
                  <strong className="text-primary">Goal planners</strong>
                  <p className="mt-0.5">
                    Reverse-engineer exactly how much to save per month for education, a home
                    deposit, emergency fund, business capital, or retirement — with Kenyan
                    vehicles like MMFs, SACCOs, and DhowCSD.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="text-lg" aria-hidden="true">🗺</span>
                <div>
                  <strong className="text-primary">5-question financial journey</strong>
                  <p className="mt-0.5">
                    Answer five anonymous questions about your situation and get a personalised
                    action plan with specific next steps. No signup. No phone number. Done in
                    90 seconds.
                  </p>
                </div>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-primary">What JiPange is NOT</h2>
            <ul className="mt-3 space-y-2">
              <li className="flex gap-2">
                <span className="text-danger font-semibold">✗</span>
                <span>
                  A licensed financial advisor, broker, or investment manager — always confirm
                  major decisions with a certified professional.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-danger font-semibold">✗</span>
                <span>
                  A bank, lending product, or investment platform — we calculate, we don&apos;t
                  hold money.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-danger font-semibold">✗</span>
                <span>
                  A data company — we don&apos;t sell, share, or even store your financial
                  inputs. There&apos;s nothing to sell.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-danger font-semibold">✗</span>
                <span>
                  An app that requires your phone number, national ID, email, or any
                  registration whatsoever.
                </span>
              </li>
            </ul>
          </section>

          <section className="rounded-2xl border border-[#CFE3CF] bg-[#f0f7f0] px-5 py-5">
            <h2 className="text-base font-semibold text-success-deep">
              <span aria-hidden="true">🔒 </span>Privacy by design
            </h2>
            <p className="mt-2 text-success-deep">
              JiPange is completely anonymous. Your calculations run in your browser. Any
              profile data you enter stays in your browser&apos;s local storage — never on our
              servers. Clear your browser data and it&apos;s gone, with nothing held anywhere
              else.
            </p>
            <p className="mt-2 text-success-deep">
              The only time data touches a server is the AI-powered journey: anonymous answers
              (no name, no phone, no ID) are sent to generate your action plan. That&apos;s
              the full extent of our data footprint.
            </p>
            <p className="mt-2">
              <Link href="/privacy" className="font-medium text-success-deep underline">
                Read our full privacy policy →
              </Link>
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-primary">Built for Kenyan realities</h2>
            <p className="mt-2">
              JiPange is calibrated for Kenya&apos;s specific financial landscape:
            </p>
            <ul className="mt-3 space-y-1.5 pl-5 list-disc">
              <li>KRA PAYE bands and personal reliefs (Finance Act 2025/26)</li>
              <li>NSSF Act 2013 phased tiers (Year 4, 2026) and SHIF at 2.75%</li>
              <li>Affordable Housing Levy (1.5% matched by employer)</li>
              <li>CBK infrastructure bond yields, regulated SACCO rates, MMF benchmarks</li>
              <li>M-Pesa ecosystem costs: Fuliza daily fees, M-Shwari facilitation, Paybill charges</li>
              <li>DhowCSD minimum investment and CMA bond market access</li>
              <li>KNBS inflation data and purchasing power erosion</li>
            </ul>
            <p className="mt-3">
              We cite our sources. When the law changes — and Kenyan tax law changes every
              Finance Act — we update the calculators.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-primary">Contact</h2>
            <p className="mt-2">
              Spotted an error in a calculation? Have a tool idea that would help everyday
              Kenyans? We&apos;d genuinely like to hear it.{" "}
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
              Start my 5-question journey
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
