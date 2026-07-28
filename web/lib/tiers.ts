/**
 * What is free, what is not, and — more importantly — what may never be sold.
 *
 * THE AXIS
 * --------
 * Tiers here split by VERB, not by tool. Every calculator stays complete and
 * free: every figure, every source, every line of methodology. What can carry
 * a price is what you do with the result afterwards — take it away as a
 * document, keep it, be reminded of it, run it across a whole household.
 *
 * Splitting by tool was the obvious alternative and it is the wrong one twice
 * over. It would gate the mission — the people most in need of the debt and
 * overdraft tools are the least able to pay for them — and it would move this
 * product closer to selling financial advice, which in Kenya is a licensed
 * activity. Charging for a document is charging for a document. Charging for
 * the ANSWER is something else, and something this project has no licence to
 * do.
 *
 * NOTHING HERE GATES ANYTHING YET
 * -------------------------------
 * This module is a declaration, not an enforcement point. No payment rail is
 * wired, no capability is withheld. It exists so the categorisation can be
 * argued with, tested, and changed cheaply before any of it is load-bearing.
 */

import { TOOL_META } from "./tool-meta";

/* ------------------------------------------------------------------- tiers */

export type Tier = "free" | "document" | "mpango" | "institution";

/**
 * What a reader might want to do with a result.
 *
 * `compute` is deliberately first and deliberately always free — it is the
 * product. Everything below it is logistics.
 */
export type Capability =
  | "compute"          // see the answer, with its sources and method
  | "share-image"      // the PNG that goes to WhatsApp
  | "export-document"  // the branded one-page PDF
  | "save-plan"        // keep a named plan and come back to it
  | "reminders"        // January fee step-ups, auction closes, term dates
  | "household"        // several children, several scenarios, side by side
  | "api";             // programmatic access, for institutions

/**
 * The tier at which each capability becomes available.
 *
 * `share-image` stays free on purpose and it is not generosity: the WhatsApp
 * card is how anyone hears about this at all. Charging for the thing that
 * spreads the product to pay for the product is a circle that does not close.
 */
export const CAPABILITY_TIER: Record<Capability, Tier> = {
  compute: "free",
  "share-image": "free",
  "export-document": "document",
  "save-plan": "free", // one plan free; more at mpango — see PLAN_LIMITS
  reminders: "mpango",
  household: "mpango",
  api: "institution",
};

/** How many saved plans each tier allows. */
export const PLAN_LIMITS: Record<Tier, number> = {
  free: 1,
  document: 1,
  mpango: Infinity,
  institution: Infinity,
};

/* --------------------------------------------------------- the protected list */

/**
 * Tools that may never cost anything, at any tier, including their documents.
 *
 * This is the part that decides whether the rest of this file is a business
 * model or a pretext. Each of these exists to keep somebody out of trouble,
 * and the reader who needs it most is, by construction, the one with the least
 * to spend. A debt-escape plan behind a hundred-shilling wall is not a
 * business decision; it is the product arguing against itself.
 *
 * `tierFor` reads this list before it reads anything else, so the rule is
 * enforced in code rather than remembered in a meeting. Removing an entry
 * should require someone to open this file and read this comment.
 */
export const NEVER_PAID: readonly string[] = [
  "/tools/fuliza-cost",      // exists to warn people off expensive credit
  "/tools/guarantor-shield", // exists to stop somebody being ruined by another's loan
  "/tools/one-third-rule",   // tells you whether your employer is breaking the law
  "/tools/debt-escape",      // the premise is that you have no money
  "/tools/sha-health",       // healthcare access
];

/**
 * The tier a given capability sits at FOR A GIVEN TOOL.
 *
 * Always consult this rather than CAPABILITY_TIER directly. The protected list
 * is applied here, which is the only place it can be applied consistently.
 */
export function tierFor(capability: Capability, toolHref?: string): Tier {
  if (toolHref && NEVER_PAID.includes(toolHref)) return "free";
  return CAPABILITY_TIER[capability];
}

/** Whether a capability costs anything on a given tool. */
export function isPaid(capability: Capability, toolHref?: string): boolean {
  return tierFor(capability, toolHref) !== "free";
}

/* ----------------------------------------------------------------- pricing */

/**
 * Prices are configuration, not decisions taken here.
 *
 * Two things are unresolved and both move these numbers, so they are kept in
 * one place and clearly labelled rather than sprinkled through copy:
 *
 *   1. VAT. The Ksh 5m registration threshold applies to the ENTITY, not the
 *      product, so app revenue aggregates with everything else the company
 *      bills. If the entity is registered, these figures are VAT-inclusive and
 *      the retained amount is roughly 86% of them.
 *
 *   2. Whether an annual tier should exist at all. Kenyan willingness-to-pay
 *      research puts only a small minority above Ksh 1,000 for anything
 *      digital, and M-PESA has no true recurring debit — an annual plan is a
 *      manual repurchase every year. It may be worth more as an anchor that
 *      makes a hundred shillings look small than as a product anyone buys.
 */
export interface TierSpec {
  readonly id: Tier;
  readonly name: string;
  readonly priceKES: number | null; // null = not sold directly
  readonly unit: string;
  readonly summary: string;
  readonly includes: readonly string[];
}

export const VAT_INCLUSIVE = false; // flip when the entity registers for VAT

