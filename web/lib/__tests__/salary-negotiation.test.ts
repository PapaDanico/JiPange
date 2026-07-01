import { describe, expect, it } from "vitest";
import { solveGrossForTargetNet } from "../salary-negotiation";
import { calculateNetPay } from "../tax";

describe("solveGrossForTargetNet", () => {
  it("round-trips against calculateNetPay for a range of targets", () => {
    for (const target of [17_950, 39_029.15, 70_441.65, 137_130.65, 338_205.65]) {
      const gross = solveGrossForTargetNet(target);
      const netAtGross = calculateNetPay(gross).netMonthly;
      expect(netAtGross).toBeCloseTo(target, 0);
    }
  });

  it("returns a gross that is always greater than or equal to the target net", () => {
    const gross = solveGrossForTargetNet(50_000);
    expect(gross).toBeGreaterThanOrEqual(50_000);
  });

  it("handles zero and negative targets gracefully", () => {
    expect(solveGrossForTargetNet(0)).toBe(0);
    expect(solveGrossForTargetNet(-100)).toBe(0);
  });

  it("solves correctly for a very high target net (top PAYE band)", () => {
    const target = 500_000;
    const gross = solveGrossForTargetNet(target);
    const netAtGross = calculateNetPay(gross).netMonthly;
    expect(netAtGross).toBeCloseTo(target, 0);
  });
});
