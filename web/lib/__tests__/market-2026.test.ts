import { describe, expect, it } from "vitest";
import {
  KENYAN_INFLATION,
  dhowcsdLadder,
  localizedFire,
  mjengoPlan,
} from "../market-2026";
import { maxSafeMonthlyDraw, nextCycleRunway } from "../hustle";
import {
  MAX_MONTHLY_PENSION_EXEMPTION,
  marginalPayeRate,
  taxShield,
} from "../tax-shield";

describe("localizedFire (5% SWR, 6.4% inflation)", () => {
  const fire = localizedFire({
    currentMonthlyExpenses: 80_000,
    currentAge: 30,
    targetRetirementAge: 50,
  });

  it("uses the 20x multiplier for today's money", () => {
    expect(fire.currentAnnualExpenses).toBe(960_000);
    expect(fire.todaysMoneyFireNumber).toBe(19_200_000);
  });

  it("inflates expenses to the retirement year before applying 20x", () => {
    const expected = 960_000 * Math.pow(1 + KENYAN_INFLATION, 20);
    expect(fire.futureAnnualExpenses).toBeCloseTo(expected, 4);
    expect(fire.nominalFutureFireNumber).toBeCloseTo(expected * 20, 2);
  });

  it("clamps a past retirement age to zero years", () => {
    const late = localizedFire({
      currentMonthlyExpenses: 50_000,
      currentAge: 65,
      targetRetirementAge: 60,
    });
    expect(late.yearsToRetirement).toBe(0);
    expect(late.nominalFutureFireNumber).toBe(late.todaysMoneyFireNumber);
  });
});

describe("mjengoPlan (3x Sacco multiplier)", () => {
  it("requires a third of the property value as deposits", () => {
    const plan = mjengoPlan({ targetPropertyValue: 3_000_000, monthlyContribution: 30_000 });
    expect(plan.requiredDeposits).toBe(1_000_000);
    expect(plan.developmentLoan).toBe(3_000_000);
    // At 11.5% compounding, 30k/mo reaches 1M in well under 33 flat months.
    expect(plan.monthsToTarget).not.toBeNull();
    expect(plan.monthsToTarget!).toBeLessThan(34);
    expect(plan.monthsToTarget!).toBeGreaterThan(24);
  });

  it("returns null months when nothing is contributed", () => {
    expect(
      mjengoPlan({ targetPropertyValue: 3_000_000, monthlyContribution: 0 }).monthsToTarget
    ).toBeNull();
  });
});

describe("dhowcsdLadder", () => {
  const ladder = dhowcsdLadder(300_000);

  it("splits capital evenly across the three tenors", () => {
    expect(ladder.buckets).toHaveLength(3);
    for (const bucket of ladder.buckets) expect(bucket.allocation).toBeCloseTo(100_000, 6);
  });

  it("computes the blended yield and the bank advantage", () => {
    expect(ladder.blendedYield).toBeCloseTo((0.0883 + 0.0896 + 0.0899) / 3, 10);
    expect(ladder.ladderAnnualKes).toBeCloseTo(300_000 * ladder.blendedYield, 6);
    expect(ladder.advantageKes).toBeCloseTo(ladder.ladderAnnualKes - 300_000 * 0.0323, 6);
    expect(ladder.advantageKes).toBeGreaterThan(0);
  });
});

describe("hustle smoothing", () => {
  it("spreads net cycle profit across the cycle's months", () => {
    // 90-day cycle: (300k − 120k) / 3 months = 60k/mo
    expect(
      maxSafeMonthlyDraw({
        targetLumpSumPayout: 300_000,
        inputCostsPerCycle: 120_000,
        cycleLengthDays: 90,
      })
    ).toBeCloseTo(60_000, 6);
  });

  it("never goes negative when a cycle loses money", () => {
    expect(
      maxSafeMonthlyDraw({
        targetLumpSumPayout: 100_000,
        inputCostsPerCycle: 150_000,
        cycleLengthDays: 90,
      })
    ).toBe(0);
  });

  it("flags the runway gap with the exact shortfall", () => {
    expect(nextCycleRunway({ activeSavings: 50_000, inputCostsPerCycle: 120_000 })).toEqual({
      protected: false,
      shortfall: 70_000,
    });
    expect(nextCycleRunway({ activeSavings: 150_000, inputCostsPerCycle: 120_000 })).toEqual({
      protected: true,
      shortfall: 0,
    });
  });
});

describe("taxShield", () => {
  it("identifies the marginal band from real taxable pay", () => {
    // 100k gross lands in the 30% band; 600k+ gross reaches 32.5%.
    expect(marginalPayeRate(100_000)).toBe(0.3);
    expect(marginalPayeRate(600_000)).toBe(0.325);
    expect(marginalPayeRate(900_000)).toBe(0.35);
    expect(marginalPayeRate(20_000)).toBeLessThanOrEqual(0.25);
  });

  it("computes headroom, clamped at the statutory caps", () => {
    const shield = taxShield({
      grossMonthly: 150_000,
      pensionContribution: 10_000,
      mortgageInterestMonthly: 0,
      insurancePremiumMonthly: 8_000,
    });
    expect(shield.pensionHeadroom).toBe(20_000);
    expect(shield.mortgageHeadroom).toBe(30_000);
    expect(shield.pensionTaxSavings).toBeCloseTo(20_000 * 0.3, 6);
    expect(shield.mortgageTaxSavings).toBeCloseTo(30_000 * 0.3, 6);
    // Insurance relief capped at 5k/mo of premiums × 15%
    expect(shield.insuranceReliefClaimable).toBeCloseTo(750, 6);
    expect(shield.totalMonthlyRecoverable).toBeCloseTo(6_000 + 9_000 + 750, 6);
  });

  it("shows zero headroom for already-maximised contributors", () => {
    const shield = taxShield({
      grossMonthly: 200_000,
      pensionContribution: MAX_MONTHLY_PENSION_EXEMPTION,
      mortgageInterestMonthly: 30_000,
      insurancePremiumMonthly: 0,
    });
    expect(shield.pensionHeadroom).toBe(0);
    expect(shield.mortgageHeadroom).toBe(0);
    expect(shield.totalMonthlyRecoverable).toBe(0);
  });

  it("prices headroom at the band the user's existing reliefs land them in, not raw gross", () => {
    // Gross 850k taxed on raw gross alone lands just over 800k (35% band).
    // But this earner already contributes 20k/mo to pension, which is
    // deductible before PAYE bands apply — their real taxable pay is
    // 787,395, still inside the 32.5% band. Pricing the remaining pension
    // headroom at 35% instead of 32.5% overstates the tax saving on the
    // next shilling of contribution.
    const shield = taxShield({
      grossMonthly: 850_000,
      pensionContribution: 20_000,
      mortgageInterestMonthly: 0,
      insurancePremiumMonthly: 0,
    });
    expect(shield.marginalRate).toBe(0.325);
    expect(shield.pensionHeadroom).toBe(10_000);
    expect(shield.pensionTaxSavings).toBeCloseTo(10_000 * 0.325, 6);
  });
});
