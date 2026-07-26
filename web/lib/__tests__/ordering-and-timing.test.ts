import { describe, it, expect } from "vitest";
import { smoothIncomes } from "@/lib/hustle-smoother";
import { calculateMerryGoRound } from "@/lib/chama";
import { tbillRate } from "@/lib/rates-feed";

/**
 * Two tools that answered the wrong question, both for the same reason: they
 * looked only at the total.
 *
 * The income smoother reported where the buffer ENDED and never where it went;
 * the chama calculator reported the cash difference between rotation slots,
 * which is exactly zero, and never what the timing was worth. In both cases
 * the arithmetic was right and the reader was misled.
 */

describe("the income smoother: where the buffer went, not just where it ended", () => {
  /**
   * The bug in one case. Two lean months, then three fat ones. The year ends
   * with a healthy buffer and the tool used to call that a success — while the
   * hustler was KES 140,000 overdrawn in February and would have had to
   * borrow to eat.
   */
  const LEAN_FIRST = [10_000, 10_000, 300_000, 100_000, 100_000];

  it("finds the hole even when the year ends well", () => {
    const r = smoothIncomes(LEAN_FIRST, 0.8);
    expect(r.monthlyDraw).toBe(80_000);
    expect(r.finalBuffer).toBeGreaterThan(0); // the old, reassuring answer
    expect(r.goesNegative).toBe(true); // the true one
    expect(r.lowestBuffer).toBe(-140_000);
    expect(r.lowestBufferMonth).toBe(2);
    expect(r.requiredStartingBuffer).toBe(140_000);
  });

  /**
   * The teeth. Same five months, richest first. Identical total, identical
   * median, identical draw, identical final buffer — and a completely
   * different year. Anything that reports only totals cannot tell these apart.
   */
  it("distinguishes two orderings that every total agrees on", () => {
    const lean = smoothIncomes(LEAN_FIRST, 0.8);
    const fat = smoothIncomes([...LEAN_FIRST].sort((a, b) => b - a), 0.8);

    expect(fat.stats.total).toBe(lean.stats.total);
    expect(fat.stats.median).toBe(lean.stats.median);
    expect(fat.monthlyDraw).toBe(lean.monthlyDraw);
    expect(fat.finalBuffer).toBe(lean.finalBuffer);
    expect(fat.shortMonths).toBe(lean.shortMonths);

    // Everything above is equal. This is the only thing that is not.
    expect(fat.goesNegative).toBe(false);
    expect(lean.goesNegative).toBe(true);
    expect(fat.requiredStartingBuffer).toBe(0);
    expect(lean.requiredStartingBuffer).toBe(140_000);
  });

  it("asks for nothing when the plan never dips", () => {
    const r = smoothIncomes([100_000, 110_000, 120_000, 130_000], 0.7);
    expect(r.goesNegative).toBe(false);
    expect(r.requiredStartingBuffer).toBe(0);
    expect(r.lowestBuffer).toBeGreaterThanOrEqual(0);
  });

  it("puts the trough on the running balance, not the worst single month", () => {
    // Month 3 is the worst month in isolation; month 4 is where the running
    // balance is deepest, because month 3's damage is still being carried.
    const r = smoothIncomes([120_000, 100_000, 10_000, 60_000, 200_000], 0.9);
    const running = r.points.map((p) => p.cumBuffer);
    expect(r.lowestBuffer).toBe(Math.min(...running));
    expect(r.points[r.lowestBufferMonth - 1].cumBuffer).toBe(r.lowestBuffer);
  });

  it("survives an empty history without inventing a trough", () => {
    const r = smoothIncomes([], 0.8);
    expect(r.lowestBuffer).toBe(0);
    expect(r.lowestBufferMonth).toBe(0);
    expect(r.goesNegative).toBe(false);
    expect(r.requiredStartingBuffer).toBe(0);
  });
});

describe("the chama: what the queue position is actually worth", () => {
  const r = calculateMerryGoRound(12, 2_000, 5);

  /**
   * The old UI printed netGainFirstReceiver in green with a "+" and
   * netGainLastReceiver in red. They are the same number, and it is negative:
   * every member pays the contribution for all N months and receives one
   * payout, so the cash result is minus the welfare buffer for everybody.
   */
  it("still reports the cash truth: every slot is identical, and it is the buffer", () => {
    expect(r.netGainFirstReceiver).toBe(r.netGainLastReceiver);
    expect(r.netGainFirstReceiver).toBeCloseTo(-(r.monthlyPool * 0.05), 6);
    expect(r.netGainFirstReceiver).toBeLessThan(0);
  });

  it("values the slots, and going first is worth the most — monotonically", () => {
    expect(r.slotPresentValues).toHaveLength(12);
    for (let i = 1; i < r.slotPresentValues.length; i++) {
      expect(r.slotPresentValues[i]).toBeLessThan(r.slotPresentValues[i - 1]);
    }
    expect(r.firstVersusLastKES).toBeGreaterThan(0);
    expect(r.firstVersusLastKES).toBeCloseTo(
      r.slotPresentValues[0] - r.slotPresentValues[11],
      6,
    );
  });

  it("discounts at the published risk-free rate, and says which one", () => {
    const bill = tbillRate(364)!;
    expect(r.discountRate).toBeCloseTo(bill.netEAY / 100, 10);
    expect(r.discountRateSource).toContain("364-day");
    expect(r.discountRateSource).toContain("after tax");
  });

  /**
   * The gap is the price of money over the cycle, so a longer cycle and a
   * bigger pool both make the queue position matter more. A group of 30 is
   * allocating something worth arguing about; a group of 3 is not.
   */
  it("grows with the length of the cycle", () => {
    const small = calculateMerryGoRound(4, 2_000, 5);
    const big = calculateMerryGoRound(24, 2_000, 5);
    expect(big.firstVersusLastKES).toBeGreaterThan(small.firstVersusLastKES);
  });

  /**
   * The gap is entirely a time-value effect, so it must scale with the size of
   * the sums moving. Doubling every contribution doubles it exactly — if it
   * did not, something other than discounting would be leaking in.
   */
  it("scales linearly with the money involved", () => {
    const a = calculateMerryGoRound(12, 2_000, 5);
    const b = calculateMerryGoRound(12, 4_000, 5);
    expect(b.firstVersusLastKES).toBeCloseTo(a.firstVersusLastKES * 2, 6);
  });

  it("prices a two-member rotation without dividing by anything", () => {
    const two = calculateMerryGoRound(2, 1_000, 0);
    expect(two.slotPresentValues).toHaveLength(2);
    expect(Number.isFinite(two.firstVersusLastKES)).toBe(true);
    expect(two.firstVersusLastKES).toBeGreaterThan(0);
  });
});
