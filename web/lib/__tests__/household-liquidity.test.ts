import { describe, expect, it } from "vitest";
import { simulateHouseholdLiquidity } from "../household-liquidity";
import { MAX_AMOUNT } from "../money";

const household = {
  liquidSavings: 420_000,
  monthlyIncome: 200_000,
  essentialExpenses: 140_000,
  monthlyDebtService: 20_000,
};

describe("simulateHouseholdLiquidity", () => {
  it("counts debt service in emergency runway and produces twelve cash balances", () => {
    const result = simulateHouseholdLiquidity(household)!;
    expect(result.essentialRunwayMonths).toBe(2.63);
    expect(result.endingBalanceByMonth).toHaveLength(12);
    expect(result.endingBalanceByMonth[0]).toBe(460_000);
    expect(result.firstShortfallMonth).toBeNull();
  });

  it("reveals the first liquidity shortfall under income shock and school fees", () => {
    const result = simulateHouseholdLiquidity({
      ...household, incomeShockPct: 30,
      obligations: [{ month: 1, amount: 350_000 }, { month: 3, amount: 100_000 }],
    })!;
    expect(result.stressedMonthlyIncome).toBe(140_000);
    expect(result.endingBalanceByMonth[0]).toBe(50_000);
    expect(result.firstShortfallMonth).toBe(3);
    expect(result.endingBalanceByMonth[2]).toBe(-90_000);
  });

  it("does not double-count debt service or infer inaccessible investments", () => {
    const result = simulateHouseholdLiquidity({
      liquidSavings: 100_000, monthlyIncome: 0, essentialExpenses: 50_000, monthlyDebtService: 50_000,
    })!;
    expect(result.essentialRunwayMonths).toBe(1);
    expect(result.firstShortfallMonth).toBe(2);
  });

  it("returns null for invalid values or obligations outside the horizon", () => {
    expect(simulateHouseholdLiquidity({ ...household, incomeShockPct: 120 })).toBeNull();
    expect(simulateHouseholdLiquidity({ ...household, liquidSavings: Infinity })).toBeNull();
    expect(simulateHouseholdLiquidity({ ...household, obligations: [{ month: 13, amount: 100 }] })).toBeNull();
    expect(simulateHouseholdLiquidity({ ...household, obligations: [{ month: 1.5, amount: 100 }] })).toBeNull();
  });

  it("distinguishes zero expenses from infinite runway claims", () => {
    const result = simulateHouseholdLiquidity({
      liquidSavings: 0, monthlyIncome: 0, essentialExpenses: 0, monthlyDebtService: 0,
    })!;
    expect(result.essentialRunwayMonths).toBeNull();
    expect(result.firstShortfallMonth).toBeNull();
  });

  it("refuses a combined outflow or a month's obligations beyond the numeric ceiling", () => {
    expect(simulateHouseholdLiquidity({ ...household, essentialExpenses: MAX_AMOUNT, monthlyDebtService: MAX_AMOUNT })).toBeNull();
    expect(simulateHouseholdLiquidity({
      ...household,
      obligations: [{ month: 2, amount: MAX_AMOUNT }, { month: 2, amount: MAX_AMOUNT }],
    })).toBeNull();
  });
});
