import { describe, expect, it } from "vitest";
import { calculateMoneyRunwayMonths } from "../runway";

/** Simulates the same B_t = B_{t-1}(1+r) - W recurrence month by month. */
function simulateMonthsToDeplete(startingBalance: number, monthlyWithdrawal: number, monthlyRate: number): number {
  let balance = startingBalance;
  let months = 0;
  while (balance > 0 && months < 100_000) {
    balance = balance * (1 + monthlyRate) - monthlyWithdrawal;
    months++;
  }
  return months;
}

describe("calculateMoneyRunwayMonths", () => {
  it("handles a 0% return rate as simple division", () => {
    expect(calculateMoneyRunwayMonths({ startingBalance: 120_000, monthlyWithdrawal: 10_000, annualReturnRate: 0 })).toBe(12);
  });

  it("is sandwiched by a month-by-month simulation for a depleting balance", () => {
    const startingBalance = 5_000_000;
    const monthlyWithdrawal = 50_000;
    const annualReturnRate = 0.08;
    const months = calculateMoneyRunwayMonths({ startingBalance, monthlyWithdrawal, annualReturnRate });

    const simulatedMonths = simulateMonthsToDeplete(startingBalance, monthlyWithdrawal, annualReturnRate / 12);
    expect(Math.floor(months)).toBeLessThanOrEqual(simulatedMonths);
    expect(Math.ceil(months)).toBeGreaterThanOrEqual(simulatedMonths);
  });

  it("returns Infinity when the withdrawal never exceeds monthly returns", () => {
    // 1,000,000 at 12%/yr (1%/mo) earns 10,000/mo — withdrawing 8,000/mo never depletes it.
    expect(
      calculateMoneyRunwayMonths({ startingBalance: 1_000_000, monthlyWithdrawal: 8_000, annualReturnRate: 0.12 })
    ).toBe(Infinity);
  });

  it("returns Infinity for a zero withdrawal and 0 for an already-empty balance", () => {
    expect(calculateMoneyRunwayMonths({ startingBalance: 100_000, monthlyWithdrawal: 0, annualReturnRate: 0.05 })).toBe(Infinity);
    expect(calculateMoneyRunwayMonths({ startingBalance: 0, monthlyWithdrawal: 5_000, annualReturnRate: 0.05 })).toBe(0);
  });
});
