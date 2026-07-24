import type { Metadata } from "next";
import Link from "next/link";
import DataControls from "@/components/data/DataControls";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "JiPange collects no personal data. All calculations run in your browser.",
};

export default function PrivacyPage() {
  return (
    <div className="flex flex-1 flex-col items-center px-6 py-12">
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-semibold text-primary">Privacy Policy</h1>
        <p className="mt-1 text-sm text-ink-soft">Last updated: July 2026</p>

        <div className="mt-4 rounded-2xl border border-[#CFE3CF] bg-[#f0f7f0] px-5 py-4 text-sm text-success-deep">
          <strong>Short version:</strong> JiPange does not collect, store, or transmit any
          personal information. All calculations run in your browser. Anything you enter stays
          on your device only.
        </div>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-ink-soft">
          <section>
            <p>
              This policy explains JiPange&apos;s data practices, in line with Kenya&apos;s
              Data Protection Act, 2019.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-primary">1. What information we collect</h2>
            <p className="mt-2 font-medium">The short answer: none.</p>
            <p className="mt-2">
              JiPange has no accounts, no registration, no login, and no sign-up form. We do
              not collect your name, email address, phone number, national ID, or any other
              personal identifier.
            </p>
            <p className="mt-2">
              All calculator inputs and results are computed entirely inside your browser. We
              never receive them.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-primary">
              2. What stays on your device (local storage)
            </h2>
            <p className="mt-2">
              If you use the profile builder, goal planners, or the 5-question journey, your
              inputs are saved in your browser&apos;s <code>localStorage</code> so you can
              return to them. The following keys may be written to your device:
            </p>
            <ul className="mt-3 space-y-1.5 pl-5 list-disc">
              <li>
                <code>jipange:profile</code> — salary, age, county, dependants (what you
                enter in the profile form)
              </li>
              <li>
                <code>jipange:calculations</code> — computed take-home pay, budget split,
                projections
              </li>
              <li>
                <code>jipange:plan</code> — your AI-generated action plan text
              </li>
              <li>
                <code>jipange:journey</code> — answers to the 5-question journey
              </li>
              <li>
                <code>jipange:goals</code> — goals you commit to from the planners
              </li>
              <li>
                <code>jipange:journey-draft</code> — partial progress through the journey
                (cleared on completion)
              </li>
              <li>
                <code>jipange:recent-tools</code> — which calculators you recently visited
              </li>
              <li>
                <code>jipange:20th-challenge</code> and <code>jipange:20th-challenge:checkins</code>{" "}
                — your monthly savings commitment and check-in history for the 20th-to-20th
                challenge (stored locally, never transmitted)
              </li>
              <li>
                <code>jipange:tool:*</code> — individual calculator inputs (goal amount,
                income, loan principal, etc.) preserved across page refreshes
              </li>
            </ul>
            <p className="mt-3">
              None of this data leaves your device. You can delete it at any time by clearing
              your browser&apos;s site data for jipangefinance.org.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-primary">
              3. The AI action plan (the one server call)
            </h2>
            <p className="mt-2">
              When you complete the 5-question journey or submit the profile form to request
              an AI action plan, your answers — income range, savings situation, goals, with
              no name, phone number, or any identifier — are sent to our server to generate
              a personalised plan. These anonymous figures are passed to Anthropic&apos;s
              Claude API to produce the plan text, which is then returned to your browser.
            </p>
            <p className="mt-2">
              We do not log or persistently store these inputs or outputs. Anthropic and
              Netlify may retain infrastructure-level logs for security and abuse monitoring
              purposes (typically 30 days) — see their privacy policies for details.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-primary">4. Third parties</h2>
            <ul className="mt-2 space-y-2 list-disc pl-5">
              <li>
                <strong>Anthropic</strong> — generates the AI action plan from the anonymous
                inputs you provide.
              </li>
              <li>
                <strong>Netlify</strong> — hosts the JiPange website and serverless
                functions. Netlify may collect anonymous aggregate analytics (page views,
                countries) as part of standard hosting telemetry.
              </li>
              <li>
                <strong>Linked financial products</strong> — some calculator result pages
                show links to regulated Kenyan financial products (Money Market Funds, Treasury
                Bills via DhowCSD, etc.). These links go through our <code>/go/</code> redirect
                route. When you click through, you leave JiPange and the destination site&apos;s
                own privacy policy applies. JiPange may earn a small commission on referrals
                where an affiliate relationship exists; this is disclosed on each product card.
              </li>
            </ul>
            <p className="mt-2">
              We do not use advertising networks, tracking pixels, or third-party analytics
              SDKs.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-primary">5. Cookies</h2>
            <p className="mt-2">
              JiPange does not set any cookies. The <code>localStorage</code> entries in
              section 2 are not cookies — they are device-local key-value storage that is
              never transmitted in HTTP requests.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-primary">
              6. Your rights under the Data Protection Act, 2019
            </h2>
            <p className="mt-2">
              Because we hold no personal data about you, there is nothing for us to provide,
              correct, or delete on our end. You can download, restore, or erase your
              local data with the controls below. If you have questions, contact us at{" "}
              <a
                href="mailto:hello@jipangefinance.app"
                className="font-medium text-primary underline"
              >
                hello@jipangefinance.app
              </a>
              .
            </p>
          </section>

          <DataControls />

          <section>
            <h2 className="text-base font-semibold text-primary">7. Children&apos;s privacy</h2>
            <p className="mt-2">
              JiPange is intended for users aged 18 and over. We do not knowingly collect
              information from children — and by design, we collect no information from
              anyone.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-primary">8. Changes to this policy</h2>
            <p className="mt-2">
              We may update this policy from time to time. Material changes will be reflected
              by updating the date at the top of this page.
            </p>
          </section>
        </div>

        <p className="mt-8 text-xs text-faint">
          Questions?{" "}
          <Link href="/about" className="underline hover:text-primary">
            Learn more about JiPange
          </Link>{" "}
          or read our{" "}
          <Link href="/terms" className="underline hover:text-primary">
            Terms of Use
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
