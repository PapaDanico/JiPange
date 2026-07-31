import type { Metadata } from "next";
import Link from "next/link";
import DataControls from "@/components/data/DataControls";
import {
  COLLECTED_BY_HOSTING,
  CONTROLLER,
  DEVICE_ONLY,
  DPA_RIGHTS,
  ODPC,
  ONLY_IF_YOU_CONTRIBUTE,
  ONLY_IF_YOU_SIGN_IN,
  PROCESSORS,
  SENT_FOR_THE_AI_PLAN,
  type DataItem,
} from "@/lib/privacy-facts";

export const metadata: Metadata = {
  title: "Privacy notice",
  description:
    "What JiPange does with your data, written to the notification duty in Kenya's Data Protection Act, 2019. Most of it never leaves your device; where it does, this says exactly where it goes.",
};

/**
 * Rebuilt around what the code actually does.
 *
 * The previous version opened with "JiPange does not collect, store, or
 * transmit any personal information" and stated there was no login and no name
 * collected. The product asks for a full name at /profile/full, offers an email
 * magic link, and syncs a profile to Supabase on sign-in. It also credited
 * Simple Analytics, which has never been installed.
 *
 * The claims now come from lib/privacy-facts.ts and are checked against the
 * source by lib/__tests__/privacy-truth.test.ts, so the notice cannot drift
 * back into flattering itself.
 */

function Table({ items }: { items: DataItem[] }) {
  return (
    <div className="mt-3 space-y-3">
      {items.map((d) => (
        <div key={d.what} className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-ink">{d.what}</p>
          <dl className="mt-2 space-y-1 text-xs text-ink-soft">
            <div className="flex gap-2">
              <dt className="w-20 shrink-0 font-medium">Why</dt>
              <dd>{d.purpose}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-20 shrink-0 font-medium">Where</dt>
              <dd>{d.destination}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-20 shrink-0 font-medium">How long</dt>
              <dd>{d.retention}</dd>
            </div>
          </dl>
        </div>
      ))}
    </div>
  );
}

