import { describe, it, expect } from "vitest";
import { PRODUCT_LINKS } from "../affiliate-links";

/**
 * A "min entry" figure may only be shown for a fund whose minimum has been
 * corroborated against the provider's own domain.
 *
 * The 31 July 2026 survey checked nine of the fourteen listed funds and found
 * FIVE wrong — CIC and KCB understated by 5x, Etica overstated by 10x, Zimele
 * by 5x, and Dry Associates listed at 1,000 against a real minimum of
 * 1,000,000. A retail saver sent to an institutional fund on the strength of a
 * number nobody had sourced.
 *
 * At a five-in-nine error rate an unchecked figure is closer to a coin flip
 * than to information, and the card renders it as "min entry" — a flat
 * assertion with no room to hedge. So the column is now an allow-list: a fund
 * shows a minimum only if it appears below, and adding one means doing the
 * corroboration rather than adding a line here and re-running the suite.
 *
 * This is deliberately annoying to extend. The failure it prevents is quiet:
 * nothing errors, no test goes red, a reader simply arrives at a provider that
 * turns them away.
 */
/* Scoped to money market funds. The T-bill and IFB minimums come from CBK's
 * own prospectuses (Ksh 50,000 and 100,000) and the SACCO figures from SASRA —
 * published, stable, and not part of the provider survey that went wrong. */
const isSurveyed = (p: { type: string }) => p.type === "mmf";

const CORROBORATED: Record<string, number> = {
  // slug: minimum confirmed on the provider's own domain, 31 July 2026
  "ziidi-mmf": 100,
  "britam-mmf": 1000,
  "old-mutual-mmf": 1000,
  "ncba-mmf": 1000,
  "cytonn-mmf": 1000,
  "lofty-corban-mmf": 1000,
  /* Added on the SECOND pass, later the same day. Five funds whose stored
   * figures were found wrong were blanked first — the right immediate move,
   * because deleting a wrong number is fast and sourcing the right one is not.
   * Each of these was then confirmed against the provider's own domain, so the
   * row is back with the correct value rather than left empty.
   *
   * CIC is the instructive one: 5,000 is the INITIAL minimum and 1,000 is the
   * top-up. The old figure was not invented, it was the right number for the
   * wrong question — which is how it survived so long looking reasonable. */
  "cic-mmf": 5000,
  "kcb-mmf": 5000,
  "etica-mmf": 100,
  "zimele-mmf": 100,
  "sanlam-mmf": 2500,
};

describe("every shown minimum has been corroborated", () => {
  it("has products to check, so the guard is not vacuous", () => {
    expect(PRODUCT_LINKS.filter(isSurveyed).length, "no MMFs found to check").toBeGreaterThan(10);
  });

  it("shows a minimum only for funds on the corroborated list", () => {
    const shown = PRODUCT_LINKS.filter(isSurveyed).filter((p) => p.minKes !== undefined);
    const unlisted = shown
      .filter((p) => !(p.slug in CORROBORATED))
      .map((p) => `${p.slug} (Ksh ${p.minKes})`);
    expect(
      unlisted,
      [
        "These funds show a 'min entry' that has not been corroborated against",
        "the provider's own site. Five of nine checked figures were wrong, one by",
        "a factor of a thousand — so confirm it and add it to CORROBORATED, or",
        "leave minKes undefined and the card will simply omit the row.",
      ].join(" ")
    ).toEqual([]);
  });

  it("shows the value that was actually corroborated, not a nearby one", () => {
    for (const p of PRODUCT_LINKS.filter(isSurveyed)) {
      if (p.minKes === undefined) continue;
      expect(p.minKes, `${p.slug} drifted from the corroborated figure`).toBe(
        CORROBORATED[p.slug]
      );
    }
  });

  it("keeps the fund that could not be sourced showing nothing at all", () => {
    /* Down to one. The other four were blanked on the first pass and restored
     * on the second once each was confirmed at source.
     *
     * Dry Associates stays empty because its own site publishes no minimum at
     * all. The 1,000,000 figure came from elsewhere and is probably right —
     * and probably-right is precisely the standard that put 1,000 here, a
     * thousandfold understatement pointing retail savers at an institutional
     * fund. This is the entry that column failed worst on, so it is the last
     * one that gets the benefit of the doubt. */
    for (const slug of ["dry-associates-mmf"]) {
      const p = PRODUCT_LINKS.find((x) => x.slug === slug);
      if (!p) continue;
      expect(p.minKes, `${slug} was found wrong in the survey and must show no minimum`).toBeUndefined();
    }
  });
});
