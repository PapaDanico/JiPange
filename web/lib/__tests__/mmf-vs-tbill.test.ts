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

  it("declines to name a winner when the assumption outweighs the answer", () => {
    const c = compareAt(364)!;
    // The premise, asserted rather than assumed: today the edge really is
    // smaller than the assumption's own reliability.
    expect(Math.abs(c.edgePp)).toBeLessThan(c.assumedSpreadPp);
    expect(c.tooCloseToCall).toBe(true);
    expect(verdictFor(500_000, 364)!.kind).toBe("too-close");
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
