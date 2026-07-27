import { describe, it, expect } from "vitest";
import {
  PRODUCT_LINKS,
  YIELDS_AS_OF,
  YIELDS_MAX_AGE_DAYS,
  yieldsAreStale,
} from "../affiliate-links";

/**
 * The product directory is the single source of truth about which financial
 * products exist, what they yield, and who regulates them.
 *
 * Two defects prompted these checks. The plan engine kept its own private
 * list of provider names in prose, which went out of date the moment the
 * market moved — Ziidi, reachable from the M-PESA app and the largest fund in
 * the market, was missing from the advice while the directory was the obvious
 * place to look. And the yields carried no date at all: an undated "11.8%" is
 * true when typed and quietly wrong a quarter later, which is the defect this
 * codebase has spent a long time removing everywhere else.
 */
describe("product yields are dated", () => {
  it("is not shipping yields that are already stale", () => {
    expect(
      yieldsAreStale(),
      `YIELDS_AS_OF is ${YIELDS_AS_OF} — re-check the providers and update it`
    ).toBe(false);
  });

  it("goes stale after the window rather than quoting old rates forever", () => {
    const asOf = new Date(YIELDS_AS_OF);
    const inside = new Date(asOf.getTime() + (YIELDS_MAX_AGE_DAYS - 1) * 86_400_000);
    const outside = new Date(asOf.getTime() + (YIELDS_MAX_AGE_DAYS + 1) * 86_400_000);
    expect(yieldsAreStale(inside)).toBe(false);
    expect(yieldsAreStale(outside)).toBe(true);
  });
});

describe("the directory describes each product honestly", () => {
  it("every quoted yield belongs to a product that names its regulator", () => {
    // A rate without a regulator is a number from nowhere.
    for (const p of PRODUCT_LINKS.filter((x) => x.yieldPct !== undefined)) {
      expect(p.regulator, `${p.slug} quotes a yield with no regulator`).toBeTruthy();
    }
  });

  it("carries the M-PESA-reachable money market fund", () => {
    // Reach decides whether somebody starts at all. A fund openable from a
    // menu the reader already has beats basis points they never collect
    // because the onboarding defeated them.
    const reachable = PRODUCT_LINKS.filter(
      (p) => p.type === "mmf" && /M-PESA/i.test(p.liquidity)
    );
    expect(reachable.length, "no MMF reachable from M-PESA is listed").toBeGreaterThan(0);
  });

  it("still claims no affiliate arrangement anywhere, as the terms state", () => {
    expect(PRODUCT_LINKS.filter((p) => p.isAffiliate).map((p) => p.slug)).toEqual([]);
  });

  it("has no duplicate slugs", () => {
    const slugs = PRODUCT_LINKS.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
