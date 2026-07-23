import {
  INSURANCE_RELIEF_PREMIUM_CAP_MONTHLY,
  INSURANCE_RELIEF_RATE,
  MORTGAGE_INTEREST_RELIEF_CAP_MONTHLY,
  PAYE_BANDS,
  PENSION_RELIEF_CAP_MONTHLY,
  calculateNetPay,
} from "./tax";

/**
 * The KRA tax shield: unused statutory-relief headroom is monthly PAYE the
 * user is paying that they could legally redirect into their own pension,
 * mortgage or insurance lines instead.
 *
 * These caps mirror lib/tax.ts's own relief constants exactly (same Income
 * Tax Act provisions) — re-exported under this module's naming so a future
 * Finance Act change only needs updating in one place.
 */

export const MAX_MONTHLY_PENSION_EXEMPTION = PENSION_RELIEF_CAP_MONTHLY;
export const MAX_MONTHLY_MORTGAGE_EXEMPTION = MORTGAGE_INTEREST_RELIEF_CAP_MONTHLY;
export const MAX_ANNUAL_INSURANCE_RELIEF = INSURANCE_RELIEF_PREMIUM_CAP_MONTHLY * 12;
/** 60k/yr cap at 15% ⇒ at most 5k/mo of premiums earn relief. */
export const MAX_MONTHLY_INSURANCE_PREMIUM_RELIEVABLE = INSURANCE_RELIEF_PREMIUM_CAP_MONTHLY;
export { INSURANCE_RELIEF_RATE };

/**
 * Marginal PAYE band rate for the user's *taxable* pay (gross less NSSF and
 * current reliefs' deductible lines) — computed from the real tax engine so
 * the band is the one their last shilling actually lands in. `reliefs`
 * should be the contributions the user is *already* making — the next
 * shilling of headroom stacks on top of taxable pay computed after those,
 * not on top of gross, or the reported band (and therefore the reported
 * savings) can be wrong right at a band boundary.
 */
export function marginalPayeRate(
  grossMonthly: number,
  reliefs: { pensionContribution?: number; mortgageInterest?: number } = {}
): number {
  if (grossMonthly <= 0) return 0;
  const { taxablePay } = calculateNetPay(grossMonthly, reliefs);
  for (const band of PAYE_BANDS) {
    if (taxablePay <= band.upTo) return band.rate;
  }
  return PAYE_BANDS[PAYE_BANDS.length - 1].rate;
}

export interface TaxShield {
  marginalRate: number;
  pensionHeadroom: number;
  mortgageHeadroom: number;
  pensionTaxSavings: number;
  mortgageTaxSavings: number;
  insuranceReliefClaimable: number;
  totalMonthlyRecoverable: number;
}

export function taxShield(params: {
  grossMonthly: number;
  pensionContribution: number;
  mortgageInterestMonthly: number;
  insurancePremiumMonthly: number;
}): TaxShield {
  const marginalRate = marginalPayeRate(params.grossMonthly, {
    pensionContribution: params.pensionContribution,
    mortgageInterest: params.mortgageInterestMonthly,
  });
  const pensionHeadroom = Math.max(
    0,
    MAX_MONTHLY_PENSION_EXEMPTION - Math.max(0, params.pensionContribution)
  );
  const mortgageHeadroom = Math.max(
    0,
    MAX_MONTHLY_MORTGAGE_EXEMPTION - Math.max(0, params.mortgageInterestMonthly)
  );
  const pensionTaxSavings = pensionHeadroom * marginalRate;
  const mortgageTaxSavings = mortgageHeadroom * marginalRate;
  const insuranceReliefClaimable =
    Math.min(MAX_MONTHLY_INSURANCE_PREMIUM_RELIEVABLE, Math.max(0, params.insurancePremiumMonthly)) *
    INSURANCE_RELIEF_RATE;
  return {
    marginalRate,
    pensionHeadroom,
    mortgageHeadroom,
    pensionTaxSavings,
    mortgageTaxSavings,
    insuranceReliefClaimable,
    totalMonthlyRecoverable: pensionTaxSavings + mortgageTaxSavings + insuranceReliefClaimable,
  };
}
