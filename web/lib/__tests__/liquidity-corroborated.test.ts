import { describe, it, expect } from "vitest";
import { PRODUCT_LINKS } from "../affiliate-links";

/**
 * A `liquidity` string may promise a settlement TIME only if that time has
 * been corroborated against the provider's own domain.
 *
 * Seven funds carried "T+1 to M-Pesa". Nobody had sourced it, and the 31 July
 * 2026 survey contradicted it in BOTH directions against the managers' own
 * pages: Britam's brochure says 48 hours, Old Mutual pays self-service mobile
 * withdrawals the same day, KCB says two working days, and CIC publishes no
 * day count at all — only "at short notice with no penalty". ICEA, Sanlam and
 * Nabo publish no Kenyan redemption timeline.
 *
 * That is the same lesson the minimums taught: an unsourced column errs in
 * both directions, so a wrong value in it is not conservative, it is
 * arbitrary. This column is the worse of the two. A wrong minimum turns
 * somebody away at the door and they learn it immediately; a wrong settlement
 * time is discovered in the week they actually need the money, which is the
 * week they are least able to absorb being wrong.
 *
 * So the hedge — "Confirm withdrawal terms with the manager" — is the DEFAULT,
 * and a specific promise is the exception that has to be earned. Adding one
 * means doing the corroboration, not adding a line here.
 *
 * Deliberately annoying to extend, for the same reason as the minimums guard:
 * the failure it prevents is silent. Nothing errors, no test goes red, a saver
 * simply plans around a date that was never real.
 */

/**
 * Scoped to money market funds, matching min-entry-corroborated.test.ts and
 * for the same reason.
 *
 * The first run of this guard flagged Stima and Mwalimu SACCO for "30–60 day
 * notice on withdrawals". That is a different kind of statement, in two ways.
 * It comes from the SASRA-regulated deposit régime rather than the provider
 * survey that went wrong, and it runs in the opposite direction: it WARNS of a
 * delay rather than promising speed, and it is already a hedged range. A saver
 * misled by it is misled into being too careful.
 *
 * Scoped explicitly rather than by quietly adding two entries to the allow
 * list, because the allow list is supposed to mean "somebody checked this" and
 * nobody has checked those two. They are out of this guard's scope, not
 * corroborated — a distinction worth keeping visible.
 */
const isSurveyed = (p: { type: string }) => p.type === "mmf";

/** Phrases that promise a TIME. A hedge promises nothing and needs no source. */
const PROMISES_A_TIME =
  /\bT\s*\+\s*\d|same[- ]day|instant|immediate|\d+\s*(?:working\s+|business\s+)?(?:hour|day)s?\b|next\s+day|within\s+\d/i;

/**
 * slug -> the exact string corroborated on the provider's own domain.
 *
 * One entry. Safaricom's own pages describe Ziidi as zero-rated on both
 * deposits and withdrawals, and note that it is a claim about FEES, not about
 * timing — which is why it survives a rule aimed at timing promises.
 */
const CORROBORATED: Record<string, string> = {
  "ziidi-mmf": "Withdraw to M-PESA, no fee",
};

describe("liquidity strings promise only what has been sourced", () => {
  it("has products to check, so the guard is not vacuous", () => {
    expect(
      PRODUCT_LINKS.filter(isSurveyed).length,
      "no MMFs found to check"
    ).toBeGreaterThan(10);
    expect(
      PRODUCT_LINKS.filter(isSurveyed).filter((p) => p.liquidity).length,
      "no MMF carries a liquidity string"
    ).toBeGreaterThan(10);
  });

  it("makes no settlement-time promise that has not been corroborated", () => {
    const offenders = PRODUCT_LINKS.filter(isSurveyed)
      .filter((p) => p.liquidity)
      .filter((p) => PROMISES_A_TIME.test(p.liquidity))
      .filter((p) => CORROBORATED[p.slug] !== p.liquidity)
      .map((p) => `${p.slug}: "${p.liquidity}"`);
    expect(
      offenders,
      [
        "These funds promise a withdrawal timeline that has not been checked",
        "against the provider's own site. 'T+1 to M-Pesa' was wrong in both",
        "directions on every fund it could be checked against. Corroborate it",
        "and add the exact string to CORROBORATED, or use the hedge:",
        '"Confirm withdrawal terms with the manager".',
      ].join(" ")
    ).toEqual([]);
  });

  it("keeps the corroborated string exactly as corroborated", () => {
    for (const [slug, expected] of Object.entries(CORROBORATED)) {
      const p = PRODUCT_LINKS.find((x) => x.slug === slug);
      if (!p) continue;
      expect(p.liquidity, `${slug} drifted from the corroborated wording`).toBe(expected);
    }
  });

  it("keeps the seven that were found wrong promising nothing", () => {
    /* Named individually because "T+1 to M-Pesa" is exactly the kind of
     * plausible-looking default somebody restores from memory. It reads like a
     * fact about how the market works. It was not a fact about anything. */
    for (const slug of [
      "britam-mmf",
      "cic-mmf",
      "nabo-mmf",
      "icea-mmf",
      "sanlam-mmf",
      "old-mutual-mmf",
      "zimele-mmf",
    ]) {
      const p = PRODUCT_LINKS.find((x) => x.slug === slug);
      if (!p) continue;
      expect(
        PROMISES_A_TIME.test(p.liquidity),
        `${slug} promises a timeline again: "${p.liquidity}"`
      ).toBe(false);
    }
  });

  it("catches a timing promise when one is introduced", () => {
    /* Mutation check in both directions — the pattern has to actually fire on
     * the strings this guard exists to stop, and stay quiet on the hedge. */
    for (const bad of [
      "T+1 to M-Pesa",
      "T + 2 to bank",
      "same-day withdrawal",
      "paid within 24 hours",
      "2 working days",
      "next day to M-PESA",
    ]) {
      expect(PROMISES_A_TIME.test(bad), `should have flagged "${bad}"`).toBe(true);
    }
    for (const ok of [
      "Confirm withdrawal terms with the manager",
      "Withdraw to M-PESA, no fee",
    ]) {
      expect(PROMISES_A_TIME.test(ok), `should not have flagged "${ok}"`).toBe(false);
    }
  });
});
