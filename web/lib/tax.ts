/**
 * Kenya PAYE / NSSF / SHIF / Housing Levy tax engine — rates effective February 2026.
 * Pure functions, no side effects.
 *
 * Deduction order (NSSF, SHIF, and AHL are all pre-tax): gross → NSSF → SHIF → AHL →
 * taxable pay → PAYE bands → personal relief → net pay. Verified against an
 * independently-published worked example for a KES 50,000 gross salary (taxable pay
 * KES 44,875; PAYE after relief KES 5,846) — see payecalculator.co.ke's PAYE guide.
 *
 * The old 15% SHIF relief and 15% AHL relief were BOTH repealed by the Tax Laws
 * (Amendment) Act, 2024, effective December 2024. Do not reintroduce them — the
 * only remaining relief is the flat personal relief below.
 */

import { round2 } from "./money";

export interface PayeBand {
  upTo: number;
  rate: number;
}

/** 10% to 24,000; 25% to 32,333; 30% to 500,000; 32.5% to 800,000; 35% above. Unchanged for 2025/26. */
export const PAYE_BANDS: readonly PayeBand[] = [
  { upTo: 24_000, rate: 0.1 },
  { upTo: 32_333, rate: 0.25 },
  { upTo: 500_000, rate: 0.3 },
  { upTo: 800_000, rate: 0.325 },
  { upTo: Infinity, rate: 0.35 },
];

export const PERSONAL_RELIEF_MONTHLY = 2_400;

/** NSSF Act 2013, Year 4 rates — effective 1 February 2026. */
export const NSSF_LOWER_LIMIT = 9_000;
export const NSSF_UPPER_LIMIT = 108_000;
export const NSSF_RATE = 0.06;
/** Max employee NSSF Tier 2 contribution: (108,000 − 9,000) × 6% = 5,940. */
export const NSSF_TIER2_MAX = (NSSF_UPPER_LIMIT - NSSF_LOWER_LIMIT) * NSSF_RATE;

/** Social Health Insurance Fund — replaced NHIF, effective October 2024. */
export const SHIF_RATE = 0.0275;
export const SHIF_MINIMUM = 300;

/** Affordable Housing Levy — Affordable Housing Act, 2024, effective 19 March 2024. No cap. */
export const AHL_RATE = 0.015;

export interface NssfBreakdown {
  tier1: number;
  tier2: number;
  total: number;
}

export interface PayeResult {
  /** PAYE before personal relief is deducted. */
  grossPaye: number;
  /** PAYE payable after personal relief. */
  paye: number;
}

export interface EmployerCost {
  nssf: number;
  ahl: number;
  total: number;
}

export interface TaxBreakdown {
  grossMonthly: number;
  taxablePay: number;
  grossPaye: number;
  personalRelief: number;
  paye: number;
  nssf: NssfBreakdown;
  shif: number;
  ahl: number;
  netMonthly: number;
  employerCost: EmployerCost;
}

export function calculateNSSF(grossMonthly: number): NssfBreakdown {
  if (grossMonthly <= 0) return { tier1: 0, tier2: 0, total: 0 };

  const tier1Base = Math.min(grossMonthly, NSSF_LOWER_LIMIT);
  const tier1 = round2(tier1Base * NSSF_RATE);

  const tier2Base = Math.max(0, Math.min(grossMonthly, NSSF_UPPER_LIMIT) - NSSF_LOWER_LIMIT);
  const tier2 = round2(tier2Base * NSSF_RATE);

  return { tier1, tier2, total: round2(tier1 + tier2) };
}

export function calculateSHIF(grossMonthly: number): number {
  if (grossMonthly <= 0) return 0;
  return round2(Math.max(SHIF_MINIMUM, grossMonthly * SHIF_RATE));
}

export function calculateAHL(grossMonthly: number): number {
  if (grossMonthly <= 0) return 0;
  return round2(grossMonthly * AHL_RATE);
}

export function calculatePAYE(taxablePay: number): PayeResult {
  if (taxablePay <= 0) return { grossPaye: 0, paye: 0 };

  let remaining = taxablePay;
  let lowerBound = 0;
  let grossPaye = 0;

  for (const band of PAYE_BANDS) {
    if (remaining <= 0) break;
    const bandWidth = band.upTo - lowerBound;
    const taxableInBand = Math.min(remaining, bandWidth);
    grossPaye += taxableInBand * band.rate;
    remaining -= taxableInBand;
    lowerBound = band.upTo;
  }

  const roundedGrossPaye = round2(grossPaye);
  const paye = round2(Math.max(0, roundedGrossPaye - PERSONAL_RELIEF_MONTHLY));
  return { grossPaye: roundedGrossPaye, paye };
}

export function calculateNetPay(grossMonthly: number): TaxBreakdown {
  if (grossMonthly <= 0) {
    return {
      grossMonthly: 0,
      taxablePay: 0,
      grossPaye: 0,
      personalRelief: PERSONAL_RELIEF_MONTHLY,
      paye: 0,
      nssf: { tier1: 0, tier2: 0, total: 0 },
      shif: 0,
      ahl: 0,
      netMonthly: 0,
      employerCost: { nssf: 0, ahl: 0, total: 0 },
    };
  }

  const nssf = calculateNSSF(grossMonthly);
  const shif = calculateSHIF(grossMonthly);
  const ahl = calculateAHL(grossMonthly);
  const taxablePay = Math.max(0, round2(grossMonthly - nssf.total - shif - ahl));
  const { grossPaye, paye } = calculatePAYE(taxablePay);
  const netMonthly = round2(grossMonthly - paye - nssf.total - shif - ahl);

  // Employer matches the employee's NSSF contribution and pays its own 1.5% AHL
  // share on top of gross — SHIF has no employer-matched component.
  const employerNssf = nssf.total;
  const employerAhl = ahl;
  const employerCost: EmployerCost = {
    nssf: employerNssf,
    ahl: employerAhl,
    total: round2(grossMonthly + employerNssf + employerAhl),
  };

  return {
    grossMonthly,
    taxablePay,
    grossPaye,
    personalRelief: PERSONAL_RELIEF_MONTHLY,
    paye,
    nssf,
    shif,
    ahl,
    netMonthly,
    employerCost,
  };
}
