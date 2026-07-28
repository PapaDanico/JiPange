import { describe, it, expect } from "vitest";
import {
  taxShield,
  marginalPayeRate,
  MAX_MONTHLY_PENSION_EXEMPTION,
  MAX_MONTHLY_MORTGAGE_EXEMPTION,
  MAX_MONTHLY_INSURANCE_PREMIUM_RELIEVABLE,
  INSURANCE_RELIEF_RATE,
} from "../tax-shield";

/**
 * The tax shield had no test at all.
 *
 * It computes what a reader is told they can legally claw back from KRA, and
 * nothing pinned any of it. Checking it by hand found no defect — the caps
 * clamp, negatives clamp, the marginal band is right at every boundary — which
 * is worth stating plainly rather than quietly fixing nothing: the module is
 * correct, it was simply undefended.
 *
 * That is the pattern across this whole audit. The untested MODULES have held
 * up; what kept failing was the published figures sitting above them, which no
 * test could see. Code with no test was fine. Prose with no test was wrong four
 * times out of four.
 */
describe("tax shield", () => {
  it("finds the marginal band at each threshold", () => {
    // Kenya's bands: 10 / 25 / 30 / 32.5 / 35. The upper two exist and were
    // forgotten once already in this codebase's history.
    expect(marginalPayeRate(50_000)).toBeCloseTo(0.3, 6);
    expect(marginalPayeRate(150_000)).toBeCloseTo(0.3, 6);
    expect(marginalPayeRate(600_000)).toBeCloseTo(0.325, 6);
    expect(marginalPayeRate(900_000)).toBeCloseTo(0.35, 6);
  });

  it("values untouched headroom at the marginal rate", () => {
    const s = taxShield({
      grossMonthly: 150_000,
      pensionContribution: 0,
      mortgageInterestMonthly: 0,
      insurancePremiumMonthly: 0,
    });
    expect(s.pensionHeadroom).toBe(MAX_MONTHLY_PENSION_EXEMPTION);
    expect(s.mortgageHeadroom).toBe(MAX_MONTHLY_MORTGAGE_EXEMPTION);
    expect(s.pensionTaxSavings).toBeCloseTo(MAX_MONTHLY_PENSION_EXEMPTION * 0.3, 6);
    expect(s.totalMonthlyRecoverable).toBeCloseTo(
      s.pensionTaxSavings + s.mortgageTaxSavings + s.insuranceReliefClaimable,
      6
    );
  });

  it("offers nothing more once the reliefs are maxed", () => {
    const s = taxShield({
      grossMonthly: 150_000,
      pensionContribution: MAX_MONTHLY_PENSION_EXEMPTION,
      mortgageInterestMonthly: MAX_MONTHLY_MORTGAGE_EXEMPTION,
      insurancePremiumMonthly: MAX_MONTHLY_INSURANCE_PREMIUM_RELIEVABLE,
    });
    expect(s.pensionHeadroom).toBe(0);
    expect(s.mortgageHeadroom).toBe(0);
    // Insurance is a relief on the premium, not headroom — it stays claimable.
    expect(s.insuranceReliefClaimable).toBeCloseTo(
      MAX_MONTHLY_INSURANCE_PREMIUM_RELIEVABLE * INSURANCE_RELIEF_RATE,
      6
    );
  });

  it("refuses to invent headroom from absurd inputs", () => {
    /* Both directions. Over-supplying must not produce negative headroom that
     * shows as a negative "recoverable"; under-supplying with a negative number
     * must not inflate it. A calculator that tells someone they can reclaim a
     * negative amount of tax has stopped meaning anything. */
    for (const v of [99_999_999, -50_000]) {
      const s = taxShield({
        grossMonthly: 150_000,
        pensionContribution: v,
        mortgageInterestMonthly: v,
        insurancePremiumMonthly: v,
      });
      expect(s.pensionHeadroom).toBeGreaterThanOrEqual(0);
      expect(s.mortgageHeadroom).toBeGreaterThanOrEqual(0);
      expect(s.insuranceReliefClaimable).toBeGreaterThanOrEqual(0);
      expect(s.totalMonthlyRecoverable).toBeGreaterThanOrEqual(0);
      expect(s.pensionHeadroom).toBeLessThanOrEqual(MAX_MONTHLY_PENSION_EXEMPTION);
    }
  });

  it("never promises back more than the marginal rate could take", () => {
    // The saving is tax forgone. It cannot exceed the rate times the amount.
    const s = taxShield({
      grossMonthly: 150_000,
      pensionContribution: 10_000,
      mortgageInterestMonthly: 10_000,
      insurancePremiumMonthly: 2_000,
    });
    expect(s.pensionTaxSavings).toBeLessThanOrEqual(s.pensionHeadroom);
    expect(s.mortgageTaxSavings).toBeLessThanOrEqual(s.mortgageHeadroom);
    expect(s.insuranceReliefClaimable).toBeLessThanOrEqual(2_000);
  });
});
