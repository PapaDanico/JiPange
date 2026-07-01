import { describe, expect, it } from "vitest";
import {
  calculateAHL,
  calculateNetPay,
  calculateNSSF,
  calculatePAYE,
  calculateSHIF,
} from "../tax";

describe("calculateNSSF", () => {
  it("charges 6% of gross when gross is below the lower earnings limit (9,000)", () => {
    expect(calculateNSSF(5_000)).toEqual({ tier1: 300, tier2: 0, total: 300 });
  });

  it("splits tier1/tier2 for pay between the lower and upper limits", () => {
    expect(calculateNSSF(10_000)).toEqual({ tier1: 540, tier2: 60, total: 600 });
  });

  it("charges only tier1 at exactly the lower earnings limit", () => {
    expect(calculateNSSF(9_000)).toEqual({ tier1: 540, tier2: 0, total: 540 });
  });

  it("caps tier2 at KES 5,940 once gross is at or above the upper earnings limit (108,000)", () => {
    expect(calculateNSSF(108_000)).toEqual({ tier1: 540, tier2: 5_940, total: 6_480 });
    expect(calculateNSSF(500_000)).toEqual({ tier1: 540, tier2: 5_940, total: 6_480 });
  });
});

describe("calculateSHIF", () => {
  it("charges 2.75% of gross once that exceeds the KES 300 minimum", () => {
    expect(calculateSHIF(20_000)).toBe(550);
    expect(calculateSHIF(100_000)).toBe(2_750);
  });

  it("floors at the KES 300 minimum monthly contribution", () => {
    // 2.75% of 5,000 = 137.50, below the 300 minimum.
    expect(calculateSHIF(5_000)).toBe(300);
  });
});

describe("calculateAHL", () => {
  it("charges a flat 1.5% of gross with no cap or floor", () => {
    expect(calculateAHL(20_000)).toBe(300);
    expect(calculateAHL(50_000)).toBe(750);
  });
});

describe("calculatePAYE", () => {
  it("charges zero tax when relief absorbs the 10% first-band tax", () => {
    // 18,920 * 10% = 1,892 gross PAYE, fully absorbed by the 2,400 personal relief.
    expect(calculatePAYE(18_920)).toEqual({ grossPaye: 1_892, paye: 0 });
  });

  it("applies personal relief so tax due can be zero even with some gross PAYE", () => {
    const result = calculatePAYE(24_920); // spans into the 25% band by 920
    // 24,000 * 10% + 920 * 25% = 2,400 + 230 = 2,630
    expect(result.grossPaye).toBe(2_630);
    expect(result.paye).toBe(230); // 2,630 - 2,400 relief
  });
});

describe("calculateNetPay — NSSF/SHIF/AHL rates effective February 2026", () => {
  it("KES 20,000 gross — zero PAYE (relief absorbs the 10% first-band tax)", () => {
    const result = calculateNetPay(20_000);
    expect(result.nssf).toEqual({ tier1: 540, tier2: 660, total: 1_200 });
    expect(result.shif).toBe(550);
    expect(result.ahl).toBe(300);
    expect(result.taxablePay).toBe(17_950);
    expect(result.paye).toBe(0);
    expect(result.netMonthly).toBe(17_950);
  });

  it("KES 50,000 gross — cross-checked against an independently published worked example", () => {
    const result = calculateNetPay(50_000);
    expect(result.nssf.total).toBe(3_000);
    expect(result.shif).toBe(1_375);
    expect(result.ahl).toBe(750);
    expect(result.taxablePay).toBe(44_875);
    expect(result.grossPaye).toBe(8_245.85);
    expect(result.paye).toBe(5_845.85);
    expect(result.netMonthly).toBe(39_029.15);
    expect(result.employerCost).toEqual({ nssf: 3_000, ahl: 750, total: 53_750 });
  });

  it("KES 100,000 gross", () => {
    const result = calculateNetPay(100_000);
    expect(result.nssf.total).toBe(6_000);
    expect(result.shif).toBe(2_750);
    expect(result.ahl).toBe(1_500);
    expect(result.taxablePay).toBe(89_750);
    expect(result.paye).toBe(19_308.35);
    expect(result.netMonthly).toBe(70_441.65);
  });

  it("KES 200,000 gross — NSSF capped (above the upper earnings limit)", () => {
    const result = calculateNetPay(200_000);
    expect(result.nssf.total).toBe(6_480);
    expect(result.shif).toBe(5_500);
    expect(result.ahl).toBe(3_000);
    expect(result.taxablePay).toBe(185_020);
    expect(result.paye).toBe(47_889.35);
    expect(result.netMonthly).toBe(137_130.65);
  });

  it("KES 500,000 gross", () => {
    const result = calculateNetPay(500_000);
    expect(result.nssf.total).toBe(6_480);
    expect(result.shif).toBe(13_750);
    expect(result.ahl).toBe(7_500);
    expect(result.taxablePay).toBe(472_270);
    expect(result.paye).toBe(134_064.35);
    expect(result.netMonthly).toBe(338_205.65);
  });

  it("KES 1,000,000 gross — top PAYE band applies", () => {
    const result = calculateNetPay(1_000_000);
    expect(result.nssf.total).toBe(6_480);
    expect(result.shif).toBe(27_500);
    expect(result.ahl).toBe(15_000);
    expect(result.taxablePay).toBe(951_020);
    expect(result.paye).toBe(292_740.35);
    expect(result.netMonthly).toBe(658_279.65);
  });

  it("handles zero/negative gross gracefully", () => {
    expect(calculateNetPay(0).netMonthly).toBe(0);
    expect(calculateNetPay(-100).netMonthly).toBe(0);
  });
});
