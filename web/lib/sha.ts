/**
 * SHA (Social Health Authority) contribution calculator and coverage gap analyser.
 * SHA replaced NHIF in October 2024 and is Kenya's sole statutory health financier in 2026.
 *
 * Contribution: 2.75% of gross salary / declared income, floor Ksh 300/month.
 * Rates and tariffs from SHA Act 2023 and the 2026 SHA Tariffs document.
 */

import { SHIF_RATE } from "./tax";
import { round2 } from "./money";

export type EmploymentType = "employed" | "self_employed" | "informal";

export { SHIF_RATE };
export const MONTHLY_FLOOR = 300;

export interface ShaInput {
  employmentType: EmploymentType;
  grossMonthlyIncome: number;
  familySize: number; // 1 = individual, 2 = couple, 3+ = family with children
  wantsPrivateCare: boolean;
}

export interface ShaResult {
  monthlyContribution: number;
  /**
   * True when the 2.75%-of-income formula is a genuine statutory rate for this
   * person, false when it is our best available approximation.
   *
   * SHA assesses salaried members on gross pay at 2.75%. Non-salaried members
   * are means-assessed on declared HOUSEHOLD income and assets, which is a
   * different process with its own schedule — not something this calculator
   * can reproduce from a single income figure. It used to accept an
   * employmentType and silently ignore it, so a self-employed user tapped a
   * control that changed nothing and got a salaried answer presented as fact.
   * The number is still the most useful estimate we can offer; what changes is
   * that we now say which it is.
   */
  isStatutoryRate: boolean;
  annualContribution: number;
  isAtFloor: boolean;
  shaAsPercentOfIncome: number;
  gaps: string[];
  privateTopUpRange: { low: number; high: number };
  privateTopUpLabel: string;
  totalMonthlyHealthBudget: { low: number; high: number };
}

export function calculateShaHealth(input: ShaInput): ShaResult {
  const { grossMonthlyIncome, wantsPrivateCare, employmentType } = input;
  const isStatutoryRate = employmentType === "employed";
  // Guard against 0/negative family size reaching the tiers below — the UI's
  // preset selector never sends this, but the exported function has no
  // schema of its own, so a bad direct caller shouldn't get a nonsensical
  // "0 members" label.
  const familySize = Math.max(1, input.familySize);

  const computed = round2(grossMonthlyIncome * SHIF_RATE);
  const monthlyContribution = Math.max(computed, MONTHLY_FLOOR);
  const isAtFloor = computed < MONTHLY_FLOOR;
  const annualContribution = monthlyContribution * 12;
  const shaAsPercentOfIncome =
    grossMonthlyIncome > 0
      ? Math.round((monthlyContribution / grossMonthlyIncome) * 1000) / 10
      : 0;

  const gaps: string[] = [
    "Private hospital access — SHA covers accredited public hospitals (Level 4–6); most private facilities require a separate top-up plan",
    "Dental and optical — routine dental check-ups, fillings, and vision tests are excluded from SHIF benefits",
  ];

  if (familySize >= 2) {
    gaps.push(
      "Private maternity — SHA covers delivery at public hospitals; private maternity packages require a top-up or direct payment"
    );
  }
  if (familySize >= 3) {
    gaps.push(
      "Paediatric specialist referrals — follow-up specialist consultations for children at private clinics are not SHA-reimbursed"
    );
  }
  gaps.push(
    "Private ambulance — SHA does not reimburse private ambulance transport costs"
  );
  if (wantsPrivateCare) {
    gaps.push(
      "Non-accredited private facilities — SHA only covers care at SHA-contracted providers; verify your hospital's accreditation status"
    );
  }

  // Top-up cost ranges for private supplementary cover (2026 market estimates, individual basis).
  let topUpLow: number;
  let topUpHigh: number;
  let topUpLabel: string;

  if (familySize === 1) {
    topUpLow = 1_500;
    topUpHigh = 3_500;
    topUpLabel = "individual SHA top-up";
  } else if (familySize === 2) {
    topUpLow = 3_000;
    topUpHigh = 6_500;
    topUpLabel = "couple SHA top-up";
  } else {
    const extraKids = Math.max(0, familySize - 2);
    topUpLow = 5_000 + extraKids * 800;
    topUpHigh = 12_000 + extraKids * 1_500;
    topUpLabel = `family SHA top-up (${familySize} members)`;
  }

  if (wantsPrivateCare) {
    topUpLow = Math.round(topUpLow * 1.6);
    topUpHigh = Math.round(topUpHigh * 2.0);
    topUpLabel += " with private hospital access";
  }

  return {
    monthlyContribution,
    isStatutoryRate,
    annualContribution,
    isAtFloor,
    shaAsPercentOfIncome,
    gaps,
    privateTopUpRange: { low: topUpLow, high: topUpHigh },
    privateTopUpLabel: topUpLabel,
    totalMonthlyHealthBudget: {
      low: monthlyContribution + topUpLow,
      high: monthlyContribution + topUpHigh,
    },
  };
}
