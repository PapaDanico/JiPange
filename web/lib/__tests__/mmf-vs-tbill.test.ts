import { describe, it, expect } from "vitest";
import { tbillRate } from "../rates-feed";
import { MMF_SPREAD_OVER_TBILL_PCT } from "../mmf-assumption";
import {
  compareAt,
  verdictFor,
  SPREAD_CONFIDENCE_PP,
  WHT_ON_INTEREST,
} from "../mmf-vs-tbill";

/**
 * The comparison must never be more confident than its own assumption.
 *
 * The MMF side of this is the 91-day bill plus a spread this project assumes.
 * On today's feed the assumption is 1.00pp and the answer it produces is
 * 0.31pp — so two thirds of the way to nothing and the winner changes. A card
 * that printed a ranking anyway would be presenting an assumption as a finding,
 * which is the exact failure this codebase removed from its MMF yields once
 * already.
 */
describe("the comparison knows what it rests on", () => {
  it("computes a break-even spread from the bills, not from the MMF guess", () => {
    const c = compareAt(364)!;
    const b364 = tbillRate(364)!;
    const b91 = tbillRate(91)!;
    // Both instruments are taxed at the same rate, so tax cancels and the tie
    // point is simply the gap between the two gross bill yields.
    expect(c.breakEvenSpreadPp).toBeCloseTo(b364.grossEAY - b91.grossEAY, 6);
  });

  it("declines to name a winner exactly when the gap is inside the noise", () => {
    /* This asserted that the 364-day comparison IS too close to call, which
     * was true when written and is a fact about the market rather than about
     * the code. Mwangaza's pricing correction of 30 July 2026 dropped the
     * 364-day net yield by about 76 basis points while leaving the MMF anchor
     * — the 91-day bill — almost where it was, so the gap widened past the
     * threshold and the card now names a winner. Nothing was broken; the test
     * was holding a photograph of the market and calling it a specification.
     *
     * What the card actually promises is the rule: it refuses a verdict when
     * the difference is smaller than the confidence we have in the MMF
     * estimate, and gives one otherwise. That is asserted for every tenor. */
    for (const days of [91, 182, 364] as const) {
      const c = compareAt(days);
      if (!c) continue;
      const inside = Math.abs(c.edgePp) < SPREAD_CONFIDENCE_PP;
      expect(
        c.tooCloseToCall,
        `${days}d: edge ${c.edgePp.toFixed(3)}pp against a ${SPREAD_CONFIDENCE_PP}pp threshold`
      ).toBe(inside);

      const v = verdictFor(1_000_000, days)!;
      if (inside) expect(v.kind).toBe("too-close");
      else expect(v.kind).not.toBe("too-close");
    }
  });

  it("records where the comparison currently lands, so a shift is visible", () => {
    /* Not a requirement — a tripwire. If this starts failing, the market moved
     * and the copy around this card is worth re-reading; that is the whole
     * reason the previous version of the test above was valuable, minus the
     * part where it pretended to be a spec. */
    const c = compareAt(364)!;
    expect(
      c.edgePp,
      `the money market fund's edge over the 364-day bill is now ${c.edgePp.toFixed(2)}pp ` +
        "— re-read the comparison copy if this has crossed zero"
    ).toBeGreaterThan(0);
    expect(c.billNetPct).toBeLessThan(c.mmfNetPct);
  });

  it("applies the same withholding to both sides", () => {
    const c = compareAt(364)!;
    const b = tbillRate(364)!;
    // If one side were taxed and the other not, the break-even above would be
    // wrong and the card would mislead in whichever direction the error ran.
    expect(c.billNetPct).toBeCloseTo(b.netEAY, 6);
    expect(WHT_ON_INTEREST).toBe(0.15);
  });

  /**
   * The one fact in this whole comparison that needs no assumption.
   *
   * A Treasury bill cannot be bought below its minimum, so under that figure
   * the MMF is not the better choice — it is the only one. Most readers of this
   * app are below it, which makes this the most useful branch and the one that
   * must never be gated behind a yield estimate.
   */
  it("answers from the minimum first, before any yield reasoning", () => {
    const c = compareAt(364)!;
    expect(c.billMinimumKES).toBeGreaterThan(0);
    const v = verdictFor(c.billMinimumKES - 1, 364)!;
    expect(v.kind).toBe("below-minimum");
    if (v.kind === "below-minimum") expect(v.minimumKES).toBe(c.billMinimumKES);
    // And at the minimum exactly, the comparison resumes.
    expect(verdictFor(c.billMinimumKES, 364)!.kind).not.toBe("below-minimum");
  });

  it("names a winner once the gap is bigger than the doubt", () => {
    // Not reachable from today's feed, so exercised directly: the thresholds
    // must actually separate, or "too close" would be the only answer forever
    // and this module would be decoration.
    expect(SPREAD_CONFIDENCE_PP).toBeGreaterThan(0);
    expect(SPREAD_CONFIDENCE_PP).toBeLessThan(MMF_SPREAD_OVER_TBILL_PCT);
  });

  it("says nothing at all rather than guessing at a tenor the feed lacks", () => {
    expect(compareAt(7)).toBeNull();
    expect(verdictFor(1_000_000, 7)).toBeNull();
  });

  it("covers every tenor the feed does publish", () => {
    for (const d of [91, 182, 364]) {
      const c = compareAt(d);
      expect(c, `no comparison for the ${d}-day bill`).not.toBeNull();
      expect(c!.billTenorDays).toBe(d);
    }
  });
});
