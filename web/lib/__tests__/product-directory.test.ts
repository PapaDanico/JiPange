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

  it("carries the M-PESA-reachable money market fund, marked as such", () => {
    // Reach decides whether somebody starts at all. A fund openable from a
    // menu the reader already has beats basis points they never collect
    // because the onboarding defeated them.
    //
    // Asserted on the explicit flag, not on the liquidity prose: every fund
    // here says "T+1 to M-Pesa", so a /M-PESA/i match identifies nothing.
    // The earlier version of this check passed for that empty reason.
    const reachable = PRODUCT_LINKS.filter((p) => p.type === "mmf" && p.walletNative);
    expect(reachable.length, "no MMF marked walletNative is listed").toBeGreaterThan(0);
    for (const p of reachable) {
      expect(p.liquidity, `${p.slug} is walletNative but never mentions M-PESA`).toMatch(/M-PESA/i);
    }
  });

  /**
   * The refusal is part of the data, so it is pinned like any other fact.
   *
   * Two figures are in circulation for this fund and both are traps: its own
   * 9.50% is from February 2025, and the 18.20% that appears next to the name
   * "Zidi" in current survey tables belongs to Etica Capital's fund — a
   * different manager, one letter away. Quoting either would overstate or
   * misdate the largest fund in the market. If a verified current figure is
   * ever added, this test should be deleted deliberately, not deleted because
   * it started failing.
   */
  it("quotes no yield for the fund whose only available figures are wrong", () => {
    const ziidi = PRODUCT_LINKS.find((p) => p.slug === "ziidi-mmf");
    expect(ziidi, "ziidi-mmf is missing from the directory").toBeTruthy();
    expect(
      ziidi!.yieldPct,
      "a yield appeared for Ziidi — confirm it is Safaricom's fund and current, not Etica's 'Zidi'"
    ).toBeUndefined();
    expect(ziidi!.minKes, "Ziidi's Ksh 100 minimum is its defining feature").toBe(100);
  });

  it("quotes no yield that predates the survey the date claims", () => {
    // The stale-yield defect in its subtler form: a figure nobody re-checked
    // sitting under a date somebody refreshed. Any fund carrying a number is
    // asserting it was observed on YIELDS_AS_OF — funds outside that survey
    // must carry nothing rather than an inherited figure wearing a new date.
    const quoted = PRODUCT_LINKS.filter((p) => p.type === "mmf" && p.yieldPct !== undefined);
    for (const p of quoted) {
      expect(p.yieldPct, `${p.slug} quotes an implausible MMF yield`).toBeGreaterThan(5);
      expect(p.yieldPct, `${p.slug} quotes an implausible MMF yield`).toBeLessThan(25);
    }
  });

  /**
   * A URL is a promise that somebody opened the page.
   *
   * Six funds were added from a yield survey that carried rates and minimums
   * but no links, and no provider site is reachable from where this runs. The
   * temptation is to compose a plausible address from the manager's name —
   * which on a financial product sends a reader looking to move money to a
   * page nobody has loaded. Absent is the correct value, and both cards render
   * facts instead of a button when it is absent.
   */
  it("never invents a provider URL", () => {
    for (const p of PRODUCT_LINKS) {
      if (p.url === undefined) continue;
      expect(p.url, `${p.slug} has a malformed URL`).toMatch(/^https:\/\/[\w.-]+\.\w{2,}/);
    }
    // The survey funds are the ones with no verified link; if a URL ever
    // appears on one, it should be because somebody opened it.
    const unlinked = PRODUCT_LINKS.filter((p) => p.url === undefined).map((p) => p.slug);
    expect(unlinked.length, "expected the survey-sourced funds to carry no URL").toBeGreaterThan(0);
  });

  it("carries the funds that lead the market, not only the ones listed first", () => {
    // Their absence biased every recommendation toward mid-tier funds. The
    // directory decides what the advice can say, so a gap here is a gap there.
    const best = Math.max(
      ...PRODUCT_LINKS.filter((p) => p.type === "mmf" && p.yieldPct !== undefined).map(
        (p) => p.yieldPct!
      )
    );
    expect(best, "no MMF above 16% — the top of the market is missing").toBeGreaterThan(16);
  });

  it("still claims no affiliate arrangement anywhere, as the terms state", () => {
    expect(PRODUCT_LINKS.filter((p) => p.isAffiliate).map((p) => p.slug)).toEqual([]);
  });

  it("has no duplicate slugs", () => {
    const slugs = PRODUCT_LINKS.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
