import { describe, it, expect } from "vitest";
import { smoothIncomes } from "../hustle-smoother";
import { maxSafeMonthlyDraw, nextCycleRunway } from "../hustle";

/**
 * Volatile-income smoothing, previously untested.
 *
 * This tool tells someone with a lumpy income — poultry cycles, harvests, gigs
 * — how much they can safely pay themselves each month. Get it too high and
 * they eat next cycle's seed capital, which for a smallholder is not a budget
 * variance, it is the end of the venture.
 */
describe("smoothing a volatile year", () => {
  const LUMPY = [0, 0, 180_000, 0, 0, 90_000, 0, 0, 150_000, 0, 0, 60_000];

  it("takes the draw from the median, not the average", () => {
    /* Median, deliberately. An average is dragged upwards by the one big
     * harvest and would set a draw the other eleven months cannot sustain —
     * exactly the mistake the tool exists to prevent. */
    const r = smoothIncomes(LUMPY, 1);
    expect(r.stats.median).toBeLessThan(r.stats.average);
    expect(r.monthlyDraw).toBe(Math.round(r.stats.median * 1));
  });

  it("respects the order months actually arrive in", () => {
    /* The same twelve figures shuffled give the same final buffer and a
     * completely different trough. Somebody whose big month comes last runs
     * dry first, and the tool has to say so — this is the property that would
     * break silently if the simulation ever ran over the sorted copy used for
     * the statistics. */
    const lateWindfall = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 480_000];
    const earlyWindfall = [480_000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const late = smoothIncomes(lateWindfall, 1);
    const early = smoothIncomes(earlyWindfall, 1);

    expect(late.finalBuffer).toBeCloseTo(early.finalBuffer, 6);
    expect(late.lowestBuffer).toBeLessThan(early.lowestBuffer);
  });

  it("reports the starting buffer needed to never go under", () => {
    const r = smoothIncomes(LUMPY, 1);
    if (r.goesNegative) {
      expect(r.requiredStartingBuffer).toBeCloseTo(-r.lowestBuffer, 6);
      expect(r.requiredStartingBuffer).toBeGreaterThan(0);
    } else {
      expect(r.requiredStartingBuffer).toBe(0);
    }
  });

  it("keeps the running buffer consistent with the surpluses", () => {
    const r = smoothIncomes(LUMPY, 0.8);
    let running = 0;
    for (const p of r.points) {
      running += p.surplus;
      expect(p.cumBuffer).toBeCloseTo(running, 6);
      expect(p.surplus).toBeCloseTo(p.income - r.monthlyDraw, 6);
    }
    expect(r.finalBuffer).toBeCloseTo(running, 6);
  });

  it("returns a defined shape for an empty year", () => {
    const r = smoothIncomes([], 1);
    expect(r.monthlyDraw).toBe(0);
    expect(r.points).toEqual([]);
    expect(r.goesNegative).toBe(false);
    expect(Number.isFinite(r.finalBufferMonths)).toBe(true);
  });

  it("does not mutate the caller's income list", () => {
    const input = [...LUMPY];
    smoothIncomes(input, 1);
    expect(input).toEqual(LUMPY);
  });
});

describe("what a cycle can safely pay", () => {
  it("spreads net profit across the months of the cycle", () => {
    // 90-day cycle is three months; 300k out, 120k of inputs, so 60k a month.
    expect(
      maxSafeMonthlyDraw({
        targetLumpSumPayout: 300_000,
        inputCostsPerCycle: 120_000,
        cycleLengthDays: 90,
      })
    ).toBeCloseTo(60_000, 6);
  });

  it("never lets a loss-making cycle suggest a draw", () => {
    // Inputs exceed the payout. The honest answer is nothing, not a negative.
    expect(
      maxSafeMonthlyDraw({
        targetLumpSumPayout: 50_000,
        inputCostsPerCycle: 80_000,
        cycleLengthDays: 60,
      })
    ).toBe(0);
  });

  it("refuses to divide by a zero-length cycle", () => {
    expect(
      maxSafeMonthlyDraw({
        targetLumpSumPayout: 100_000,
        inputCostsPerCycle: 0,
        cycleLengthDays: 0,
      })
    ).toBe(0);
  });

  it("calls seed capital protected only when it is fully covered", () => {
    expect(nextCycleRunway({ activeSavings: 50_000, inputCostsPerCycle: 50_000 })).toEqual({
      protected: true,
      shortfall: 0,
    });
    expect(nextCycleRunway({ activeSavings: 30_000, inputCostsPerCycle: 50_000 })).toEqual({
      protected: false,
      shortfall: 20_000,
    });
    // Savings beyond the requirement do not produce a negative shortfall.
    expect(nextCycleRunway({ activeSavings: 90_000, inputCostsPerCycle: 50_000 }).shortfall).toBe(0);
  });
});
