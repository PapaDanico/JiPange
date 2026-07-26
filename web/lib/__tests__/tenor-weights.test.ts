import { describe, it, expect } from "vitest";
import {
  DHOWCSD_BILL_MINIMUM,
  EVEN_WEIGHTS,
  dhowcsdLadder,
  type TenorWeights,
} from "@/lib/market-2026";
import { tbillRate } from "@/lib/rates-feed";

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

  it("weighting the longest tenor raises it", () => {
    const even = yieldFor(EVEN_WEIGHTS);
    expect(yieldFor({ 91: 1, 182: 1, 364: 3 })).toBeGreaterThan(even);
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
