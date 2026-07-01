import type { Metadata } from "next";
import BrandHeader from "@/components/BrandHeader";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How JiPange collects, uses, and protects your information.",
};

export default function PrivacyPage() {
  return (
    <div className="flex flex-1 flex-col items-center px-6 py-12">
      <div className="w-full max-w-2xl">
        <BrandHeader />
        <h1 className="text-2xl font-semibold text-primary">Privacy Policy</h1>
        <p className="mt-1 text-sm text-[#4B4238]">Last updated: 1 July 2026</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-[#4B4238]">
          <section>
            <p>
              This policy explains what information JiPange collects, why, and how it is
              protected, in line with Kenya&apos;s Data Protection Act, 2019.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-primary">1. Information we collect</h2>
            <p className="mt-2">If you use JiPange in guest mode, your inputs stay in your browser and are never sent to our servers.</p>
            <p className="mt-2">If you create an account, we store:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Your email address (used for magic-link sign-in via Supabase Auth)</li>
              <li>
                Your profile: full name, age, county, monthly gross salary, number of dependants,
                and Chama/SACCO membership
              </li>
              <li>
                Your generated plans: computed take-home pay, savings capacity, projected wealth
                figures, and the AI-generated action plan text
              </li>
              <li>
                Which channel you used to share a plan (e.g. WhatsApp) — we do not store the
                content of what you shared
              </li>
            </ul>
            <p className="mt-2">
              We do not collect or store the inputs you enter into the standalone calculators
              (e.g. loan amount, savings target) — those are computed entirely in your browser.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-primary">2. How we use your information</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>To calculate your take-home pay, budget split, and wealth projections</li>
              <li>To generate your personalised AI action plan</li>
              <li>To let you sign back in and see your saved plan</li>
              <li>To monitor and improve the reliability of the Service (e.g. AI response quality and cost)</li>
            </ul>
            <p className="mt-2">We do not sell your personal information to third parties.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-primary">3. Third parties who process your data</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                <strong>Supabase</strong> — hosts our database and authentication. Your account
                and profile data are stored with Supabase under access controls that ensure only
                you can read or write your own records.
              </li>
              <li>
                <strong>Anthropic</strong> — we send your profile figures (not your name or email)
                to Anthropic&apos;s Claude API to generate your action plan text.
              </li>
              <li>
                <strong>Netlify</strong> — hosts the JiPange website and application.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-primary">4. Data security</h2>
            <p className="mt-2">
              Your account data is protected by row-level security policies that restrict access
              to your own records only. Data is transmitted over encrypted (HTTPS) connections.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-primary">5. Your rights</h2>
            <p className="mt-2">
              Under the Data Protection Act, 2019, you have the right to access, correct, or
              request deletion of your personal data. You can update your profile at any time from
              within the app, or contact us to request full deletion of your account and
              associated data.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-primary">6. Data retention</h2>
            <p className="mt-2">
              We retain your account data for as long as your account remains active. If you
              delete your account, your profile and plan data are removed from our active
              database.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-primary">7. Local storage (guest mode)</h2>
            <p className="mt-2">
              In guest mode, your profile and calculation results are kept in your browser&apos;s
              local storage so you can move between screens. This data never leaves your device
              and is cleared if you clear your browser data.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-primary">8. Children&apos;s privacy</h2>
            <p className="mt-2">
              JiPange is intended for users aged 18 and over and does not knowingly collect
              information from children.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-primary">9. Changes to this policy</h2>
            <p className="mt-2">
              We may update this policy from time to time. Material changes will be reflected by
              updating the date at the top of this page.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-primary">10. Contact</h2>
            <p className="mt-2">
              Questions about this policy, or requests to access or delete your data, can be sent
              to the contact address published on our website.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
