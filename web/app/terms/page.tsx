import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "The terms that govern your use of JiPange.",
};

export default function TermsPage() {
  return (
    <div className="flex flex-1 flex-col items-center px-6 py-12">
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-semibold text-primary">Terms of Use</h1>
        <p className="mt-1 text-sm text-ink-soft">Last updated: July 2026</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-ink-soft">
          <section>
            <h2 className="text-base font-semibold text-primary">1. Acceptance of these terms</h2>
            <p className="mt-2">
              By using JiPange (the &ldquo;Service&rdquo;), you agree to these Terms of Use.
              If you do not agree, please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-primary">2. What JiPange is</h2>
            <p className="mt-2">
              JiPange provides free financial calculators, goal planners, and an AI-generated
              action plan based on anonymous inputs you provide (such as income range, savings
              situation, and goals). The Service is intended as a general educational and
              planning tool for personal use. No account or registration is required.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-primary">3. Not licensed financial advice</h2>
            <p className="mt-2">
              JiPange is not a licensed financial advisor, tax consultant, or investment
              manager, and nothing on this Service constitutes professional financial, tax,
              legal, or investment advice. Calculator results and AI-generated recommendations
              are estimates based on the figures you enter and general assumptions (such as the
              KRA PAYE bands in effect at the time of the calculation) — they may not reflect
              your exact tax liability, statutory deductions, or the best decision for your
              circumstances.
            </p>
            <p className="mt-2">
              Always confirm figures against your payslip or KRA&apos;s own tools, and consult
              a licensed professional before making significant financial decisions.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-primary">4. Eligibility</h2>
            <p className="mt-2">
              You must be at least 18 years old to use JiPange.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-primary">5. Data and privacy</h2>
            <p className="mt-2">
              JiPange does not require registration to use any calculator, and every
              calculator — including the action plan — computes in your browser. There is no
              account and nothing to sign in to, so nothing you enter reaches us. Moving a
              plan to another device is an exported backup file you carry yourself. See our{" "}
              <Link href="/privacy" className="underline hover:text-primary">
                Privacy Policy
              </Link>{" "}
              for the full details.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-primary">6. Acceptable use</h2>
            <p className="mt-2">
              You agree not to misuse the Service — including attempting to disrupt it, scrape
              it at scale, or use it for any unlawful purpose.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-primary">7. Third-party services and affiliate links</h2>
            <p className="mt-2">
              JiPange relies on one third-party provider to operate: Netlify, which hosts
              the site and processes outside Kenya. Supabase previously handled sign-in and
              saved plans; both were removed in July 2026 and it receives nothing. Your use
              of the site is also subject to Netlify&apos;s own terms, and our{" "}
              <Link href="/privacy" className="underline hover:text-primary">
                privacy notice
              </Link>{" "}
              sets out what each one receives.
            </p>
            <p className="mt-2">
              Some calculator result pages link to regulated Kenyan financial products — money
              market funds, Treasury bills via DhowCSD, SACCOs and pension providers.{" "}
              <strong>
                We currently hold no affiliate arrangement with any of them and earn nothing if
                you open an account.
              </strong>{" "}
              They are plain links carrying no referral identifier. If that ever changes, the
              product card itself will say so — the affiliate status of every listed product is
              a field on the card, not a footnote here. We link only to CMA-, CBK-, SASRA- or
              RBA-regulated products, and inclusion is never a statement that something suits
              your circumstances.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-primary">8. No warranty</h2>
            <p className="mt-2">
              The Service is provided &ldquo;as is&rdquo; without warranties of any kind,
              express or implied. We do not guarantee that calculations, projections, or
              AI-generated recommendations are accurate, complete, or suitable for your
              situation. Tax rules and rates change — always verify against official sources.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-primary">9. Limitation of liability</h2>
            <p className="mt-2">
              To the fullest extent permitted by law, JiPange and its operators are not liable
              for any loss or damage arising from your use of, or reliance on, the Service,
              including financial decisions made based on calculator results or AI-generated
              plans.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-primary">10. Changes to these terms</h2>
            <p className="mt-2">
              We may update these Terms from time to time. Continued use of the Service after
              a change means you accept the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-primary">11. Governing law</h2>
            <p className="mt-2">These Terms are governed by the laws of Kenya.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-primary">12. Contact</h2>
            <p className="mt-2">
              Questions about these Terms can be sent to{" "}
              <a
                href="mailto:hello@jipangefinance.org"
                className="font-medium text-primary underline"
              >
                hello@jipangefinance.org
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