/**
 * The suggested contribution, and the fact that it is only a suggestion.
 *
 * Chosen over a fixed price deliberately. Kenyan willingness-to-pay research
 * puts a quarter of people below a hundred shillings for anything digital, and
 * a hard wall at that number turns them away from a document they have already
 * earned by doing the work. Naming a figure and meaning it as a guess collects
 * from those who can, costs almost nothing in expected revenue, and is far
 * easier to say out loud — which matters, because this has to be said on a
 * page and believed.
 */
export const PAY_WHAT_YOU_CAN = true;
export const SUGGESTED_DOCUMENT_KES = 100;

/**
 * Where a contribution goes, stated in full.
 *
 * The till is published with the REGISTERED NAME beside it, deliberately and
 * together. Two reasons.
 *
 * The M-PESA confirmation says DANICO VENTURES LTD, which is the company
 * behind JiPange and a name nobody contributing has any reason to recognise.
 * On a page asking for money, an unexplained third-party name is the exact
 * shape of a scam, and a reader who hesitates there is right to. Naming it
 * first turns a red flag into a fact.
 *
 * And a till number on its own is trivially cloned — anyone can copy this page
 * and change seven digits. Publishing the number and the name together gives a
 * reader something to check against the confirmation they receive.
 */
export const TILL = {
  number: "5248589",
  registeredName: "Danico Ventures Ltd",
  explanation:
    "Your M-PESA confirmation will read DANICO VENTURES LTD — that is the company behind JiPange. If the name that comes back is anything else, you are not paying us.",
} as const;

export const TIERS: readonly TierSpec[] = [
  {
    id: "free",
    name: "Free",
    priceKES: 0,
    unit: "always",
    summary:
      "Every calculator, every figure, every source. Complete, not a preview.",
    includes: [
      // Derived, not typed. This said 26, the homepage said 18, and there
      // were 25 — three numbers for one fact, none of them checkable by a
      // reader who can count the tool pages.
      `All ${allToolHrefs().length} calculators and every planner`,
      "Every number, with the workings and the sources behind it",
      "Share any result as an image",
      "One saved plan",
    ],
  },
  {
    id: "document",
    name: "Document",
    priceKES: 100,
    unit: "per document",
    summary:
      "The one-page PDF — dated, with your figures and the assumptions written on it. Pay what it was worth; a hundred shillings is a fair guess.",
    includes: [
      "A branded A4 document you can hand to somebody",
      "Your inputs printed on it, so the sheet can be checked",
      "Method and sources in the footer",
      "No account needed",
      "Pay less, or nothing, if that is where you are",
    ],
  },
  {
    /* A PASS, not a subscription.
     *
     * Framed as "per year" this was a subscription in everything but name, and
     * M-PESA has no recurring debit — so it would have been a manual
     * repurchase every twelve months, dressed as something automatic. The
     * alternative considered was keeping it on the page purely as an anchor to
     * make a hundred shillings look small, which is a decoy: showing a product
     * you have no intention of selling.
     *
     * A one-year pass is the honest version of the same thing. One payment,
     * twelve months, renew if it was worth it. Nothing to cancel, nothing that
     * charges you while you are not looking. */
    id: "mpango",
    name: "Mpango",
    priceKES: 1_200,
    unit: "once, valid a year",
    summary:
      "A single payment covering a year. Not a subscription — nothing renews on its own and there is nothing to cancel.",
    includes: [
      "Unlimited documents",
      "Unlimited saved plans",
      "Reminders before fee terms and auction closes",
      "Household mode — several children, side by side",
    ],
  },
  {
    id: "institution",
    name: "Institution",
    priceKES: null,
    unit: "by arrangement",
    summary:
      "For SACCOs, employers, schools and advisers who want this for the people they serve.",
    includes: [
      "The calculation engine, under licence",
      "Reports carrying your own name",
      "Programmatic access to the computed rates feed",
    ],
  },
];

export function tierSpec(id: Tier): TierSpec {
  const found = TIERS.find((t) => t.id === id);
  if (!found) throw new Error(`no tier spec for ${id}`);
  return found;
}

/* ------------------------------------------------------------- the narrative */

/**
 * The words, kept beside the rules they describe.
 *
 * Copy that lives in a component drifts from the logic it explains — this
 * codebase has found that in the currency labels, in the retired figures, in
 * the MMF rate. If a price changes here, the sentence quoting it changes with
 * it, because the sentence reads it.
 */
export const SUPPORT_NARRATIVE = {
  heading: "The tools stay free",
  lead:
    "Every calculator, every figure, every source — free, and staying that way. That is the point of JiPange, and it is not a trial.",
  body: [
    "What takes real work is the paperwork: the plan you carry to a bursar, the statement you take to a SACCO, the reminder that reaches you the week before a term starts.",
    "If one of those has been worth something to you, a hundred shillings keeps the lights on and pays for the next calculator. If it has not, take it anyway — that is what it is for.",
  ],
  protectedHeading: "Five that will never cost anything",
  protectedLead:
    "Some of these tools exist to keep somebody out of trouble, and the person who needs them most is rarely the person with money to spare. These are free permanently, documents included, and we would rather say so plainly than leave you to wonder.",
  closing:
    "We take no commission from any fund, SACCO or bank listed here, and we do not sell your data — there is no account and nothing leaves your device. If that ever changes, it will be written here first.",
} as const;

/* ------------------------------------------------------------- completeness */

/** Every tool the app ships, for the categorisation guard. */
export function allToolHrefs(): string[] {
  return Object.keys(TOOL_META).filter((href) => href.startsWith("/tools/"));
}
