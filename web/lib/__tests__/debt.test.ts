import { describe, expect, it } from "vitest";
import { calculateDebtStack } from "../debt";

describe("calculateDebtStack", () => {
  it("returns null when no valid loans", () => {
    expect(calculateDebtStack([], 5000)).toBeNull();
  });

  it("returns null when budget cannot cover monthly interest", () => {
    const loans = [{ id: "1", name: "Fuliza", balance: 10_000, monthlyRatePct: 32 }];
    // Monthly interest = 3,200; budget of 3,000 is insufficient.
    expect(calculateDebtStack(loans, 3_000)).toBeNull();
  });

  it("clears a single loan within expected months", () => {
    const loans = [{ id: "1", name: "Tala", balance: 5_000, monthlyRatePct: 13 }];
    const result = calculateDebtStack(loans, 2_000);
    expect(result).not.toBeNull();
    // With 5K at 13%/month and 2K budget, should clear in a handful of months.
    expect(result!.monthsToDebtFree).toBeGreaterThan(0);
    expect(result!.monthsToDebtFree).toBeLessThan(20);
    expect(result!.loans[0].clearedAtMonth).toBeGreaterThan(0);
  });

  it("orders loans by monthly rate descending (avalanche rank 1 = highest rate)", () => {
    const loans = [
      { id: "a", name: "KCB", balance: 5_000, monthlyRatePct: 5 },
      { id: "b", name: "Tala", balance: 5_000, monthlyRatePct: 13 },
      { id: "c", name: "Fuliza", balance: 3_000, monthlyRatePct: 32 },
    ];
    const result = calculateDebtStack(loans, 10_000);
    expect(result).not.toBeNull();
    const byRank = [...result!.loans].sort((a, b) => a.avalancheRank - b.avalancheRank);
    expect(byRank[0].name).toBe("Fuliza");
    expect(byRank[1].name).toBe("Tala");
    expect(byRank[2].name).toBe("KCB");
  });

  it("reports total interest paid and savings vs min-only", () => {
    const loans = [{ id: "1", name: "Branch", balance: 10_000, monthlyRatePct: 12 }];
    const result = calculateDebtStack(loans, 5_000);
    expect(result).not.toBeNull();
    expect(result!.totalInterestPaid).toBeGreaterThan(0);
    expect(result!.interestSavedVsMinOnly).toBeGreaterThanOrEqual(0);
  });

  it("highest-rate loan is cleared before lower-rate loans", () => {
    const loans = [
      { id: "a", name: "Tala", balance: 5_000, monthlyRatePct: 13 },
      { id: "b", name: "KCB", balance: 5_000, monthlyRatePct: 5 },
    ];
    const result = calculateDebtStack(loans, 3_000);
    expect(result).not.toBeNull();
    const tala = result!.loans.find((l) => l.id === "a")!;
    const kcb = result!.loans.find((l) => l.id === "b")!;
    // Tala (rank 1, highest rate) should be cleared before or same time as KCB.
    expect(tala.clearedAtMonth).toBeLessThanOrEqual(kcb.clearedAtMonth);
  });
});
