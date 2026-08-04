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

/* The boundaries are decided by intent, not by IEEE-754.
 *
 * These were bare `> 0.2` and `>= 0.1` comparisons against a value that is
 * COMPUTED, and the computation does not land on 0.2 exactly. calculateFinancials
 * returns `netMonthly * 0.2 / netMonthly`, which is 0.2 for a Ksh 50,000 salary
 * and 0.20000000000000004 for Ksh 120,000 — the same 20% either way.
 *
 * So the band a reader saw flipped from amber to green somewhere between those
 * two salaries, for no reason they could ever have discovered, because
 * 0.2 > 0.2 is false and 0.20000000000000004 > 0.2 is true. Two users on the
 * identical 20% rate were shown different colours.
 *
 * The existing unit test did not catch it and could not have: it passed clean
 * literals (0.25, 0.2, 0.15, 0.05) while production passed the arithmetic. That
 * is the whole lesson — a boundary test built from literals tests the boundary
 * you meant, never the values the product actually produces.
 *
 * EPSILON is far below any meaningful difference in a savings rate (1e-9 is a
 * ten-millionth of a percentage point) and far above double-rounding noise. */
const BAND_EPSILON = 1e-9;

export function savingsRateBand(savingsRate: number): SavingsRateBand {
  if (savingsRate > 0.2 + BAND_EPSILON) return "green";
  if (savingsRate >= 0.1 - BAND_EPSILON) return "amber";
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
