/**
 * What this product actually does with personal data — as data, so it can be
 * tested against the code rather than asserted in prose.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * The privacy policy said: "JiPange does not collect, store, or transmit any
 * personal information… no accounts, no registration, no login, and no sign-up
 * form. We do not collect your name, email address…"
 *
 * Meanwhile /profile/full asks for a full name, SaveMyPlan asks for an email
 * and sends a magic link, lib/supabase/sync.ts upserts name, age, county,
 * salary and dependants once signed in, and the policy named Simple Analytics,
 * which has never been installed.
 *
 * A privacy notice that misdescribes the processing is worse than a vague one,
 * because it is relied on. Kenya's Data Protection Act, 2019 makes accurate
 * notification a duty in its own right (s.29), not a courtesy.
 *
 * So the disclosures live here beside the code they describe, and
 * lib/__tests__/privacy-truth.test.ts checks the claims against the source. If
 * somebody adds a field to the profile form or a new recipient, a test fails
 * before the policy quietly becomes false again.
 *
 * NOT LEGAL ADVICE. This is an engineer's honest description of the data flows.
 * The controller's registered identity, its ODPC registration status, and the
 * lawful basis relied on are decisions for the operator and its advisers.
 */

export interface DataItem {
  /** What is collected, in the reader's words. */
  what: string;
  /** Why — the purpose, as s.29(c) requires. */
  purpose: string;
  /** Where it goes. "Your device only" is the honest answer for most of these. */
  destination: string;
  /** How long it stays. */
  retention: string;
}

/** The tap-only journey and every calculator. No identifiers at all. */
export const DEVICE_ONLY: DataItem[] = [
  {
    what: "Calculator inputs — salary, loan amounts, goal targets, expenses",
    purpose: "To compute the result you asked for",
    destination: "Your device only. These are never sent anywhere.",
    retention: "Until you clear the site's data, which you can do from this page",
  },
  {
    what: "The 5-question journey answers, and goals you commit to",
    purpose: "So you can leave and come back without starting again",
    destination: "Your device only, in browser localStorage",
    retention: "Until you clear it",
  },
  /**
   * The profile. This entry MOVED here in July 2026 rather than being written
   * fresh — these fields used to appear under ONLY_IF_YOU_SIGN_IN, because
   * signing in sent them to Supabase. With sign-in gone they never leave the
   * device, but they are still collected, and a field that stops being
   * disclosed because the section holding it was emptied is precisely the
   * defect this file exists to prevent. privacy-truth.test.ts caught it within
   * a minute of the sign-in disclosure being cleared.
   */
  {
    what: "Your name, age, county, salary, dependants, and whether you are in a chama",
    purpose:
      "To tailor the plan and the numbers to you. Your name is only ever used to address you on your own screen.",
    destination: "Your device only. There is no account and nowhere to send it.",
    retention: "Until you clear the site's data, which you can do from this page",
  },
];

/** The optional AI plan. Leaves the device; carries no name. */
/**
 * The action plan used to be the notice's section 2: figures travelled to our
 * server and on to a processor outside Kenya. It is now computed on the
 * device, so that section describes data that no longer moves — the strongest
 * outcome minimisation allows, and the entry says so rather than vanishing,
 * because a reader who remembers the old notice deserves the explanation.
 */
export const SENT_FOR_THE_AI_PLAN: DataItem[] = [
  {
    what: "Age, county, gross and net monthly salary, savings capacity, number of dependants, whether you are in a chama",
    purpose: "To generate the three tailored recommendations you asked for.",
    destination:
      "Nowhere. Since July 2026 the plan is computed on your device by a deterministic engine — no server, no AI provider, no cross-border transfer.",
    retention: "The plan and its inputs stay in your browser's storage until you clear them.",
  },
];

/**
 * There is no longer any way to sign in, so this list is empty — deliberately
 * kept rather than deleted, because a reader who remembers the old notice
 * deserves to be told what happened to it. Same reasoning as
 * SENT_FOR_THE_AI_PLAN above.
 *
 * It used to hold two entries: an e-mail address to Supabase for a magic link,
 * and name, age, county, salary, dependants and the saved plan upserted to a
 * Supabase database outside Kenya. That was the last controller-side personal
 * data this product held.
 *
 * Removed in July 2026. The Data Protection (Registration of Data Controllers
 * and Data Processors) Regulations, 2021 disapply the small-operator exemption
 * for Third Schedule purposes, which include "provision of financial services".
 * Whether a personal-finance tool is caught by that phrase is arguable; holding
 * no personal data is not. The cheapest way to win an argument about which
 * schedule you fall under is to have nothing to register in respect of.
 *
 * Moving a plan between devices is now an exported backup file the reader
 * carries themselves — see lib/backup.ts and SaveMyPlan.tsx.
 */
