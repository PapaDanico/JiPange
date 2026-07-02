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

/** NSSF Act 2013, Year 3 rates — effective 1 February 2025 to 31 January 2026, for year-over-year comparison. */
export const NSSF_YEAR3_LOWER_LIMIT = 8_000;
export const NSSF_YEAR3_UPPER_LIMIT = 72_000;

export interface NssfLimits {
  lowerLimit: number;
  upperLimit: number;
}

export const NSSF_CURRENT_LIMITS: NssfLimits = {
  lowerLimit: NSSF_LOWER_LIMIT,
  upperLimit: NSSF_UPPER_LIMIT,
};

export const NSSF_PRIOR_YEAR_LIMITS: NssfLimits = {
  lowerLimit: NSSF_YEAR3_LOWER_LIMIT,
  upperLimit: NSSF_YEAR3_UPPER_LIMIT,
};

/** Social Health Insurance Fund — replaced NHIF, effective October 2024. */
export const SHIF_RATE = 0.0275;
export const SHIF_MINIMUM = 300;

/** Affordable Housing Levy — Affordable Housing Act, 2024, effective 19 March 2024. No cap. */
export const AHL_RATE = 0.015;

/**
 * Optional PAYE reliefs (Income Tax Act s.15(3) and s.31, as amended by the Finance Act 2025).
 * Pension and mortgage interest reduce taxable pay before PAYE bands apply; insurance relief
 * is a tax credit subtracted from gross PAYE alongside personal relief. These reliefs assume
 * the contribution/premium/interest is paid outside payroll (or already declared to the
 * employer) — this calculator does not separately deduct the contribution itself from net pay.
 */
export const PENSION_RELIEF_CAP_MONTHLY = 30_000;
export const MORTGAGE_INTEREST_RELIEF_CAP_MONTHLY = 30_000;
export const INSURANCE_RELIEF_PREMIUM_CAP_MONTHLY = 5_000;
export const INSURANCE_RELIEF_RATE = 0.15;

export interface OptionalReliefs {
  pensionContribution?: number;
  mortgageInterest?: number;
  insurancePremium?: number;
}

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
  pensionRelief: number;
  mortgageRelief: number;
  insuranceRelief: number;
  paye: number;
  nssf: NssfBreakdown;
  shif: number;
  ahl: number;
  netMonthly: number;
  employerCost: EmployerCost;
}

export function calculateNSSF(
  grossMonthly: number,
  limits: NssfLimits = NSSF_CURRENT_LIMITS
): NssfBreakdown {
  if (grossMonthly <= 0) return { tier1: 0, tier2: 0, total: 0 };

  const tier1Base = Math.min(grossMonthly, limits.lowerLimit);
  const tier1 = round2(tier1Base * NSSF_RATE);

  const tier2Base = Math.max(0, Math.min(grossMonthly, limits.upperLimit) - limits.lowerLimit);
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

export function calculatePAYE(
  taxablePay: number,
  totalRelief: number = PERSONAL_RELIEF_MONTHLY
): PayeResult {
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
  const paye = round2(Math.max(0, roundedGrossPaye - totalRelief));
  return { grossPaye: roundedGrossPaye, paye };
}

export function calculateNetPay(
  grossMonthly: number,
  reliefs: OptionalReliefs = {},
  nssfLimits: NssfLimits = NSSF_CURRENT_LIMITS
): TaxBreakdown {
  if (grossMonthly <= 0) {
    return {
      grossMonthly: 0,
      taxablePay: 0,
      grossPaye: 0,
      personalRelief: PERSONAL_RELIEF_MONTHLY,
      pensionRelief: 0,
      mortgageRelief: 0,
      insuranceRelief: 0,
      paye: 0,
      nssf: { tier1: 0, tier2: 0, total: 0 },
      shif: 0,
      ahl: 0,
      netMonthly: 0,
      employerCost: { nssf: 0, ahl: 0, total: 0 },
    };
  }

  const nssf = calculateNSSF(grossMonthly, nssfLimits);
  const shif = calculateSHIF(grossMonthly);
  const ahl = calculateAHL(grossMonthly);

  const pensionRelief = Math.min(
    Math.max(0, reliefs.pensionContribution ?? 0),
    PENSION_RELIEF_CAP_MONTHLY
  );
  const mortgageRelief = Math.min(
    Math.max(0, reliefs.mortgageInterest ?? 0),
    MORTGAGE_INTEREST_RELIEF_CAP_MONTHLY
  );
  const insuranceRelief = round2(
    Math.min(Math.max(0, reliefs.insurancePremium ?? 0), INSURANCE_RELIEF_PREMIUM_CAP_MONTHLY) *
      INSURANCE_RELIEF_RATE
  );

  const taxablePay = Math.max(
    0,
    round2(grossMonthly - nssf.total - shif - ahl - pensionRelief - mortgageRelief)
  );
  const totalRelief = PERSONAL_RELIEF_MONTHLY + insuranceRelief;
  const { grossPaye, paye } = calculatePAYE(taxablePay, totalRelief);
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
    pensionRelief,
    mortgageRelief,
    insuranceRelief,
    paye,
    nssf,
    shif,
    ahl,
    netMonthly,
    employerCost,
  };
}
