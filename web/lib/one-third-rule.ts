import { calculateNetPay } from "./tax";
import { round2 } from "./money";

export interface OneThirdRuleResult {
  statutoryDeductions: number;
  nonStatutoryDeductions: number;
  totalDeductions: number;
  netAfterDeductions: number;
  minimumNet: number;
  compliant: boolean;
  excessDeduction: number;
}

/**
 * Kenya's Employment Act (s.19) caps total non-statutory deductions so an
 * employee retains at least one-third of their basic salary. Statutory
 * deductions (NSSF, SHIF, AHL, PAYE) are computed from basic salary and
 * don't count against this cap themselves — this checks whether the SACCO/
 * loan deductions layered on top push net pay below that floor.
 */
export function checkOneThirdRule(params: {
  basicSalary: number;
  saccoDeductions: number;
  loanDeductions: number;
}): OneThirdRuleResult {
  const { basicSalary, saccoDeductions, loanDeductions } = params;

  if (basicSalary <= 0) {
    return {
      statutoryDeductions: 0,
      nonStatutoryDeductions: 0,
      totalDeductions: 0,
      netAfterDeductions: 0,
      minimumNet: 0,
      compliant: true,
      excessDeduction: 0,
    };
  }

  const tax = calculateNetPay(basicSalary);
  const statutoryDeductions = round2(tax.nssf.total + tax.shif + tax.ahl + tax.paye);
  const nonStatutoryDeductions = round2(Math.max(0, saccoDeductions) + Math.max(0, loanDeductions));
  const totalDeductions = round2(statutoryDeductions + nonStatutoryDeductions);
  const netAfterDeductions = round2(basicSalary - totalDeductions);
  const minimumNet = round2(basicSalary / 3);
  const compliant = netAfterDeductions >= minimumNet;
  const excessDeduction = compliant ? 0 : round2(minimumNet - netAfterDeductions);

  return {
    statutoryDeductions,
    nonStatutoryDeductions,
    totalDeductions,
    netAfterDeductions,
    minimumNet,
    compliant,
    excessDeduction,
  };
}
