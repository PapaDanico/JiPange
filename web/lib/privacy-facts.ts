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

/** Only if you choose to save a plan across devices. */
export const ONLY_IF_YOU_SIGN_IN: DataItem[] = [
  {
    what: "Your email address",
    purpose: "To send a sign-in link and identify your saved plan. There is no password.",
    destination: "Supabase, our authentication and database provider, which processes outside Kenya",
    retention: "Until you ask us to delete the account",
  },
  {
    what: "Your name, age, county, salary, dependants and saved plan",
    purpose: "So a plan you built on one device is there on another",
    destination: "Supabase, our database provider, which processes outside Kenya",
    retention: "Until you ask us to delete it",
  },
];

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
export const PROCESSORS = [
  {
    name: "Netlify",
    role: "Hosts the site and runs the server functions",
    where: "Outside Kenya",
  },
  {
    name: "Supabase",
    role: "Sign-in and saved plans, only if you choose to save one",
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
  registeredOffice: "Plot No. 1, Ongata Rongai–Kitengela Bypass, Athi River",
  /**
   * Taken from the certificate and NOT reproduced here: the director and
   * shareholder's name, the share capital and shareholding, and the registry's
   * "P.O. Box" field — which on this certificate holds a mobile number rather
   * than a box number. Publishing a personal phone number because a government
   * form put it in the wrong box would be our error, not the registry's.
   */
  stillToPublish: [
    "ODPC registration status",
    "a named Data Protection Officer, if one is required",
  ],
} as const;

/** The Office of the Data Protection Commissioner — the complaint route, s.56. */
export const ODPC = {
  name: "Office of the Data Protection Commissioner",
  url: "https://www.odpc.go.ke",
  what: "You may lodge a complaint with the ODPC if you believe your data rights have been infringed.",
};
