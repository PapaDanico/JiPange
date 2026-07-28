import { describe, expect, it } from "vitest";
import { calculateLandPurchase, conveyancingScaleFee, CONVEYANCING_MINIMUM_FEE, LEGAL_FEES_VAT_RATE } from "../land";

describe("calculateLandPurchase", () => {
  it("applies 4% stamp duty for urban land", () => {
    const result = calculateLandPurchase({
      plotPriceKes: 1_000_000,
      landType: "urban_residential",
      usesAgent: false,
    });
    expect(result.stampDuty).toBe(40_000);
    expect(result.stampDutyRatePct).toBe(4);
  });

  it("applies 2% stamp duty for agricultural land", () => {
    const result = calculateLandPurchase({
      plotPriceKes: 1_000_000,
      landType: "agricultural",
      usesAgent: false,
    });
    expect(result.stampDuty).toBe(20_000);
    expect(result.stampDutyRatePct).toBe(2);
  });

  it("adds 3% agent commission when usesAgent is true", () => {
    const price = 2_000_000;
    const withAgent = calculateLandPurchase({ plotPriceKes: price, landType: "urban_residential", usesAgent: true });
    const withoutAgent = calculateLandPurchase({ plotPriceKes: price, landType: "urban_residential", usesAgent: false });
    expect(withAgent.agentCommission).toBe(60_000);
    expect(withoutAgent.agentCommission).toBe(0);
  });

  it("grand total equals plot price plus all transaction costs", () => {
    const result = calculateLandPurchase({
      plotPriceKes: 3_000_000,
      landType: "urban_residential",
      usesAgent: true,
    });
    expect(result.grandTotal).toBe(result.plotPrice + result.totalTransactionCosts);
    expect(result.totalTransactionCosts).toBe(
      result.stampDuty +
        result.legalFees +
        result.valuationFee +
        result.titleTransferFee +
        result.landSearchFee +
        result.surveyFee +
        result.agentCommission
    );
  });

  it("hidden cost percentage is positive and reasonable for urban land", () => {
    const result = calculateLandPurchase({
      plotPriceKes: 5_000_000,
      landType: "urban_residential",
      usesAgent: false,
    });
    // Stamp duty alone is 4% so hidden costs should be well above 4%.
    expect(result.hiddenCostPct).toBeGreaterThan(4);
    expect(result.hiddenCostPct).toBeLessThan(30);
  });
});

/**
 * The conveyancing scale, pinned.
 *
 * It had no test at all, which is why four errors in it survived — a minimum
 * an order of magnitude too low, a 2% band ending ten times too early, a floor
 * rate below anything the Order contains, and no VAT. Every one understated
 * the buyer's cost, on a tool built to warn about costs they had not budgeted
 * for.
 */
describe("conveyancing fees follow the Advocates Remuneration Order", () => {
  it("never goes below the statutory minimum", () => {
    // The Order is a floor an advocate may not charge under, however small the
    // deal. At Ksh 100,000 a percentage would be derisory; the minimum bites.
    expect(conveyancingScaleFee(100_000)).toBe(CONVEYANCING_MINIMUM_FEE);
    expect(conveyancingScaleFee(1)).toBe(CONVEYANCING_MINIMUM_FEE);
  });

  it("reproduces the published worked example at Ksh 10m", () => {
    /* Practitioners quote a minimum of Ksh 150,000-180,000 on a ten-million
     * purchase. 2% of the first 5m plus 1.5% of the next 5m is 175,000, which
     * lands inside that range — the check that confirmed this scale rather
     * than the one the code used to carry, which returned 100,000. */
    expect(conveyancingScaleFee(10_000_000)).toBe(175_000);
    const fee = conveyancingScaleFee(10_000_000);
    expect(fee).toBeGreaterThanOrEqual(150_000);
    expect(fee).toBeLessThanOrEqual(180_000);
  });

  it("adds VAT to the scale fee", () => {
    const r = calculateLandPurchase({
      plotPriceKes: 10_000_000,
      landType: "urban_residential",
      usesAgent: false,
    });
    expect(r.legalFees).toBe(Math.round(175_000 * (1 + LEGAL_FEES_VAT_RATE)));
  });

  it("rises with price and never falls", () => {
    // A cheaper property cannot cost more in scale fees than a dearer one.
    let prev = 0;
    for (const p of [100_000, 1_000_000, 5_000_000, 10_000_000, 50_000_000, 200_000_000]) {
      const fee = conveyancingScaleFee(p);
      expect(fee, `scale fell at ${p}`).toBeGreaterThanOrEqual(prev);
      prev = fee;
    }
  });

  /**
   * The regressivity is the finding, so it is asserted rather than left to be
   * rediscovered. The old flat "8–12%" headline hid it entirely.
   */
  it("costs a small buyer a far larger share than a large one", () => {
    const small = calculateLandPurchase({
      plotPriceKes: 300_000, landType: "urban_residential", usesAgent: false,
    }).hiddenCostPct;
    const large = calculateLandPurchase({
      plotPriceKes: 10_000_000, landType: "urban_residential", usesAgent: false,
    }).hiddenCostPct;
    expect(small).toBeGreaterThan(large * 2);
    expect(large).toBeGreaterThan(0);
  });
});
