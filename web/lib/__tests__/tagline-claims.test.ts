import { describe, it, expect } from "vitest";
import { PRODUCT_LINKS } from "../affiliate-links";

/**
 * A tagline may state what a product IS. It may not rank it or praise its
 * returns.
 *
 * The 31 July 2026 audit found five taglines making claims this file cannot
 * support, on the same fourteen funds whose minimums had just been found wrong
 * five times in nine:
 *
 *   Nabo    "Sanlam-backed manager; higher entry minimum"
 *           Wrong twice. Nabo has never been Sanlam's — it launched as Centum
 *           Asset Managers in 2012 and Centum has since sold 60% to Rock
 *           Investment Bank. And it asserted a comparison in the very column
 *           this file leaves BLANK for Nabo, because no KES minimum is
 *           published. A false statement about who stands behind a fund is the
 *           worst thing on a card somebody is deciding where to put money.
 *
 *   Etica   "Highest quoted rate in the April 2026 survey"
 *           A ranking derived from yields this file DELETED as untrustworthy.
 *           Deleting the data while keeping the conclusion drawn from it is the
 *           worst of both: the evidence is gone and the claim survives.
 *
 *   Lofty-Corban  "Consistently near the top of the yield tables"
 *   Cytonn        "Long-running high-yield fund"
 *   NCBA          "Bank-backed; third largest unit trust by assets"
 *           Unsourced performance and league-table claims. NCBA's was also
 *           attached to a fund since reclassified out of the money market
 *           category entirely.
 *
 * The rule that falls out: structural facts age slowly and are checkable — who
 * owns the manager, who regulates it, how you reach your money, what the fund
 * holds. Performance and rank age monthly and this file publishes no figures to
 * support either. So the taglines carry the first kind and not the second.
 *
 * Yields are the reason this is enforced rather than merely intended. Not one
 * money market fund here quotes a rate, deliberately — see the Ziidi entry. A
 * tagline claiming a fund is high-yielding smuggles back exactly the claim the
 * missing figures were removed to avoid making.
 */

/**
 * PRECISE ordinal rankings. Deliberately narrower than "any superlative".
 *
 * The first draft of this guard banned every superlative and immediately
 * flagged three taglines that are fine: Old Mutual "backed by one of Africa's
 * largest insurers" and Mwalimu "Kenya's largest Sacco by deposits" describe
 * INSTITUTIONAL SCALE — durable, checkable (SASRA publishes SACCO deposits),
 * and saying nothing about what a saver will earn.
 *
 * What ages badly and misleads is a precise ordinal: NCBA's "third largest unit
 * trust by assets" moves every quarter and nobody updates it. "One of the
 * largest" survives a decade; "third largest" is wrong within a year and still
 * reads as fact.
 */
const RANKS = /\b(?:number one|no\.\s*1|first|second|third|fourth|fifth)\s+(?:largest|biggest|best|ranked|by\s)/i;

/**
 * Claims about how well it pays — banned outright, whatever the wording.
 *
 * Not one money market fund here quotes a yield, deliberately. A tagline
 * calling a fund high-yielding, or naming it the highest, smuggles back exactly
 * the claim the missing figures were removed to avoid making.
 */
const PERFORMANCE =
  /\bhigh[- ]?yield|outperform|market[- ]beating|superior returns?|strong returns?|consistently\b|(?:highest|best|top|leading|lowest)\s+(?:\w+\s+){0,2}(?:yield|rate|return|payout|interest)/i;

describe("taglines state what a product is, not how it ranks", () => {
  const withTagline = PRODUCT_LINKS.filter((p) => p.tagline);

  it("has taglines to check, so the guard is not vacuous", () => {
    expect(withTagline.length, "nothing carries a tagline").toBeGreaterThan(10);
  });

  it("makes no ranking or league-table claim", () => {
    const offenders = withTagline
      .filter((p) => RANKS.test(p.tagline))
      .map((p) => `${p.slug}: "${p.tagline}"`);
    expect(
      offenders,
      [
        "These taglines rank a product against others. This file publishes no",
        "figures to support a ranking — the fund yields were deliberately",
        "removed — and a rank ages every quarter. State what the product is.",
      ].join(" ")
    ).toEqual([]);
  });

  it("makes no claim about returns", () => {
    const offenders = withTagline
      .filter((p) => PERFORMANCE.test(p.tagline))
      .map((p) => `${p.slug}: "${p.tagline}"`);
    expect(
      offenders,
      [
        "These taglines claim something about how well a product pays. No money",
        "market fund here quotes a yield, on purpose; a tagline must not smuggle",
        "the claim back in where the figure was refused.",
      ].join(" ")
    ).toEqual([]);
  });

  it("does not assert a minimum for a fund whose minimum is blank", () => {
    /* Nabo's tagline said "higher entry minimum" while its minKes was
     * undefined — the card simultaneously refused to state a minimum and
     * characterised it. Whichever is right, they cannot both be. */
    const offenders = withTagline
      .filter((p) => p.minKes === undefined)
      .filter((p) => /\b(?:minimum|min entry|entry point)\b/i.test(p.tagline))
      .map((p) => `${p.slug}: "${p.tagline}"`);
    expect(
      offenders,
      "the tagline characterises a minimum the card declines to state"
    ).toEqual([]);
  });

  it("names no fund manager as backed by a company that does not own it", () => {
    /* The specific false claim, kept as a named regression. Sanlam runs its own
     * fund in this very list, which is probably how the confusion started —
     * and is exactly why it read plausibly enough to survive. */
    const nabo = PRODUCT_LINKS.find((p) => p.slug === "nabo-mmf");
    if (nabo?.tagline) {
      expect(nabo.tagline, "Nabo is not Sanlam-backed").not.toMatch(/sanlam/i);
    }
  });

  it("catches a ranking or returns claim when one is introduced", () => {
    /* Mutation check, both directions. */
    for (const bad of [
      "Highest quoted rate in the April 2026 survey",
      "third largest unit trust by assets",
      "Tax-free coupons — highest net yield for high earners",
      "Long-running high-yield fund",
      "Consistently near the top of the yield tables",
    ]) {
      expect(
        RANKS.test(bad) || PERFORMANCE.test(bad),
        `should have flagged "${bad}"`
      ).toBe(true);
    }
    for (const ok of [
      "Bank-backed; reclassified as a fixed income fund",
      "No lock-in period; interest compounds daily",
      "Independent manager; CMA-licensed",
      "Coupons are free of withholding tax",
      // Institutional scale is fine — it is checkable and says nothing about returns.
      "Backed by one of Africa's largest insurers",
      "Kenya's largest Sacco by deposits; educators and beyond",
    ]) {
      expect(
        RANKS.test(ok) || PERFORMANCE.test(ok),
        `should not have flagged "${ok}"`
      ).toBe(false);
    }
  });
});
