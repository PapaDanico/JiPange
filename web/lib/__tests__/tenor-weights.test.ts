import { describe, it, expect } from "vitest";
import {
  DHOWCSD_BILL_MINIMUM,
  EVEN_WEIGHTS,
  dhowcsdLadder,
  type TenorWeights,
} from "@/lib/market-2026";
import { bestPayingTenor, tbillRate, TBILL_RATES } from "@/lib/rates-feed";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

/**
 * Tailoring the split across tenors.
 *
 * Equal thirds is a reasonable default and a poor answer to most real
 * questions: a deposit you might need in a hurry belongs mostly in the 91-day
 * rung, a bonus parked for a year mostly in the 364-day one. These tests pin
 * that the reader's weighting is honoured, that the blended yield actually
 * responds to it, and that no weighting can produce a bid CBK would reject.
 */

const CAP = 900_000; // divides cleanly so rounding is not the subject here

describe("weights change the answer, in the right direction", () => {
  const yieldFor = (weights: TenorWeights) => dhowcsdLadder(CAP, weights).blendedYield;

  it("a plain average would have hidden the whole feature", () => {
    // The blend is weighted by money. An unweighted mean of the three tenors
    // returns the same number whatever the reader chooses, which is how a
    // control becomes a decoration.
    expect(yieldFor({ 91: 3, 182: 1, 364: 1 })).not.toBeCloseTo(
      yieldFor({ 91: 1, 182: 1, 364: 3 }),
      6,
    );
  });

  it("weighting the shortest tenor lowers the blend, because it pays least", () => {
    const even = yieldFor(EVEN_WEIGHTS);
    expect(yieldFor({ 91: 3, 182: 1, 364: 1 })).toBeLessThan(even);
  });

  it("weighting a tenor pulls the blend toward that tenor's yield", () => {
    /* This used to read "weighting the longest tenor RAISES it", and it passed
     * for as long as the 364-day bill was the best-paying rung. That was never
     * a property of the weighting; it was a property of the curve, and the
     * curve has since inverted in effective-annual terms. Mwangaza's pricing
     * correction of 30 July 2026 dropped the 364-day net yield below both
     * shorter tenors, because a one-year bill is bought once while a 91-day
     * bill is rolled four times and compounds — so the old assertion started
     * failing on a market fact, not a bug.
     *
     * What the weighting actually guarantees is directional: tilt toward a
     * rung and the blend moves toward that rung, whichever way that is. Stated
     * that way it holds under any curve, which is the point. */
    const even = yieldFor(EVEN_WEIGHTS);
    for (const days of [91, 182, 364] as const) {
      const own = tbillRate(days)!.netEAY / 100;
      const tilted = yieldFor({ 91: 1, 182: 1, 364: 1, [days]: 3 });
      expect(
        Math.abs(tilted - own),
        `tilting toward ${days}d moved the blend away from the ${days}d yield`
      ).toBeLessThan(Math.abs(even - own));
    }
  });

  it("records that the longest rung is not the best-paying one", () => {
    // Not an assertion about which way the curve should point — a note that
    // fails if the shape changes, so nobody reads the test above as a claim
    // about the market. Rolling short currently beats locking in for the year.
    //
    // The condition was `y364 < y91 || y364 > y182`, and the second operator
    // is inverted: it passes whenever the one-year bill beats the six-month
    // one, which is the very thing this guard exists to catch. It survived
    // only because the curve was fully inverted, so the first clause carried
    // it; when the 20 Aug 2026 auction left a humped curve (91d below 364d
    // below 182d) the whole assertion went red at once, having never actually
    // tested the property it names. What it means is that 364d is not the top
    // rung — say that directly, and it holds under any shape.
    const [y91, y182, y364] = ([91, 182, 364] as const).map((d) => tbillRate(d)!.netEAY);
    expect(
      y364 < Math.max(y91, y182),
      `the tenor curve has changed shape: 91d ${y91}%, 182d ${y182}%, 364d ${y364}% — ` +
        "re-check anything that presents a longer tenor as the better-paying rung, " +
        "starting with bestPayingTenor() in lib/rates-feed.ts and the ladder presets"
    ).toBe(true);
  });

  it("a single tenor lands exactly on that bill's net yield", () => {
    // The strongest statement that the weighting is real: with everything in
    // one rung the blend must BE that rung, to the last decimal.
    for (const days of [91, 182, 364] as const) {
      const only: TenorWeights = { 91: 0, 182: 0, 364: 0, [days]: 1 };
      const l = dhowcsdLadder(CAP, only);
      expect(l.buckets).toHaveLength(1);
      expect(l.buckets[0].days).toBe(days);
      expect(l.blendedYield).toBeCloseTo(tbillRate(days)!.netEAY / 100, 10);
    }
  });

  it("relative weights are what matter, not their size", () => {
    // 2:1:1 and 20:10:10 are the same instruction.
    expect(yieldFor({ 91: 2, 182: 1, 364: 1 })).toBeCloseTo(
      yieldFor({ 91: 20, 182: 10, 364: 10 }),
      10,
    );
  });
});