export const ONLY_IF_YOU_SIGN_IN: DataItem[] = [];

/** Collected by the infrastructure rather than by us, and unavoidable. */
/**
 * Only if you choose to contribute. Nothing here is required to use the app.
 *
 * Worth being precise about, because the honest answer improved in March 2026
 * and the lazy answer would be to keep claiming we receive nothing. We do
 * receive something — we simply receive less than we used to.
 *
 * Since 24 March 2026 Safaricom masks payer details on Till, PayBill and
 * peer-to-peer payments: a merchant sees two names and a partially obscured
 * number, e.g. 0722**000*. A name is still personal data and this notice says
 * so rather than rounding it down to nothing.
 */
export const ONLY_IF_YOU_CONTRIBUTE: DataItem[] = [
  {
    what:
      "Two of your names and a partially masked phone number, from the M-PESA confirmation",
    purpose:
      "Nothing. We do not need it and do not ask for it — Safaricom includes it in the payment confirmation and there is no way to decline it.",
    destination:
      "It reaches our M-PESA statement and nowhere else. It is never matched to anything you did in the app, because the app sends us nothing to match it against.",
    retention:
      "It stays in the M-PESA statement, which Safaricom keeps as the record of a payment. We do not copy it into any list of our own.",
  },
];

export const COLLECTED_BY_HOSTING: DataItem[] = [
  {
    what: "Your IP address and browser user-agent, in server logs",
    purpose: "Serving the site, and detecting abuse — a normal function of any web host",
    destination: "Netlify, our hosting provider, which serves from outside Kenya",
    retention: "Netlify's log retention, typically around 30 days",
  },
];

/**
 * Rights under section 26 of the Data Protection Act, 2019.
 *
 * Quoted close to the statute on purpose. A summary that softens them is the
 * kind of thing that reads well and helps nobody at the point it matters.
 */
export const DPA_RIGHTS: { right: string; whatItMeans: string }[] = [
  {
    right: "To be informed",
    whatItMeans: "To know what your data is being used for — which is what this page is for.",
  },
  {
    right: "To access",
    whatItMeans:
      "To get a copy of the personal data held about you. For anything held on your device, you already have it; use the controls below to see and clear it.",
  },
  {
    right: "To object",
    whatItMeans:
      "To object to processing of all or part of your data. In practice: do not request an AI plan, and do not sign in. Neither is required to use any calculator.",
  },
  {
    right: "To correction",
    whatItMeans: "To have false or misleading data about you corrected.",
  },
  {
    right: "To deletion",
    whatItMeans:
      "To have false or misleading data deleted. For a saved account, ask and we will delete it; for device data, clear it yourself at any time.",
  },
];

/** Every third party that can receive personal data. Named, per s.29(d)–(e). */
/**
 * One entry, and that is the whole point.
 *
 * Supabase was the second. It handled sign-in and saved plans and was removed
 * in July 2026 along with the sign-in path itself; the dependency is gone from
 * package.json, not merely unused. What is left is the host, which every web
 * page on earth has and which receives an IP address because that is how HTTP
 * works — not a recipient we chose to send anything to.
 */
export const PROCESSORS = [
  {
    name: "Netlify",
    role: "Hosts the site and runs the server functions",
    where: "Outside Kenya",
  },
];

/**
 * Who "we" is.
 *
 * The notice said "we" and "us" throughout and named nobody — while directing
 * readers to the ODPC to complain about an entity it declined to identify.
 * Section 29 of the Data Protection Act, 2019 makes identifying the controller
 * part of the notification duty, and it is the first thing a reader exercising
 * a s.26 right needs: you cannot ask a pronoun for your data.
 *
 * WHAT IS DELIBERATELY ABSENT
 *
 * The registration number, the registered office and any ODPC registration
 * status. Those are still being settled and are not invented here — a
 * controller implying a registration it does not hold would be a worse defect
 * than a silent one. A name and a working contact route are what s.29 turns
 * on; the rest is good practice and can follow. No legal form is stated,
 * because the operator supplied a name and not a form.
 */
