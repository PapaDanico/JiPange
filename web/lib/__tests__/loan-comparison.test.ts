import { describe, expect, it } from "vitest";
import { compareLoanProducts } from "../loan-comparison";

describe("compareLoanProducts", () => {
  it("returns all 5 products with sensible shapes", () => {
    const results = compareLoanProducts(100_000, 6);
    expect(results).toHaveLength(5);
    for (const product of results) {
      expect(product.totalRepaid).toBeGreaterThan(100_000);
      expect(product.totalInterest).toBeGreaterThan(0);
      expect(product.totalRepaid).toBeCloseTo(100_000 + product.totalInterest, 2);
    }
  });

  it("tiers SACCO as green and mobile lenders/Fuliza/M-Shwari as red", () => {
    const results = compareLoanProducts(100_000, 6);
    const byName = Object.fromEntries(results.map((r) => [r.name, r]));
    expect(byName["SACCO loan (1% pm reducing)"].tier).toBe("green");
    expect(byName["Bank personal loan (~15% p.a.)"].tier).toBe("amber");
    expect(byName["Digital lender (Tala/Branch-style, ~15% pm flat)"].tier).toBe("red");
    expect(byName["Fuliza (1.083% per day)"].tier).toBe("red");
    expect(byName["M-Shwari (7.5% facility fee)"].tier).toBe("red");
  });

  it("SACCO is always the cheapest option over the same term", () => {
    const results = compareLoanProducts(200_000, 12);
    const sacco = results.find((r) => r.name.startsWith("SACCO"))!;
    const others = results.filter((r) => !r.name.startsWith("SACCO"));
    for (const other of others) {
      expect(sacco.totalInterest).toBeLessThan(other.totalInterest);
    }
  });

  it("Fuliza and M-Shwari have no monthly payment (short-term facility fees)", () => {
    const results = compareLoanProducts(50_000, 3);
    const fuliza = results.find((r) => r.name.startsWith("Fuliza"))!;
    const mshwari = results.find((r) => r.name.startsWith("M-Shwari"))!;
    expect(fuliza.monthlyPayment).toBeNull();
    expect(mshwari.monthlyPayment).toBeNull();
  });

  it("returns an empty array for non-positive principal or term", () => {
    expect(compareLoanProducts(0, 6)).toEqual([]);
    expect(compareLoanProducts(100_000, 0)).toEqual([]);
  });
});
