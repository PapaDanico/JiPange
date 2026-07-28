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

  /**
   * Compliant because statutory deductions are small, NOT by construction.
   *
   * The old name for this test said "by construction", which quietly asserted
   * that statutory deductions cannot make anyone non-compliant because they are
   * excluded from the cap. They are not excluded — they are simply never large
   * enough. The statutory share rises with income and asymptotes near 37.7% —
   * PAYE's top band is 35%, not the 30% I first wrote here, since 32.5% starts
   * at 500,000 and 35% above 800,000 — while NSSF is capped in shillings and
   * SHIF and the levy are flat. The floor needs two thirds. 37.7% never gets
   * there, so the conclusion holds; only my arithmetic for it was wrong.
   *
   * The distinction matters because it is the whole interpretation question.
   */
  it("is compliant on statutory deductions alone, at every salary", () => {
    for (const basicSalary of [20_000, 50_000, 150_000, 250_000, 1_000_000]) {
      const r = checkOneThirdRule({ basicSalary, saccoDeductions: 0, loanDeductions: 0 });
      expect(r.compliant, `statutory alone tripped the floor at ${basicSalary}`).toBe(true);
      // And the reason: they never come close to two thirds.
      expect(r.statutoryDeductions / basicSalary).toBeLessThan(0.5);
    }
  });

  /**
   * Statutory deductions COUNT against the two-thirds cap.
   *
   * Employment Act s.19(3) caps "the total amount of all deductions which under
   * the provisions of subsection (1) may be made", and subsection (1) reaches
   * amounts deducted under any written law. The decisive evidence is what
   * happened when the rates moved: the Auditor-General reports roughly 47,300
   * national government employees below the one-third floor, a breach the
   * police service attributes to mandatory NSSF, the housing levy and SHA. A
   * statutory levy cannot breach a cap it is not counted against.
   *
   * The module docstring used to claim the opposite while the code did this.
   * This test exists so that nobody reconciles the two in the wrong direction —
   * it pins the reading, not just the arithmetic.
   */
  it("counts statutory deductions against the floor, not only voluntary ones", () => {
    const basicSalary = 50_000;
    const r = checkOneThirdRule({ basicSalary, saccoDeductions: 15_000, loanDeductions: 10_000 });

    // Under the rejected reading, 25,000 of voluntary deductions sits well
    // inside two thirds of 50,000 and this payslip would be lawful.
    expect(r.nonStatutoryDeductions).toBe(25_000);
    expect(r.nonStatutoryDeductions).toBeLessThan((basicSalary * 2) / 3);

    // Under the statute as read here, the statutory deductions come off too,
    // and the payslip breaches the floor.
    expect(r.totalDeductions).toBeCloseTo(r.statutoryDeductions + r.nonStatutoryDeductions, 2);
    expect(r.compliant).toBe(false);
    expect(r.excessDeduction).toBeGreaterThan(0);
  });

  it("handles zero basic salary gracefully", () => {
    const result = checkOneThirdRule({ basicSalary: 0, saccoDeductions: 1_000, loanDeductions: 0 });
    expect(result.compliant).toBe(true);
    expect(result.totalDeductions).toBe(0);
  });
});
