/**
 * Kenya PAYE / NSSF / SHIF tax engine — KRA 2025/26 rates.
 * Pure functions, no side effects. Cross-checked against the KRA ITAX
 * PAYE calculator (itax.kra.go.ke).
 *
 * NSSF and SHIF are statutory deductions applied to gross pay before
 * PAYE is computed (Finance Act — NSSF contributions are pre-tax;
 * SHIF here matches the JiPange spec of a flat 2.75% of gross with no
 * cap and no floor).
 */

export interface PayeBand {
  upTo: number;
  rate: number;
}

/** 10% to 24,000; 25% to 32,333; 30% to 500,000; 32.5% to 800,000; 35% above. */
export const PAYE_BANDS: readonly PayeBand[] = [
  { upTo: 24_000, rate: 0.1 },
  { upTo: 32_333, rate: 0.25 },
  { upTo: 500_000, rate: 0.3 },
  { upTo: 800_000, rate: 0.325 },
  { upTo: Infinity, rate: 0.35 },
];

export const PERSONAL_RELIEF_MONTHLY = 2_400;

export const NSSF_LOWER_LIMIT = 6_000;
export const NSSF_UPPER_LIMIT = 18_000;
export const NSSF_RATE = 0.06;
/** Max employee NSSF Tier 2 contribution: (18,000 − 6,000) × 6% = 720. */
export const NSSF_TIER2_MAX = (NSSF_UPPER_LIMIT - NSSF_LOWER_LIMIT) * NSSF_RATE;

export const SHIF_RATE = 0.0275;

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

export interface TaxBreakdown {
  grossMonthly: number;
  taxablePay: number;
  grossPaye: number;
  personalRelief: number;
  paye: number;
  nssf: NssfBreakdown;
  shif: number;
  netMonthly: number;
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
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
  return round2(grossMonthly * SHIF_RATE);
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
      netMonthly: 0,
    };
  }

  const nssf = calculateNSSF(grossMonthly);
  const shif = calculateSHIF(grossMonthly);
  const taxablePay = Math.max(0, round2(grossMonthly - nssf.total));
  const { grossPaye, paye } = calculatePAYE(taxablePay);
  const netMonthly = round2(grossMonthly - paye - nssf.total - shif);

  return {
    grossMonthly,
    taxablePay,
    grossPaye,
    personalRelief: PERSONAL_RELIEF_MONTHLY,
    paye,
    nssf,
    shif,
    netMonthly,
  };
}
