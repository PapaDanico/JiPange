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
 * Kenya's Employment Act s.19(3) caps the total of ALL deductions at two-thirds
 * of wages, so an employee must retain at least one third.
 *
 * STATUTORY DEDUCTIONS COUNT. This docstring used to say the opposite — that
 * NSSF, SHIF, AHL and PAYE sat outside the cap and only SACCO and loan
 * deductions were tested against it — while the code below has always included
 * them. The code was right and the sentence describing it was wrong, which is
 * the more dangerous way round: the next person to "fix the inconsistency"
 * would most likely have broken working code to match a false comment.
 *
 * The statute caps "the total amount of all deductions which under the
 * provisions of subsection (1) may be made", and subsection (1) reaches amounts
 * an employer deducts under any written law. The decisive evidence is what
 * happened when the rates moved: the Auditor-General reports roughly 47,300
 * national government employees taking home less than a third, and the police
 * service attributes that breach to mandatory NSSF from July 2023, the housing
 * levy from that August, and SHA deductions in early 2024. Introducing a
 * statutory levy cannot put an employer in breach of a cap that statutory
 * levies do not count towards.
 *
 * The distinction is not academic. At Ksh 50,000 basic with Ksh 25,000 of SACCO
 * and loan deductions the two readings differ by Ksh 2,638 a month, and they
 * disagree about whether the payslip is lawful at all.
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
