import { describe, expect, it } from "vitest";
import { calculateShaHealth, MONTHLY_FLOOR, SHIF_RATE } from "../sha";

describe("calculateShaHealth", () => {
  it("computes 2.75% of gross salary", () => {
    const result = calculateShaHealth({
      employmentType: "employed",
      grossMonthlyIncome: 80_000,
      familySize: 1,
      wantsPrivateCare: false,
    });
    expect(result.monthlyContribution).toBe(Math.round(80_000 * SHIF_RATE));
    expect(result.isAtFloor).toBe(false);
  });

  it("applies floor of Ksh 300 for low-income earners", () => {
    const result = calculateShaHealth({
      employmentType: "informal",
      grossMonthlyIncome: 5_000,
      familySize: 1,
      wantsPrivateCare: false,
    });
    expect(result.monthlyContribution).toBe(MONTHLY_FLOOR);
    expect(result.isAtFloor).toBe(true);
  });

  it("annual contribution is monthly × 12", () => {
    const result = calculateShaHealth({
      employmentType: "employed",
      grossMonthlyIncome: 60_000,
      familySize: 2,
      wantsPrivateCare: false,
    });
    expect(result.annualContribution).toBe(result.monthlyContribution * 12);
  });

  it("private care flag increases top-up range", () => {
    const base = calculateShaHealth({
      employmentType: "employed",
      grossMonthlyIncome: 50_000,
      familySize: 2,
      wantsPrivateCare: false,
    });
    const withPrivate = calculateShaHealth({
      employmentType: "employed",
      grossMonthlyIncome: 50_000,
      familySize: 2,
      wantsPrivateCare: true,
    });
    expect(withPrivate.privateTopUpRange.high).toBeGreaterThan(base.privateTopUpRange.high);
  });

  it("family size affects top-up range", () => {
    const individual = calculateShaHealth({
      employmentType: "employed",
      grossMonthlyIncome: 60_000,
      familySize: 1,
      wantsPrivateCare: false,
    });
    const family = calculateShaHealth({
      employmentType: "employed",
      grossMonthlyIncome: 60_000,
      familySize: 4,
      wantsPrivateCare: false,
    });
    expect(family.privateTopUpRange.high).toBeGreaterThan(individual.privateTopUpRange.high);
  });

  it("surfaces maternity gap for couples", () => {
    const result = calculateShaHealth({
      employmentType: "employed",
      grossMonthlyIncome: 70_000,
      familySize: 2,
      wantsPrivateCare: false,
    });
    const hasMaternityGap = result.gaps.some((g) => g.toLowerCase().includes("maternit"));
    expect(hasMaternityGap).toBe(true);
  });
});
