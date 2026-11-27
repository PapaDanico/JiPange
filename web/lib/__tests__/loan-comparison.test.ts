import { describe, expect, it } from "vitest";
import { compareLoanProducts, SHORT_TERM_DAYS } from "../loan-comparison";
import { calculateFulizaCost } from "../fuliza";

/* Rebuilt 27 Nov 2026 (docs/research/2026-11-27-credit-and-bond-engine-gaps
 * in PapaDanico/Mwangaza-Yield). Each reference case below is arithmetic a
 * reader can check by hand, not a figure read back from the code. */
const row = (principal: number, months: number, prefix: string) =>
  compareLoanProducts(principal, months).find((r) => r.name.startsWith(prefix))!;

describe("compareLoanProducts: reference cases", () => {
  it("M-Shwari: 7.5% fee plus 20% excise on it, taken at payout (KSh 10,000)", () => {
    const m = row(10_000, 1, "M-Shwari");
    expect(m.cashReceived).toBe(9_850); // 10,000 less 1.5% excise
    expect(m.totalRepaid).toBe(10_750); // 10,000 plus the 7.5% fee
    expect(m.totalCost).toBe(900); // 9.14% of the cash received, for 30 days
    expect(m.effectiveAnnualRate).toBeCloseTo(Math.pow(10_750 / 9_850, 365 / 30) - 1, 10);
  });

  it("SACCO at 1% a month reducing: 12.68% a year", () => {
    expect(row(60_000, 12, "SACCO").effectiveAnnualRate).toBeCloseTo(Math.pow(1.01, 12) - 1, 4); // instalments are billed in whole cents
  });

  it("bank at 14.5% nominal, monthly instalments: 15.50% a year, not the 14.5% printed", () => {
    expect(row(60_000, 12, "Bank").effectiveAnnualRate).toBeCloseTo(Math.pow(1 + 0.145 / 12, 12) - 1, 4);
  });

  it("app lender at 0.45% a day for 30 days: KSh 1,350 on 10,000", () => {
    const a = row(10_000, 1, "App lender");
    expect(a.totalCost).toBe(1_350);
    expect(a.effectiveAnnualRate).toBeCloseTo(Math.pow(1.135, 365 / 30) - 1, 10);
  });

  it("Fuliza: the 30-day tariff, and a rate its own repayment produces", () => {
    const f = row(10_000, 1, "Fuliza");
    const cost = calculateFulizaCost(10_000, SHORT_TERM_DAYS);
    expect(f.totalRepaid).toBe(cost.totalRepaid);
    expect(f.effectiveAnnualRate).toBeCloseTo(Math.pow(cost.totalRepaid / 10_000, 365 / 30) - 1, 10);
  });
});

describe("compareLoanProducts: one method for every row", () => {
  it("prices short products for their own 30 days, never stretched over the reader's term", () => {
    for (const months of [1, 6, 36]) {
      for (const r of compareLoanProducts(50_000, months).filter((x) => x.kind === "short")) {
        expect(r.termDays).toBe(30);
        expect(r.monthlyPayment).toBeNull();
        // Same cost whatever term the reader typed.
        expect(r.totalCost).toBe(row(50_000, 1, r.name).totalCost);
      }
    }
  });

  it("states only a floor for rolling a short product over a longer need", () => {
    const m6 = row(10_000, 6, "M-Shwari");
    // At least one 30-day cycle for each month needed, each costing at least the first.
    expect(m6.rolloverFloorCost).toBe(6 * 900);
    expect(row(10_000, 1, "M-Shwari").rolloverFloorCost).toBeNull();
  });

  it("gives term loans a monthly instalment and a cost that adds up", () => {
    for (const r of compareLoanProducts(60_000, 12).filter((x) => x.kind === "term")) {
      expect(r.monthlyPayment).toBeGreaterThan(0);
      expect(r.totalCost).toBeCloseTo(r.totalRepaid - r.cashReceived, 2);
    }
  });

  it("keeps the SACCO cheapest of the term loans", () => {
    expect(row(60_000, 12, "SACCO").totalCost).toBeLessThan(row(60_000, 12, "Bank").totalCost);
  });

  it("labels every row as an illustration and says how it was priced", () => {
    for (const r of compareLoanProducts(60_000, 6)) {
      expect(r.estimated).toBe(true);
      expect(r.basis.length).toBeGreaterThan(20);
    }
  });

  it("offers Fuliza only within its KSh 70,000 limit", () => {
    expect(compareLoanProducts(60_000, 6).some((r) => r.name === "Fuliza")).toBe(true);
    expect(compareLoanProducts(200_000, 6).some((r) => r.name === "Fuliza")).toBe(false);
  });
});

describe("compareLoanProducts: input guards", () => {
  it("rejects non-finite amounts, fractional months, and terms beyond engine limits", () => {
    expect(compareLoanProducts(Number.NaN, 12)).toEqual([]);
    expect(compareLoanProducts(Number.POSITIVE_INFINITY, 12)).toEqual([]);
    expect(compareLoanProducts(1e16, 12)).toEqual([]);
    expect(compareLoanProducts(100_000, 12.5)).toEqual([]);
    expect(compareLoanProducts(100_000, 601)).toEqual([]);
    expect(compareLoanProducts(100_000, Number.POSITIVE_INFINITY)).toEqual([]);
  });

  it("returns an empty array for non-positive principal or term", () => {
    expect(compareLoanProducts(0, 6)).toEqual([]);
    expect(compareLoanProducts(100_000, 0)).toEqual([]);
  });
});
