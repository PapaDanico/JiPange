import { describe, it, expect } from "vitest";
import { calculateMerryGoRound, calculateChamaInvestment, MAX_CHAMA_MEMBERS } from "../chama";
import { futureValue } from "../projections";

/**
 * Chama maths, previously untested.
 *
 * A merry-go-round is the most common savings vehicle in Kenya and the easiest
 * to describe wrongly — it is tempting to show the first receiver "winning".
 * They do not. Everybody pays the same total and everybody receives the same
 * payout; the only difference is WHEN, which is a present-value effect, not a
 * cash one. The module already models it that way. These tests hold it there,
 * because the flattering version of this story is the one that writes itself.
 */
describe("merry-go-round", () => {
  it("is zero-sum in cash when no buffer is held back", () => {
    const r = calculateMerryGoRound(10, 2_000, 0);
    expect(r.monthlyPool).toBe(20_000);
    expect(r.rotationPayout).toBe(20_000);
    expect(r.cycleMonths).toBe(10);
    // Each member pays 2,000 x 10 and receives 20,000 once. Net nil.
    expect(r.netGainFirstReceiver).toBe(0);
    expect(r.netGainLastReceiver).toBe(0);
  });

  it("gives first and last receiver the same cash, differing only in timing", () => {
    const r = calculateMerryGoRound(12, 5_000, 10);
    expect(r.netGainFirstReceiver).toBe(r.netGainLastReceiver);
    // But going first IS worth something, discounted — and the module says so.
    expect(r.firstVersusLastKES).toBeGreaterThan(0);
    expect(r.slotPresentValues.length).toBe(12);
    // Earlier slots must be worth at least as much as later ones.
    for (let i = 1; i < r.slotPresentValues.length; i++) {
      expect(r.slotPresentValues[i]).toBeLessThanOrEqual(r.slotPresentValues[i - 1]);
    }
  });

  it("takes the buffer out of the payout, not out of thin air", () => {
    const r = calculateMerryGoRound(10, 2_000, 10);
    expect(r.rotationPayout).toBe(18_000);
    expect(r.emergencyFundPerCycle).toBe(2_000 * 10);
    // The buffer is exactly what the members no longer receive.
    expect(r.monthlyPool - r.rotationPayout).toBeCloseTo(r.emergencyFundPerCycle / r.cycleMonths, 6);
  });
});

describe("investment chama", () => {
  it("compounds through the same engine the rest of the app uses", () => {
    const r = calculateChamaInvestment(10, 2_000, 11);
    expect(r.monthlyPool).toBe(20_000);
    expect(r.value1Yr).toBeCloseTo(futureValue(0, 20_000, 0.11, 1), 6);
    expect(r.value5Yr).toBeCloseTo(futureValue(0, 20_000, 0.11, 5), 6);
  });

  it("splits the pot evenly and loses nothing in the split", () => {
    const r = calculateChamaInvestment(8, 3_000, 11);
    expect(r.perMemberShare5Yr * 8).toBeCloseTo(r.value5Yr, 6);
    // And growth must beat the flat contributions, or the fund is pointless.
    expect(r.value5Yr).toBeGreaterThan(24_000 * 60);
  });

  it("returns zeroes rather than dividing by an empty group", () => {
    const r = calculateChamaInvestment(0, 5_000, 11);
    expect(r.value1Yr).toBe(0);
    expect(r.perMemberShare1Yr).toBe(0);
    expect(Number.isFinite(r.perMemberShare5Yr)).toBe(true);
  });
});

/**
 * The rotation valuation, bounded — and proved unchanged.
 *
 * The slot values were computed with a nested loop: for every slot, sum the
 * present value of every contribution. The inner sum does not depend on the
 * slot — a member pays the same instalments on the same dates whenever they
 * collect — so it was quadratic in the member count for an answer that never
 * varied. At 999,999,999,999 members, which is one mistyped digit, the tab
 * locked solid.
 *
 * Hoisting the sum is therefore not an approximation, and this asserts that
 * rather than claiming it: the result is checked against a direct, deliberately
 * naive re-implementation of the original nested form.
 */
describe("the rotation valuation", () => {
  it("matches a naive nested recomputation exactly", () => {
    for (const members of [2, 5, 12, 30]) {
      const contribution = 5_000;
      const r = calculateMerryGoRound(members, contribution, 0);
      const payout = members * contribution;
      const monthly = Math.pow(1 + r.discountRate, 1 / 12) - 1;
      const disc = (m: number) => 1 / Math.pow(1 + monthly, m);
      for (let slot = 1; slot <= members; slot++) {
        let pv = payout * disc(slot);
        for (let m = 1; m <= members; m++) pv -= contribution * disc(m);
        expect(r.slotPresentValues[slot - 1]).toBeCloseTo(pv, 6);
      }
    }
  });

  it("keeps slot 1 worth the most and slot N the least", () => {
    // The property the module's own comment says falls out of money having a
    // price. If the hoist had broken the ordering this would catch it.
    const r = calculateMerryGoRound(12, 5_000, 0);
    const v = r.slotPresentValues;
    for (let i = 1; i < v.length; i++) expect(v[i]).toBeLessThan(v[i - 1]);
  });

  it("returns promptly for an absurd membership instead of hanging", () => {
    const started = performance.now();
    calculateMerryGoRound(MAX_CHAMA_MEMBERS, 1_000, 0);
    expect(performance.now() - started).toBeLessThan(250);
  });
});
