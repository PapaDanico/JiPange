import { describe, expect, it } from "vitest";
import { checkOneThirdRule } from "../one-third-rule";

describe("checkOneThirdRule", () => {
  it("is compliant when deductions leave more than a third of basic salary", () => {
    const result = checkOneThirdRule({
      basicSalary: 30_000,
      saccoDeductions: 5_000,
      loanDeductions: 5_000,
    });
    expect(result.statutoryDeductions).toBeCloseTo(3_806.25, 2);
    expect(result.nonStatutoryDeductions).toBe(10_000);
    expect(result.netAfterDeductions).toBeCloseTo(16_193.75, 2);
    expect(result.minimumNet).toBe(10_000);
    expect(result.compliant).toBe(true);
    expect(result.excessDeduction).toBe(0);
  });

  it("flags non-compliance when non-statutory deductions push net pay below a third", () => {
    const result = checkOneThirdRule({
      basicSalary: 20_000,
      saccoDeductions: 8_000,
      loanDeductions: 8_000,
    });
    expect(result.statutoryDeductions).toBe(2_050);
    expect(result.nonStatutoryDeductions).toBe(16_000);
    expect(result.netAfterDeductions).toBe(1_950);
    expect(result.minimumNet).toBeCloseTo(6_666.67, 2);
    expect(result.compliant).toBe(false);
    expect(result.excessDeduction).toBeCloseTo(4_716.67, 2);
  });

  it("treats zero non-statutory deductions as compliant by construction", () => {
    const result = checkOneThirdRule({
      basicSalary: 50_000,
      saccoDeductions: 0,
      loanDeductions: 0,
    });
    expect(result.compliant).toBe(true);
  });

  it("handles zero basic salary gracefully", () => {
    const result = checkOneThirdRule({ basicSalary: 0, saccoDeductions: 1_000, loanDeductions: 0 });
    expect(result.compliant).toBe(true);
    expect(result.totalDeductions).toBe(0);
  });
});