export const CONTROLLER = {
  name: "Danico Ventures Ltd",
  operates: "JiPange and Mwangaza Yield",
  contact: "hello@jipangefinance.org",
  /** From the certificate of incorporation, which is a public record at the BRS. */
  registrationNumber: "PVT-EYUM572",
  incorporated: "10 March 2019, under the Companies Act, 2015",
  /**
   * The BUSINESS address, deliberately not the registered office.
   *
   * The certificate gives a registered office on the Ongata Rongai–Kitengela
   * Bypass. That is a public record and anyone can pull it by searching the
   * company number at the BRS — but it is not where this business is run from,
   * and a privacy notice needs an address a reader can actually write to, not
   * the one a form was filed with.
   *
   * Labelled "business address" for that reason. Calling JKIA Cargo Centre the
   * registered office would be false, and the fix for a personal address on a
   * public page is never to relabel a different one. If somebody later
   * "corrects" this back to the certificate address believing it a mistake:
   * it was not.
   */
  businessAddress: "JKIA Cargo Centre, Nairobi",
  /**
   * Taken from the certificate and NOT reproduced here: the director and
   * shareholder's name, the share capital and shareholding, and the registry's
   * "P.O. Box" field — which on this certificate holds a mobile number rather
   * than a box number. Publishing a personal phone number because a government
   * form put it in the wrong box would be our error, not the registry's.
   */
  /**
   * ODPC registration: the size exemption is NOT the whole test.
   *
   * An earlier version of this note said only that the Data Protection
   * (Registration of Data Controllers and Data Processors) Regulations, 2021
   * exempt a controller below Ksh 5 million turnover AND under ten employees,
   * and that Danico Ventures "may well sit under both thresholds, in which case
   * there is nothing to register". That was incomplete in the direction that
   * flatters us, and it is exactly the kind of incompleteness a reader takes
   * for a clearance.
   *
   * There is a carve-out. The size exemption is disapplied where the controller
   * processes personal data for any purpose in the THIRD SCHEDULE, and that
   * schedule includes "provision of financial services" alongside gambling,
   * health, education, telecommunications, direct marketing and others. For a
   * purpose on that list registration is mandatory REGARDLESS of turnover and
   * headcount, and being small stops mattering.
   *
   * Whether these products amount to the "provision of financial services" is a
   * legal characterisation and is deliberately NOT decided here. There is a real
   * argument each way: no licence is held, no money is taken in or advised on,
   * and the tools compute arithmetic on the reader's own device — against which
   * these are personal-finance products carrying affiliate links to fund
   * managers, and commentary on these Regulations tends to read "financial
   * services" broadly enough to reach fintech.
   *
   * WHAT IS ACTUALLY IN OUR CONTROL
   *
   * Registration attaches to processing personal data. The surest insulation is
   * therefore not winning an argument about which schedule we fall in — it is
   * having no personal data to register in respect of. That is an engineering
   * question, and it is nearly answered already: the calculators and the journey
   * are device-only, and the AI plan stopped leaving the device in July 2026.
   *
   * What remains is the optional Supabase sign-in, which stores an e-mail plus
   * name, age, county, salary and dependants. It is gated on
   * isSupabaseConfigured(), so on a deployment with those environment variables
   * unset the path does not exist at all. If it IS provisioned, it is the one
   * thing standing between this product and holding no controller-side personal
   * data whatsoever.
   *
   * Still not asserted either way on the page. Claiming a registration we do not
   * hold is a false regulatory claim; claiming the exemption now needs BOTH the
   * turnover and headcount figures AND a view on the Third Schedule, and neither
   * is mine to assert. What is recorded here is the COMPLETE test, so the next
   * person to look is not reasoning from half of it.
   */
  stillToPublish: [
    "whether ODPC registration is required (size exemption AND the Third Schedule carve-out — see above)",
    "a named Data Protection Officer, if one is required",
  ],
} as const;

/** The Office of the Data Protection Commissioner — the complaint route, s.56. */
export const ODPC = {
  name: "Office of the Data Protection Commissioner",
  url: "https://www.odpc.go.ke",
  what: "You may lodge a complaint with the ODPC if you believe your data rights have been infringed.",
};
