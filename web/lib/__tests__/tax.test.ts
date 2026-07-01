import { describe, expect, it } from "vitest";
import {
  calculateNetPay,
  calculateNSSF,
  calculatePAYE,
  calculateSHIF,
} from "../tax";

describe("calculateNSSF", () => {
  it("charges 6% of gross when gross is below the lower earnings limit", () => {
    expect(calculateNSSF(5_000)).toEqual({ tier1: 300, tier2: 0, total: 300 });
  });

  it("splits tier1/tier2 for pay between the lower and upper limits", () => {
    expect(calculateNSSF(10_000)).toEqual({ tier1: 360, tier2: 240, total: 600 });
  });

  it("caps tier2 at KES 720 once gross is at or above the upper earnings limit", () => {
    expect(calculateNSSF(18_000)).toEqual({ tier1: 360, tier2: 720, total: 1_080 });
    expect(calculateNSSF(500_000)).toEqual({ tier1: 360, tier2: 720, total: 1_080 });
  });
});

describe("calculateSHIF", () => {
  it("charges a flat 2.75% of gross with no cap or floor", () => {
    expect(calculateSHIF(20_000)).toBe(550);
    expect(calculateSHIF(100_000)).toBe(2_750);
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

describe("calculateNetPay — cross-checked against KRA ITAX bands", () => {
  it("KES 20,000 gross — zero PAYE (relief absorbs the 10% first-band tax)", () => {
    const result = calculateNetPay(20_000);
    expect(result.nssf).toEqual({ tier1: 360, tier2: 720, total: 1_080 });
    expect(result.shif).toBe(550);
    expect(result.paye).toBe(0);
    expect(result.netMonthly).toBe(18_370);
  });

  it("KES 50,000 gross", () => {
    const result = calculateNetPay(50_000);
    expect(result.nssf.total).toBe(1_080);
    expect(result.shif).toBe(1_375);
    expect(result.paye).toBe(7_059.35);
    expect(result.netMonthly).toBe(40_485.65);
  });

  it("KES 100,000 gross", () => {
    const result = calculateNetPay(100_000);
    expect(result.nssf.total).toBe(1_080);
    expect(result.shif).toBe(2_750);
    expect(result.paye).toBe(22_059.35);
    expect(result.netMonthly).toBe(74_110.65);
  });

  it("KES 200,000 gross", () => {
    const result = calculateNetPay(200_000);
    expect(result.nssf.total).toBe(1_080);
    expect(result.shif).toBe(5_500);
    expect(result.paye).toBe(52_059.35);
    expect(result.netMonthly).toBe(141_360.65);
  });

  it("KES 500,000 gross", () => {
    const result = calculateNetPay(500_000);
    expect(result.nssf.total).toBe(1_080);
    expect(result.shif).toBe(13_750);
    expect(result.paye).toBe(142_059.35);
    expect(result.netMonthly).toBe(343_110.65);
  });

  it("KES 1,000,000 gross — top band applies", () => {
    const result = calculateNetPay(1_000_000);
    expect(result.nssf.total).toBe(1_080);
    expect(result.shif).toBe(27_500);
    expect(result.paye).toBe(309_505.35);
    expect(result.netMonthly).toBe(661_914.65);
  });

  it("handles zero/negative gross gracefully", () => {
    expect(calculateNetPay(0).netMonthly).toBe(0);
    expect(calculateNetPay(-100).netMonthly).toBe(0);
  });
});