describe("the allocator cannot produce an unplaceable bid", () => {
  it("drops a rung weighted to zero rather than showing an empty one", () => {
    const l = dhowcsdLadder(CAP, { 91: 0, 182: 1, 364: 1 });
    expect(l.buckets.map((b) => b.days)).toEqual([182, 364]);
  });

  it("returns nothing at all when no rung can reach the minimum", () => {
    const l = dhowcsdLadder(90_000, EVEN_WEIGHTS);
    expect(l.buckets).toHaveLength(0);
    expect(l.unallocatedKes).toBe(90_000);
    expect(l.blendedYield).toBe(0);
  });

  it("survives every weight being zero without dividing by it", () => {
    const l = dhowcsdLadder(CAP, { 91: 0, 182: 0, 364: 0 });
    expect(l.buckets).toHaveLength(0);
    expect(Number.isFinite(l.blendedYield)).toBe(true);
    expect(l.unallocatedKes).toBe(CAP);
  });

  it("reports the rounding remainder rather than folding it into a rung", () => {
    // 430,000 in thirds is 143,333 each; floored to placeable steps that is
    // 100,000 each, leaving 130,000 the reader should know about.
    const l = dhowcsdLadder(430_000, EVEN_WEIGHTS);
    expect(l.buckets.every((b) => b.allocation === 100_000)).toBe(true);
    expect(l.unallocatedKes).toBe(130_000);
  });

  it("conserves capital at every weighting", () => {
    for (const w of [EVEN_WEIGHTS, { 91: 5, 182: 2, 364: 1 }, { 91: 0, 182: 0, 364: 7 }]) {
      for (const cap of [100_000, 333_000, 700_000, 2_500_000]) {
        const l = dhowcsdLadder(cap, w);
        const placed = l.buckets.reduce((s, b) => s + b.allocation, 0);
        expect(placed + l.unallocatedKes).toBe(cap);
        for (const b of l.buckets) {
          expect(b.allocation).toBeGreaterThanOrEqual(DHOWCSD_BILL_MINIMUM);
        }
      }
    }
  });
});

describe("tailored flag", () => {
  it("is false for the default and true once the reader changes it", () => {
    expect(dhowcsdLadder(CAP, EVEN_WEIGHTS).tailored).toBe(false);
    expect(dhowcsdLadder(CAP, { 91: 3, 182: 1, 364: 1 }).tailored).toBe(true);
  });
});

/**
 * The curve's shape is data, and copy that states it is a claim with an expiry
 * date.
 *
 * The ladder shipped the preset hint "the 364-day rung, which pays most" for
 * weeks after that stopped being true — telling somebody about to place real
 * money that the longest lock earned the most, while the feed in the same
 * build said the 182-day rung paid more. The guard above should have caught it
 * and did not, because its second comparison was inverted.
 *
 * So two things are pinned here: the derived answer is genuinely the maximum,
 * and no component asserts a best-paying rung in prose instead of asking for
 * it.
 */
describe("nothing hardcodes which rung pays most", () => {
  it("bestPayingTenor() is the highest net yield in the feed, not a guess", () => {
    const best = bestPayingTenor();
    for (const r of TBILL_RATES) expect(best.netEAY).toBeGreaterThanOrEqual(r.netEAY);
    expect(TBILL_RATES.some((r) => r.tenorDays === best.tenorDays)).toBe(true);
  });

  it("no component claims a tenor pays most in fixed prose", () => {
    const dir = path.join(__dirname, "..", "..", "components");
    const offenders: string[] = [];
    const walk = (d: string) => {
      for (const entry of readdirSync(d, { withFileTypes: true })) {
        const full = path.join(d, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (/\.tsx?$/.test(entry.name)) {
          for (const [i, line] of readFileSync(full, "utf8").split("\n").entries()) {
            // A string literal that names a tenor and asserts it pays most.
            if (/\b(91|182|364)[- ]?day\b/.test(line) && /pays? (the )?most|best[- ]paying|highest[- ]paying/.test(line)) {
              // Deriving it is the fix, so a line that calls the helper is fine.
              if (/bestPayingTenor|BEST_PAYING|LONGEST_IS_BEST_PAYING/.test(line)) continue;
              offenders.push(`${path.relative(dir, full)}:${i + 1}`);
            }
          }
        }
      }
    };
    walk(dir);
    expect(
      offenders,
      `these lines state which tenor pays most instead of reading it from the feed — ` +
        `use bestPayingTenor() in lib/rates-feed.ts: ${offenders.join(", ")}`
    ).toEqual([]);
  });
});
