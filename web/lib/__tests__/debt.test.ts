import { describe, expect, it } from "vitest";
import { calculateDebtStack, effectiveAprPct, MAX_MONTHLY_RATE_PCT, monthlyRateOrNull } from "../debt";

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

  it("includes a 0%-rate loan (e.g. interest-free from family) in the plan rather than dropping it", () => {
    const loans = [
      { id: "a", name: "Family loan", balance: 50_000, monthlyRatePct: 0 },
      { id: "b", name: "Tala", balance: 5_000, monthlyRatePct: 13 },
    ];
    const result = calculateDebtStack(loans, 10_000);
    expect(result).not.toBeNull();
    expect(result!.totalBalance).toBe(55_000);
    expect(result!.loans.map((l) => l.id).sort()).toEqual(["a", "b"]);
    // The 0% loan accrues no interest and is deprioritized behind the
    // interest-bearing loan under avalanche, but is still fully paid off.
    const family = result!.loans.find((l) => l.id === "a")!;
    const tala = result!.loans.find((l) => l.id === "b")!;
    expect(family.totalInterestPaid).toBe(0);
    expect(tala.clearedAtMonth).toBeLessThanOrEqual(family.clearedAtMonth);
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

describe("the typed monthly rate", () => {
  it("compounds a monthly rate to its effective annual rate", () => {
    expect(effectiveAprPct(0)).toBe(0);
    expect(effectiveAprPct(1)).toBeCloseTo(12.6825, 3);
    expect(effectiveAprPct(100)).toBe(409_500);
  });

  it("keeps a blank rate as 0%, so the loan stays in the plan", () => {
    expect(monthlyRateOrNull("")).toBe(0);
    expect(monthlyRateOrNull("13")).toBe(13);
  });

  /* "1e308" is finite; before this bound it reached Math.pow and the page
   * printed "Infinity% effective APR". */
  it("refuses a rate no lender could charge, and anything that is not a rate", () => {
    for (const bad of ["1e308", "-1", "abc", String(MAX_MONTHLY_RATE_PCT + 0.01)]) {
      expect(monthlyRateOrNull(bad), bad).toBeNull();
    }
  });

  it("never answers a non-finite APR for any rate it admits", () => {
    expect(Number.isFinite(effectiveAprPct(MAX_MONTHLY_RATE_PCT))).toBe(true);
  });
});

import { compareStrategies } from "../debt";

describe("compareStrategies", () => {
  const loans = [
    { id: "a", name: "Small cheap", balance: 2_000, monthlyRatePct: 5 },
    { id: "b", name: "Big dear", balance: 20_000, monthlyRatePct: 13 },
    { id: "c", name: "Mid", balance: 8_000, monthlyRatePct: 10 },
  ];

  it("avalanche never pays more interest than the other orders on the same budget", () => {
    const all = compareStrategies(loans, 9_000);
    expect(all).toHaveLength(3);
    const av = all.find((c) => c.strategy === "avalanche")!;
    for (const c of all) expect(av.result.totalInterestPaid).toBeLessThanOrEqual(c.result.totalInterestPaid);
    expect(av.extraInterestVsBest).toBe(0);
  });

  it("snowball clears the smallest balance first, relief the biggest monthly interest bill", () => {
    const first = (s: "snowball" | "relief") => {
      const r = compareStrategies(loans, 9_000).find((c) => c.strategy === s)!.result;
      return [...r.loans].sort((x, y) => x.avalancheRank - y.avalancheRank)[0].name;
    };
    expect(first("snowball")).toBe("Small cheap");
    expect(first("relief")).toBe("Big dear");
  });

  it("every strategy is paid the same budget: total paid equals balance plus interest within a shilling per month", () => {
    for (const c of compareStrategies(loans, 9_000)) {
      expect(c.result.totalInterestPaid).toBeGreaterThan(0);
      expect(c.result.monthsToDebtFree).toBeGreaterThan(0);
      expect(c.result.totalBalance).toBe(30_000);
    }
  });

  it("default strategy is unchanged (avalanche)", () => {
    expect(calculateDebtStack(loans, 9_000)).toEqual(calculateDebtStack(loans, 9_000, "avalanche"));
  });

  it("an unpayable budget gives no comparison rather than a partial one", () => {
    expect(compareStrategies(loans, 100)).toEqual([]);
  });
});

describe("early-settlement fees", () => {
  const base = [
    { id: "a", name: "Tala", balance: 10_000, monthlyRatePct: 13 },
    { id: "b", name: "Branch", balance: 6_000, monthlyRatePct: 12 },
  ];

  it("no fee, zero fee and a missing fee give the same plan", () => {
    const none = calculateDebtStack(base, 5_000)!;
    const zero = calculateDebtStack(base.map((l) => ({ ...l, settlementFee: 0 })), 5_000)!;
    expect(zero).toEqual(none);
    expect(none.totalFeesPaid).toBe(0);
  });

  it("a closing fee is paid once, costs money and never speeds the plan up", () => {
    const none = calculateDebtStack(base, 5_000)!;
    const withFee = calculateDebtStack([{ ...base[0], settlementFee: 1_500 }, base[1]], 5_000)!;
    expect(withFee.totalFeesPaid).toBe(1_500);
    expect(withFee.loans.find((l) => l.id === "a")!.settlementFeePaid).toBe(1_500);
    expect(withFee.loans.find((l) => l.id === "b")!.settlementFeePaid).toBe(0);
    expect(withFee.monthsToDebtFree).toBeGreaterThanOrEqual(none.monthsToDebtFree);
    // Paying the fee diverts budget, so the other loan can stay open longer and
    // accrue more interest: what must hold is that the total cost never falls.
    expect(withFee.totalInterestPaid + withFee.totalFeesPaid).toBeGreaterThan(none.totalInterestPaid + none.totalFeesPaid);
  });

  it("every order pays the same fees, since every loan is closed", () => {
    const loans = base.map((l) => ({ ...l, settlementFee: 800 }));
    for (const c of compareStrategies(loans, 5_000)) expect(c.result.totalFeesPaid).toBe(1_600);
  });

  it("ignores a negative or non-numeric fee", () => {
    const bad = calculateDebtStack([{ ...base[0], settlementFee: -50 }, { ...base[1], settlementFee: Number.NaN }], 5_000)!;
    expect(bad.totalFeesPaid).toBe(0);
  });
});
