import { describe, expect, it } from "vitest";
import { calculateLandPurchase } from "../land";

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
