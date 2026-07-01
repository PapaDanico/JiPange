import { describe, expect, it } from "vitest";
import { calculateFulizaCost } from "../fuliza";

describe("calculateFulizaCost", () => {
  it("computes daily fee, total fee, and total repaid for a 7-day borrow", () => {
    const result = calculateFulizaCost(10_000, 7);
    expect(result.dailyFee).toBe(108.3); // 10,000 * 1.083%
    expect(result.totalFee).toBeCloseTo(758.1, 1); // 108.3 * 7
    expect(result.totalRepaid).toBeCloseTo(10_758.1, 1);
  });

  it("scales fees linearly with days borrowed", () => {
    const sevenDays = calculateFulizaCost(10_000, 7);
    const fourteenDays = calculateFulizaCost(10_000, 14);
    expect(fourteenDays.totalFee).toBeCloseTo(sevenDays.totalFee * 2, 1);
  });

  it("includes a same-amount SACCO comparison that is far cheaper", () => {
    const result = calculateFulizaCost(10_000, 30);
    expect(result.saccoComparisonTotalRepaid).toBeGreaterThan(10_000);
    expect(result.saccoComparisonTotalRepaid).toBeLessThan(result.totalRepaid);
  });

  it("handles zero/negative inputs gracefully", () => {
    expect(calculateFulizaCost(0, 7).totalFee).toBe(0);
    expect(calculateFulizaCost(10_000, 0).totalFee).toBe(0);
    expect(calculateFulizaCost(-100, 7).totalFee).toBe(0);
  });
});
