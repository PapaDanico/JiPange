import type { BudgetSplit, Calculations } from "./types";
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

export function formatKES(amount: number): string {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(amount);
}