export default function PrivacyPage() {
  return (
    <div className="flex flex-1 flex-col items-center px-6 py-12">
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-semibold text-primary">Privacy notice</h1>
        <p className="mt-1 text-sm text-ink-soft">Last updated: July 2026</p>

        <div className="mt-4 rounded-2xl border border-[#CFE3CF] bg-[#f0f7f0] px-5 py-4 text-sm text-success-deep">
          <strong>Short version:</strong> every calculator — and the action plan — runs
          entirely in your browser and sends nothing anywhere. There is{" "}
          <strong>no account and nothing to sign in to</strong>, so there is nothing for us
          to hold. To move a plan to another phone you export a backup file and import it
          there; the file never leaves your hands.
        </div>

        <div className="mt-8 space-y-10 text-sm leading-relaxed text-ink-soft">
          <section>
            <p>
              This notice is written to the duty to notify in <strong>section 29</strong> of
              Kenya&apos;s <strong>Data Protection Act, 2019</strong>: what is collected, why,
              who else receives it, how it is protected, and what rights you have.
            </p>
            <p className="mt-2">
              It is organised by <em>where your data goes</em> rather than by legal heading,
              because that is the question you actually have.
            </p>
            {/* Named, because a notice that says "we" throughout and then sends
              * you to the ODPC is asking you to complain about somebody it will
              * not identify. s.29 makes naming the controller part of the duty,
              * and s.26 rights are unusable without it. */}
            <p className="mt-4 rounded-xl bg-canvas p-4">
              <strong className="text-primary">Who &ldquo;we&rdquo; is.</strong> {CONTROLLER.name}{" "}
              (company no. {CONTROLLER.registrationNumber}, incorporated {CONTROLLER.incorporated})
              operates {CONTROLLER.operates} and is the data controller for the processing
              described here. Business address: {CONTROLLER.businessAddress}. Reach us at{" "}
              <a href={`mailto:${CONTROLLER.contact}`} className="underline hover:text-primary">
                {CONTROLLER.contact}
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-primary">
              1. What never leaves your device
            </h2>
            <p className="mt-2">
              This is almost everything. All{" "}
              <Link href="/tools" className="underline hover:text-primary">
                calculators
              </Link>{" "}
              and the 5-question journey compute in your browser. No account is needed and
              nothing is transmitted.
            </p>
            <Table items={DEVICE_ONLY} />
          </section>

          <section>
            <h2 className="text-base font-semibold text-primary">
              2. The action plan — now computed on your device
            </h2>
            <p className="mt-2">
              Earlier versions of this notice explained that requesting a plan sent your
              figures to our server and on to an AI provider outside Kenya. That is no longer
              how it works: since July 2026 the plan is generated <strong>on your device</strong>,
              by a deterministic engine. Section 25(c) of the Act asks that data be limited to
              what is necessary — and the necessary amount to transmit turned out to be none.
              The figures below are what the engine reads, and they go nowhere.
            </p>
            <Table items={SENT_FOR_THE_AI_PLAN} />
          </section>

          <section>
            <h2 className="text-base font-semibold text-primary">
              3. What is stored if you choose to save a plan
            </h2>
            <p className="mt-2">
              <strong>Nothing.</strong> Until July 2026 there was an optional sign-in — an
              emailed link, then your name, age, county, salary and dependants held in a
              database outside Kenya. It was removed, and the table that described it is now
              empty rather than deleted, so a reader who remembers it is told what happened
              instead of finding a gap. Moving a plan between devices is now an exported
              backup file you carry yourself.
            </p>
            <Table items={ONLY_IF_YOU_SIGN_IN} />
          </section>

          <section>
            <h2 className="text-base font-semibold text-primary">
              4. What we receive if you choose to contribute
            </h2>
            <p className="mt-2">
              The calculators and their documents are free, and nothing in JiPange asks
              you to pay. If you do choose to send something to the till on our{" "}
              <Link href="/support" className="underline hover:text-primary">
                support page
              </Link>
              , Safaricom includes some of your details in the confirmation and there is
              no way for us to decline them. Since March 2026 that is two of your names
              and a partially masked number rather than the full one.
            </p>
            <Table items={ONLY_IF_YOU_CONTRIBUTE} />
          </section>

          <section>
            <h2 className="text-base font-semibold text-primary">
              5. What the hosting collects regardless
            </h2>
            <Table items={COLLECTED_BY_HOSTING} />
          </section>

          <section>
            <h2 className="text-base font-semibold text-primary">
              6. Who else can receive your data
            </h2>
            <p className="mt-2">
              These are all of them. Each processes outside Kenya, which the Act treats as a
              transfer requiring appropriate safeguards — in each case, the provider&apos;s
              contractual data-processing terms.
            </p>
            <ul className="mt-3 space-y-2">
              {PROCESSORS.map((p) => (
                <li key={p.name} className="rounded-2xl bg-white p-4 text-sm shadow-sm">
                  <strong className="text-ink">{p.name}</strong>
                  <span className="text-ink-soft">
                    {" "}
                    — {p.role}. {p.where}.
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3">
              We do not sell, rent or share your data with anyone else, and there are no
              advertising or tracking scripts on this site. Product links in the calculators
              are plain links carrying no identifier — no affiliate arrangement exists on any
              of them.
            </p>
            <p className="mt-3">
              We link to our own WhatsApp channel, Pesa Smart KE, which we run jointly with
              Mwangaza Yield. Following it does not identify you to us: WhatsApp does not show
              channel admins who their followers are, so we never see your number and are never
              given a list. It is a broadcast — we post, you read — and it carries general money
              news only, never anything worked out from the figures you enter here, because those
              stay in your browser and never reach us. Once you open WhatsApp you are on their
              service, under their privacy policy, not ours.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-primary">7. Cookies</h2>
            <p className="mt-2">
              JiPange sets no cookies at all. It previously set one session cookie for
              signed-in users; sign-in was removed in July 2026 and that cookie went with it.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-primary">8. How it is protected</h2>
            <p className="mt-2">
              Everything is served over HTTPS. The AI endpoint accepts only a fixed, validated
              set of fields — anything else is rejected rather than forwarded — and it is rate
              limited. Data held on your device is protected by your browser&apos;s own site
              isolation. Where a provider holds data, it is held under that provider&apos;s
              security terms.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-primary">
              9. Your rights under the Act
            </h2>
            <p className="mt-2">
              Section 26 of the Data Protection Act, 2019 gives you these rights:
            </p>
            <dl className="mt-3 space-y-3">
              {DPA_RIGHTS.map((r) => (
                <div key={r.right} className="rounded-2xl bg-white p-4 shadow-sm">
                  <dt className="text-sm font-semibold text-ink">{r.right}</dt>
                  <dd className="mt-1 text-sm text-ink-soft">{r.whatItMeans}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4">
              Most of these you can exercise yourself, immediately, without asking us — because
              most of the data is on your device and not ours:
            </p>
          </section>

          {/* Anchored because SaveMyPlan links straight here: with sign-in gone,
              exporting a backup file IS how a plan reaches another device. */}
          <div id="your-data" className="scroll-mt-24">
            <DataControls />
          </div>

          <section>
            <h2 className="text-base font-semibold text-primary">10. Complaints</h2>
            <p className="mt-2">
              {ODPC.what} The{" "}
              <a
                href={ODPC.url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-primary"
              >
                {ODPC.name}
              </a>{" "}
              is the supervisory authority for data protection in Kenya. You do not need to
              come to us first, though we would rather you did — it is usually faster.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-primary">11. Children</h2>
            <p className="mt-2">
              JiPange is built for adults managing their own money, and the profile form does
              not accept an age under 18. We do not knowingly collect data from children. The
              Act requires a parent or guardian&apos;s consent for a child&apos;s data, and we
              would rather not be in a position to need it.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-primary">12. Changes</h2>
            <p className="mt-2">
              If the processing described here changes, this page changes with it and the date
              at the top moves. The disclosures are generated from a file in the codebase that
              is tested against the code itself, so a new field or a new recipient breaks the
              build before it can quietly go undisclosed.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
