import { describe, expect, it } from "vitest";
import { calculateNetPay, calculateNSSF } from "../tax";

/**
 * An independent re-computation of monthly payroll, written from the published
 * parameters and sharing no code with `lib/tax.ts`, so a slip in the engine's
 * constants or its band loop shows up as a disagreement rather than agreeing
 * with itself.
 *
 * Parameters and where they come from (verification status stated honestly):
 *  - PAYE bands and the KES 2,400 monthly personal relief: KRA PAYE page.
 *  - NSSF Year 4 (effective Feb 2026): lower limit 9,000, upper limit 108,000,
 *    6% each side, so at or above 108,000 the employee pays 6,480 (Tier 1 540,
 *    Tier 2 5,940), the employer pays the same and the combined maximum is
 *    12,960. Source: the NSSF Year 4 employer notice (mygov.go.ke, Feb 2026).
 *  - Affordable Housing Levy 1.5% employee and 1.5% employer: KRA public notice.
 *  - SHIF 2.75% of gross with a KES 300 minimum.
 * These were read from the 15 Nov 2026 audit handover that cites those
 * documents; the primary PDFs could not be fetched from this environment, so
 * this pins the engine to the published figures and does not replace reading
 * the notices. SHIF and the housing levy being deducted before PAYE follows the
 * engine's own documented reading of the Tax Laws (Amendment) Act 2024.
 */
const BANDS: [number, number][] = [
  [24_000, 0.1],
  [8_333, 0.25],
  [467_667, 0.3],
  [300_000, 0.325],
  [Infinity, 0.35],
];

function payeOn(taxable: number): number {
  let left = Math.max(0, taxable);
  let tax = 0;
  for (const [width, rate] of BANDS) {
    const slice = Math.min(left, width);
    tax += slice * rate;
    left -= slice;
    if (left <= 0) break;
  }
  return tax;
}

function expected(gross: number) {
  if (gross <= 0) return { nssf: 0, shif: 0, ahl: 0, paye: 0, net: 0, employerNssf: 0, employerAhl: 0 };
  const nssf = 0.06 * Math.min(gross, 108_000);
  const shif = Math.max(300, 0.0275 * gross);
  const ahl = 0.015 * gross;
  const taxable = gross - nssf - shif - ahl;
  const paye = Math.max(0, payeOn(taxable) - 2_400);
  return { nssf, shif, ahl, paye, net: gross - nssf - shif - ahl - paye, employerNssf: nssf, employerAhl: ahl };
}

const GROSS = [
  0, 8_999, 9_000, 9_001, 24_000, 32_333, 50_000, 107_999, 108_000, 108_001, 150_000, 250_000, 500_000, 800_000, 1_000_000,
];
const CENT = 0.011; // the engine rounds each component to the cent

describe("payroll against an independent computation (15 boundary and typical gross values)", () => {
  it.each(GROSS)("gross %i: every component matches", (g) => {
    const e = expected(g);
    const r = calculateNetPay(g);
    expect(Math.abs(r.nssf.total - e.nssf)).toBeLessThan(CENT);
    expect(Math.abs(r.shif - e.shif)).toBeLessThan(CENT);
    expect(Math.abs(r.ahl - e.ahl)).toBeLessThan(CENT);
    // PAYE is rounded once on the gross figure and once after relief.
    expect(Math.abs(r.paye - e.paye)).toBeLessThan(0.02);
    expect(Math.abs(r.netMonthly - e.net)).toBeLessThan(0.05);
  });

  it.each(GROSS)("gross %i: the employer side is separate and never reduces take-home", (g) => {
    const e = expected(g);
    const r = calculateNetPay(g);
    expect(Math.abs(r.employerCost.nssf - e.employerNssf)).toBeLessThan(CENT);
    expect(Math.abs(r.employerCost.ahl - e.employerAhl)).toBeLessThan(CENT);
    // The employer's total cost is the salary plus its own contributions.
    expect(r.employerCost.total).toBeCloseTo(g + r.employerCost.nssf + r.employerCost.ahl, 2);
    // Take-home is gross less the EMPLOYEE deductions only.
    expect(Math.abs(r.netMonthly - (g - r.nssf.total - r.shif - r.ahl - r.paye))).toBeLessThan(0.05);
  });
});

describe("NSSF Year 4 boundaries, employee and employer independently", () => {
  const cases: [number, number, number][] = [
    // gross, tier 1, tier 2
    [0, 0, 0],
    [8_999, 539.94, 0],
    [9_000, 540, 0],
    [9_001, 540, 0.06],
    [107_999, 540, 5_939.94],
    [108_000, 540, 5_940],
    [108_001, 540, 5_940],
    [250_000, 540, 5_940],
  ];
  it.each(cases)("gross %i: tier 1 %f, tier 2 %f", (g, t1, t2) => {
    const n = calculateNSSF(g);
    expect(n.tier1).toBeCloseTo(t1, 2);
    expect(n.tier2).toBeCloseTo(t2, 2);
    expect(n.total).toBeCloseTo(t1 + t2, 2);
  });

  it("at or above the upper limit: employee 6,480, employer 6,480, combined 12,960", () => {
    const r = calculateNetPay(250_000);
    expect(r.nssf.total).toBe(6_480);
    expect(r.employerCost.nssf).toBe(6_480);
    expect(r.nssf.total + r.employerCost.nssf).toBe(12_960);
  });
});

describe("the personal relief is a credit, not a deduction", () => {
  it("never takes PAYE below zero and applies 2,400 once", () => {
    expect(calculateNetPay(20_000).paye).toBe(0);
    const r = calculateNetPay(150_000);
    expect(r.personalRelief).toBe(2_400);
    expect(r.grossPaye - r.paye).toBeCloseTo(2_400, 2);
  });
});
