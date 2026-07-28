/**
 * What these products are for, written down once.
 *
 * WHY THIS IS A MODULE AND NOT A PARAGRAPH ON A PAGE
 * -------------------------------------------------
 * A mission restated in five components is five missions, and they drift. This
 * codebase has watched that happen to the currency label, the MMF rate and the
 * retired statistics — each one a convention established in one place and
 * retyped in another, with nothing keeping them in step. A statement of purpose
 * is more susceptible to it than any of those, because nobody thinks to test
 * prose.
 *
 * So the words live here, the pages read them, and the tests check that what
 * the product PROMISES matches what the product DOES — that the free tier is
 * genuinely free, that the protected tools are genuinely protected, that the
 * no-commission claim still holds in the product directory. A mission that
 * cannot be checked against the code is marketing.
 */

/** One sentence, if somebody asks what this is. */
export const PURPOSE =
  "Show a Kenyan household exactly what their money is doing, using figures anyone can check, and charge nothing to find out.";

/**
 * The commitments. Each one is enforced somewhere, and the test for this
 * module says where.
 */
export const COMMITMENTS = [
  {
    id: "answers-are-free",
    promise: "Every calculator, every figure and every source is free, permanently.",
    enforcedBy: "lib/tiers.ts — compute is free on every tool, asserted across the registry",
  },
  {
    id: "protected-tools",
    promise:
      "The tools that exist to keep somebody out of trouble never cost anything, documents included.",
    enforcedBy: "lib/tiers.ts — NEVER_PAID, checked for every capability",
  },
  {
    id: "no-commission",
    promise:
      "We take no commission from any fund, SACCO or bank we list, and no placement is ever sold.",
    enforcedBy: "lib/affiliate-links.ts — isAffiliate is empty, asserted in the directory tests",
  },
  {
    id: "stays-on-device",
    promise: "There is no account and nothing leaves your device.",
    enforcedBy: "lib/storage.ts — everything is localStorage; there is no server to send it to",
  },
  {
    id: "sourced-or-silent",
    promise:
      "Every published figure names a source and a date, or it does not get published.",
    enforcedBy: "lib/sources.ts — the registry, with a staleness gate that fails the build",
  },
  {
    id: "wrong-is-worse-than-missing",
    promise:
      "Where we cannot establish a figure, we say so rather than estimate one that looks right.",
    enforcedBy: "lib/__tests__/tool-stats.test.ts — UNVERIFIED is size zero and stays that way",
  },
] as const;

export type CommitmentId = (typeof COMMITMENTS)[number]["id"];

/**
 * The rule that governs where money may be mentioned at all.
 *
 * THE ASK NEVER PRECEDES THE VALUE.
 *
 * No modal, no interstitial, no banner over an unfinished calculation, no
 * prompt in the way of a result. A contribution may only be invited AFTER
 * something useful has been produced and handed over — and even then it sits
 * beside the result rather than on top of it, and the reader can ignore it
 * forever without being asked twice.
 *
 * This is the difference between a product that asks and a product that
 * nags, and the difference matters more here than the revenue does: the whole
 * proposition is that the reader is being helped rather than harvested. A
 * paywall shaped like a helpful suggestion undoes that in one impression.
 *
 * `lib/__tests__/mission.test.ts` scans for the shapes this forbids.
 */
export const ASK_AFTER_VALUE = true;

/** Places a contribution may be mentioned. Anything else is a defect. */
export const PERMITTED_ASK_SURFACES = [
  "/support", // the page that explains it, which nobody is sent to unwillingly
  "after-export", // beside a document that has already been produced
  "footer", // one quiet link, alongside terms and privacy
  /* The privacy notice, which is not an ask at all.
   *
   * Added after this guard flagged it, correctly and usefully. The notice has
   * to describe what Safaricom sends us when somebody contributes — that is
   * the notification duty under the Data Protection Act, and it necessarily
   * links to the page where the till is. Suppressing a disclosure to satisfy
   * an anti-nagging rule would be the rule defeating its own purpose. */
  "/privacy",
  /* The licensing page, which asks INSTITUTIONS and not readers.
   *
   * Flagged by this guard, correctly, and the distinction is worth stating
   * rather than quietly allowlisting. ASK_AFTER_VALUE protects the reader from
   * being solicited before they have been given anything. /licensing solicits
   * nobody who reads the calculators: its whole argument is that the tools are
   * free to them BECAUSE somebody else pays. A rule against nagging users
   * should not forbid explaining who funds the thing — that is the disclosure
   * the rule exists to make possible. */
  "/licensing",
] as const;
