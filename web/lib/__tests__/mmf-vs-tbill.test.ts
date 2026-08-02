import { describe, it, expect } from "vitest";
import { tbillRate } from "../rates-feed";
import {
  compareAt,
  verdictFor,
  SPREAD_CONFIDENCE_PP,
  WHT_ON_INTEREST,
  rankByEdge,
} from "../mmf-vs-tbill";

/**
 * The comparison must never be more confident than its own assumption.
 *
 * The MMF side of this is the 91-day bill plus a spread this project assumes.
 * A card that printed a ranking built mostly on that assumption would be
 * presenting an assumption as a finding, which is the exact failure this
 * codebase removed from its MMF yields once already.
 *
 * This paragraph used to say "the assumption is 1.00pp and the answer it
 * produces is 0.31pp". Both numbers are dead. The spread was measured against
 * 32 funds and corrected to 0.00pp, which is the whole point of
 * mmf-assumption.ts — and the header describing the module went on quoting the
 * value the module was changed to stop using. As of this writing the edges are
 * 0.04, -0.04 and 0.05pp at 91, 182 and 364 days against a 0.35pp threshold,
 * so every tenor the feed publishes is inside the noise. Figures move; the
 * point does not, so the point is what is written here now.
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
    /* The thresholds must actually separate, or "too close" is the only answer
     * forever and this module is decoration.
     *
     * This compared the confidence threshold against MMF_SPREAD_OVER_TBILL_PCT,
     * which worked while the spread was 1.00 and became meaningless when it was
     * corrected to zero: a threshold is not required to be smaller than an
     * assumption it does not depend on. What it must do is separate SOME
     * reachable pair of yields, which is what is asserted now. */
    expect(SPREAD_CONFIDENCE_PP).toBeGreaterThan(0);
    expect(SPREAD_CONFIDENCE_PP).toBeLessThan(2);

    /* This asserted `Math.abs(edge) + THRESHOLD + 0.1 > THRESHOLD`, which is
     * true for every real number there has ever been. The test named "names a
     * winner once the gap is bigger than the doubt" could not fail — and its
     * own comment says the thresholds "must actually separate, or too close is
     * the only answer forever and this module is decoration", which is exactly
     * the state it was incapable of detecting.
     *
     * It is worth detecting, because that state is the CURRENT one: with the
     * spread corrected to zero the MMF is the 91-day bill, and all three
     * published tenors sit inside the threshold. The card answers "too close
     * to call" every time its yield branch is reached.
     *
     * That is the honest answer and not a bug — the two instruments really do
     * pay the same. What must stay true is that the decision rule is capable
     * of the other answers, so a real gap would still be named. Asserted on
     * the rule itself at both sides of the boundary, rather than on whichever
     * side today's market happens to fall. */
    const justOver = SPREAD_CONFIDENCE_PP + 1e-6;
    expect(rankByEdge(justOver)).toBe("mmf-ahead");
    expect(rankByEdge(-justOver)).toBe("bill-ahead");
    expect(rankByEdge(SPREAD_CONFIDENCE_PP - 1e-6)).toBe("too-close");
    expect(rankByEdge(0)).toBe("too-close");

    /* And it must be the rule the module actually applies, not a copy living
     * in this file. compareAt and verdictFor both route through rankByEdge,
     * so asserting they agree with it on every published tenor closes the
     * loop that the old tautology left open. */
    for (const days of [91, 182, 364] as const) {
      const c = compareAt(days);
      if (!c) continue;
      const v = verdictFor(1_000_000, days)!;
      expect(v.kind, `${days}d`).toBe(rankByEdge(c.edgePp));
      expect(c.tooCloseToCall, `${days}d`).toBe(rankByEdge(c.edgePp) === "too-close");
    }

    /* A limit of this suite, stated rather than left to be discovered.
     *
     * `tooCloseToCall` is derived from rankByEdge, and every tenor the feed
     * publishes is currently inside the threshold — so replacing that field
     * with a literal `true` still passes here. It is not detectable from feed
     * data alone while the market sits where it does, and inventing synthetic
     * yields to force the other branch would be testing a fixture rather than
     * the product.
     *
     * What that costs is bounded: the field is a convenience, and the verdict
     * a reader is shown comes from rankByEdge, which IS pinned at both sides of
     * the boundary above. If the spread ever opens, the tripwire below starts
     * failing and this gap closes on its own. */
  });

  it("records that every published tenor is currently too close to call", () => {
    /* A tripwire, not a requirement. The yield-ranking half of this card never
     * fires today; what carries it is the below-minimum branch, which needs no
     * yield estimate at all. If this starts failing the spread has opened and
     * the copy around the card is worth re-reading. */
    const inside = ([91, 182, 364] as const)
      .map((d) => compareAt(d))
      .filter((c): c is NonNullable<typeof c> => c !== null);
    expect(inside.length).toBe(3);
    for (const c of inside) {
      expect(
        c.tooCloseToCall,
        `${c.billTenorDays}d now has a ${c.edgePp.toFixed(3)}pp edge against a ` +
          `${SPREAD_CONFIDENCE_PP}pp threshold — the spread has opened, re-read the card copy`
      ).toBe(true);
    }
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
