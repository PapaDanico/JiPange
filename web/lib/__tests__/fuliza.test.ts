import { describe, it, expect } from "vitest";
import {
  calculateFulizaCost,
  fulizaDailyFee,
  fulizaAccessFee,
  fulizaChargeableDays,
  FULIZA_FREE_DAYS,
  FULIZA_GRACE_BALANCE_CEILING,
  FULIZA_MAX_LIMIT,
} from "../fuliza";

/**
 * Fuliza on the tariff Safaricom actually charges.
 *
 * These tests replace ones written against a flat 1.083%-of-principal-per-day
 * model, which overstated the cost roughly two- to three-fold. The old
 * expectations are kept below as the thing being asserted AGAINST, because the
 * previous figures looked entirely plausible and would look plausible again.
 */
describe("the tariff", () => {
  it("charges a flat fee per band, not a percentage of the balance", () => {
    /* The heart of the old error. A percentage model said Ksh 10,000 costs
     * 108.30 a day. The real fee for that band is 25 before excise, 30 after —
     * and it is the same 30 whether you owe 2,501 or 70,000. */
    expect(fulizaDailyFee(10_000)).toBe(30);
    expect(fulizaDailyFee(2_501)).toBe(fulizaDailyFee(70_000));
    expect(fulizaDailyFee(10_000)).not.toBeCloseTo(10_000 * 0.01083, 1);
  });

  it("charges nothing at all on the smallest balances", () => {
    expect(fulizaDailyFee(100)).toBe(0);
    expect(fulizaDailyFee(0)).toBe(0);
  });

  it("gives three free days at or below Ksh 1,000, and none above", () => {
    expect(fulizaChargeableDays(1_000, 3)).toBe(0);
    expect(fulizaChargeableDays(1_000, 7)).toBe(7 - FULIZA_FREE_DAYS);
    expect(fulizaChargeableDays(FULIZA_GRACE_BALANCE_CEILING + 1, 7)).toBe(7);
  });

  it("adds excise to the access fee as well as the daily fee", () => {
    // 1% of 1,000 is 10; excise at 20% makes it 12.
    expect(fulizaAccessFee(1_000)).toBe(12);
  });

  it("prices a week on Ksh 1,000 at what a statement would show", () => {
    /* Access 12, three free days, then four days at 6. Total 36.
     * The old model returned 76 for this — more than double. */
    const r = calculateFulizaCost(1_000, 7);
    expect(r.accessFee).toBe(12);
    expect(r.chargeableDays).toBe(4);
    expect(r.totalFee).toBe(36);
    expect(r.totalRepaid).toBe(1_036);
  });

  it("costs only the access fee when repaid inside the grace period", () => {
    const r = calculateFulizaCost(500, 3);
    expect(r.chargeableDays).toBe(0);
    expect(r.totalFee).toBe(r.accessFee);
  });

  it("does not scale fees linearly with days, and bites harder the longer you hold", () => {
    /* The old test asserted linearity — fees proportional to days — which a flat
     * percentage from day one produces and the real tariff does not.
     *
     * I first wrote this expecting SUBlinearity and the run corrected me:
     * fourteen days costs 78 against 72 for two separate seven-day borrowings.
     * The grace period is spent once, so week one has four chargeable days and
     * week two has seven. Holding a balance twice as long costs MORE than twice
     * as much, which is the opposite of the intuition and the more useful thing
     * to tell someone deciding whether to clear it today. */
    const seven = calculateFulizaCost(1_000, 7).totalFee;
    const fourteen = calculateFulizaCost(1_000, 14).totalFee;
    expect(fourteen).toBeGreaterThan(seven * 2);
    // Two separate short borrowings genuinely beat one long one.
    expect(seven * 2).toBeLessThan(fourteen);
  });

  it("annualises steeply against the smallest borrowers", () => {
    // A flat fee is regressive by construction. This is the product's shape.
    const small = calculateFulizaCost(150, 30).annualisedApr;
    const large = calculateFulizaCost(10_000, 30).annualisedApr;
    expect(small).toBeGreaterThan(600);
    expect(large).toBeLessThan(150);
  });

  it("knows its own ceiling", () => {
    // Above this the facility does not exist, so no quote is meaningful.
    expect(FULIZA_MAX_LIMIT).toBe(70_000);
  });

  it("charges nothing for nothing", () => {
    const r = calculateFulizaCost(0, 0);
    expect(r.totalFee).toBe(0);
    expect(r.totalRepaid).toBe(0);
  });
});
