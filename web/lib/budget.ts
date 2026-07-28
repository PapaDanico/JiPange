import type { BudgetSplit, Calculations, FiftyTwentyFiveTwentyFiveSplit } from "./types";
import { calculateNetPay } from "./tax";

/** Kenya-calibrated 50/30/20 variant: Needs / Social obligations+Wants / Savings. */
export const BUDGET_ALLOCATION = {
  needs: 0.5,
  socialObligations: 0.15,
  wants: 0.15,
  savings: 0.2,
} as const;

export function calculateBudgetSplit(netMonthly: number): BudgetSplit {
  return {
    needs: netMonthly * BUDGET_ALLOCATION.needs,
    socialObligations: netMonthly * BUDGET_ALLOCATION.socialObligations,
    wants: netMonthly * BUDGET_ALLOCATION.wants,
    savings: netMonthly * BUDGET_ALLOCATION.savings,
  };
}

/** Alternative model: 50% household expenses / 25% savings (stability, emergency fund) / 25% investments (future projects). */
export const BUDGET_ALLOCATION_502525 = {
  household: 0.5,
  savingsEmergency: 0.25,
  investments: 0.25,
} as const;

export function calculate502525Split(netMonthly: number): FiftyTwentyFiveTwentyFiveSplit {
  return {
    household: netMonthly * BUDGET_ALLOCATION_502525.household,
    savingsEmergency: netMonthly * BUDGET_ALLOCATION_502525.savingsEmergency,
    investments: netMonthly * BUDGET_ALLOCATION_502525.investments,
  };
}

export type SavingsRateBand = "green" | "amber" | "red";

export function savingsRateBand(savingsRate: number): SavingsRateBand {
  if (savingsRate > 0.2) return "green";
  if (savingsRate >= 0.1) return "amber";
  return "red";
}

export function calculateFinancials(grossMonthlySalary: number): Calculations {
  const { netMonthly } = calculateNetPay(grossMonthlySalary);
  const budgetSplit = calculateBudgetSplit(netMonthly);
  const savingsCapacity = budgetSplit.savings;
  const savingsRate = netMonthly > 0 ? savingsCapacity / netMonthly : 0;

  return { netMonthly, budgetSplit, savingsCapacity, savingsRate };
}

/**
 * Money, written the way Kenyans write it.
 *
 * This used `style: "currency"` with `currency: "KES"`, which renders the ISO
 * 4217 code: "KES 1,234". Every visible label in the app had already been
 * moved to "Ksh" — but the FORMATTER had not, so the two disagreed wherever a
 * figure sat beside prose, and the PDF exports came out in KES throughout
 * while the page around them said Ksh.
 *
 * That is the shape of an incomplete rename: the strings a search finds get
 * changed, and the function that generates the rest keeps its own answer.
 *
 * The sign goes OUTSIDE the unit — "-Ksh 500", not "Ksh -500" — because the
 * latter reads as a quantity of some negative currency. Intl's currency mode
 * did this correctly and hand-rolling the prefix is exactly where it gets
 * lost, so it is done deliberately here and tested.
 */
export function formatKES(amount: number): string {
  const n = Number.isFinite(amount) ? amount : 0;
  const digits = new Intl.NumberFormat("en-KE", {
    maximumFractionDigits: 0,
  }).format(Math.abs(n));
  return `${n < 0 ? "-" : ""}Ksh ${digits}`;
}
