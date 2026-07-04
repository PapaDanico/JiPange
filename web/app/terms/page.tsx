import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "The terms that govern your use of JiPange.",
};

export default function TermsPage() {
  return (
    <div className="flex flex-1 flex-col items-center px-6 py-12">
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-semibold text-primary">Terms of Use</h1>
        <p className="mt-1 text-sm text-[#4B4238]">Last updated: 1 July 2026</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-[#4B4238]">
          <section>
            <h2 className="text-base font-semibold text-primary">1. Acceptance of these terms</h2>
            <p className="mt-2">
              By using JiPange (the &ldquo;Service&rdquo;), you agree to these Terms of Use. If you
              do not agree, please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-primary">2. What JiPange is</h2>
            <p className="mt-2">
              JiPange provides financial calculators and an AI-generated action plan based on
              information you provide (such as your income, county, and dependants). The Service
              is intended as a general educational and planning tool for personal use.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-primary">3. Not licensed financial advice</h2>
            <p className="mt-2">
              JiPange is not a licensed financial advisor, tax consultant, or investment manager,
              and nothing on this Service constitutes professional financial, tax, legal, or
              investment advice. Calculator results and AI-generated recommendations are estimates
              based on the figures you enter and general assumptions (such as the KRA PAYE bands
              in effect at the time) — they may not reflect your exact tax liability, statutory
              deductions, or the best decision for your circumstances. Always confirm figures
              against your payslip or KRA&apos;s own tools, and consult a licensed professional
              before making significant financial decisions.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-primary">4. Eligibility</h2>
            <p className="mt-2">
              You must be at least 18 years old to create a profile or account on JiPange.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-primary">5. Guest mode and accounts</h2>
            <p className="mt-2">
              You can use the calculators and generate a one-off action plan without creating an
              account (&ldquo;guest mode&rdquo;) — in guest mode, your inputs stay in your
              browser and are not sent to our servers for storage. If you create an account, we
              store the profile information and plans you generate so you can return to them
              later. See our{" "}
              <a href="/privacy" className="underline hover:text-primary">
                Privacy Policy
              </a>{" "}
              for details.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-primary">6. Acceptable use</h2>
            <p className="mt-2">
              You agree not to misuse the Service — including attempting to disrupt it, access
              other users&apos; data, or use it for any unlawful purpose.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-primary">7. Third-party services</h2>
            <p className="mt-2">
              JiPange relies on third-party providers to operate, including Supabase (accounts and
              data storage), Anthropic (to generate your AI action plan), and Netlify (hosting).
              Your use of features that rely on these providers is also subject to their own terms
              and policies.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-primary">8. No warranty</h2>
            <p className="mt-2">
              The Service is provided &ldquo;as is&rdquo; without warranties of any kind, express
              or implied. We do not guarantee that calculations, projections, or AI-generated
              recommendations are accurate, complete, or suitable for your situation.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-primary">9. Limitation of liability</h2>
            <p className="mt-2">
              To the fullest extent permitted by law, JiPange and its operators are not liable for
              any loss or damage arising from your use of, or reliance on, the Service, including
              financial decisions made based on calculator results or AI-generated plans.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-primary">10. Changes to these terms</h2>
            <p className="mt-2">
              We may update these Terms from time to time. Continued use of the Service after a
              change means you accept the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-primary">11. Governing law</h2>
            <p className="mt-2">These Terms are governed by the laws of Kenya.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-primary">12. Contact</h2>
            <p className="mt-2">
              Questions about these Terms can be sent to the contact address published on our
              website.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
