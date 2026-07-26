import { describe, it, expect } from "vitest";
import {
  FULIZA_APR,
  FULIZA_DAILY_RATE,
  FULIZA_ROLLED_ANNUAL_COST,
  calculateFulizaCost,
} from "@/lib/fuliza";
import { compareLoanProducts } from "@/lib/loan-comparison";
import {
  DHOWCSD_BILL_MINIMUM,
  DHOWCSD_MINIMUM,
  dhowcsdLadder,
} from "@/lib/market-2026";
import { calculateShaHealth } from "@/lib/sha";
import { TBILL_RATES } from "@/lib/rates-feed";
import { round2 } from "@/lib/money";

/**
 * Each test here pins a number that was, at some point, contradicting another
 * number on the same screen. They are grouped by the contradiction rather than
 * by module, because that is the shape of the bug: no single function was
 * wrong on its own terms, and every one of these shipped.
 */

describe("Fuliza: one screen, one APR", () => {
  /**
   * The tool's headline card said "~400%". The engine returned
   * (1 + 0.01083)^365 − 1 ≈ 4,999%, and the calculator's share button
   * broadcast THAT to WhatsApp. Twelve times apart, side by side.
   */
  it("reports the simple annualisation as the APR", () => {
    expect(FULIZA_APR).toBeCloseTo(FULIZA_DAILY_RATE * 365, 10);
    // The headline card claims ~400%; the engine must agree with it.
    expect(FULIZA_APR * 100).toBeGreaterThan(380);
    expect(FULIZA_APR * 100).toBeLessThan(410);
  });

  it("keeps the compounded figure, but never calls it the APR", () => {
    expect(FULIZA_ROLLED_ANNUAL_COST).toBeCloseTo(
      Math.pow(1 + FULIZA_DAILY_RATE, 365) - 1,
      10,
    );
    // It is a genuine and much larger number — that is the point of naming it
    // separately rather than deleting it.
    expect(FULIZA_ROLLED_ANNUAL_COST).toBeGreaterThan(FULIZA_APR * 10);
  });

  it("the APR is one a reader could derive from the fees shown", () => {
    // Borrow 600 for 30 days: fees / principal, scaled to a year.
    const r = calculateFulizaCost(600, 30);
    const impliedApr = (r.totalFee / 600) * (365 / 30);
    expect(r.annualisedApr).toBeCloseTo(impliedApr, 2);
  });

  it("returns both figures even on the zero-input guard path", () => {
    const zero = calculateFulizaCost(0, 0);
    expect(zero.annualisedApr).toBe(FULIZA_APR);
    expect(zero.rolledAnnualCost).toBe(FULIZA_ROLLED_ANNUAL_COST);
  });

  it("the comparison table's Fuliza APR matches its own repayment figure", () => {
    // The row used to show a 30-day repayment of ~1.32x principal beside an
    // APR of 4,999%, which that repayment cannot produce.
    const rows = compareLoanProducts(10_000, 1);
    const fuliza = rows.find((r) => r.name.startsWith("Fuliza"))!;
    expect(fuliza.apr).toBeCloseTo(FULIZA_APR, 10);
    // Scale on a 365-day year, matching FULIZA_APR. A 30-day month times 12
    // is a 360-day year and lands 1.4% low — the two conventions must not be
    // mixed, which is the whole lesson of this file.
    const impliedApr = (fuliza.totalInterest / 10_000) * (365 / 30);
    expect(fuliza.apr).toBeCloseTo(impliedApr, 2);
  });
});

describe("DhowCSD ladder: a plan CBK would actually accept", () => {
  /**
   * The tool advertised a KES 50,000 entry and split capital into thirds —
   * ~16,667 per bill, against a real per-bill minimum of KES 100,000. Every
   * bid a reader placed by following it would have been rejected.
   */
  it("takes the per-bill minimum from the feed, not a hardcoded guess", () => {
    expect(DHOWCSD_BILL_MINIMUM).toBe(TBILL_RATES[0].minInvestmentKES);
    expect(DHOWCSD_BILL_MINIMUM).toBeGreaterThanOrEqual(100_000);
  });

  it("requires enough capital that every rung clears the minimum", () => {
    expect(DHOWCSD_MINIMUM).toBe(DHOWCSD_BILL_MINIMUM * TBILL_RATES.length);
    const ladder = dhowcsdLadder(DHOWCSD_MINIMUM);
    for (const bucket of ladder.buckets) {
      expect(bucket.allocation).toBeGreaterThanOrEqual(DHOWCSD_BILL_MINIMUM);
    }
  });

  it("places nothing at the old 50,000 threshold, rather than something unbuyable", () => {
    // This used to assert that the smallest rung fell BELOW the minimum — i.e.
    // that the plan was unexecutable but still displayed. The allocator now
    // drops a rung it cannot place at all, which is the stronger behaviour:
    // no bid beats a bid CBK will reject.
    const ladder = dhowcsdLadder(50_000);
    expect(ladder.buckets).toHaveLength(0);
    expect(ladder.unallocatedKes).toBe(50_000);
    expect(DHOWCSD_MINIMUM).toBeGreaterThan(50_000);
  });

  it("never places a rung below the per-bill minimum, at any weighting", () => {
    // The guarantee that matters: whatever the reader does with the weights,
    // every rung shown is one CBK would accept.
    for (const weights of [
      { 91: 1, 182: 1, 364: 1 },
      { 91: 9, 182: 1, 364: 1 },
      { 91: 0, 182: 0, 364: 1 },
      { 91: 1, 182: 0, 364: 0 },
      { 91: 50, 182: 1, 364: 1 },
    ]) {
      for (const cap of [100_000, 250_000, 300_000, 1_000_000]) {
        const l = dhowcsdLadder(cap, weights);
        for (const b of l.buckets) {
          expect(b.allocation, `${cap} @ ${JSON.stringify(weights)}`)
            .toBeGreaterThanOrEqual(DHOWCSD_BILL_MINIMUM);
          expect(b.allocation % 50_000).toBe(0);
        }
        // Nothing is invented or lost.
        const placed = l.buckets.reduce((s, b) => s + b.allocation, 0);
        expect(placed + l.unallocatedKes).toBe(cap);
      }
    }
  });
});

describe("SHA: a control that changes the answer, or says why it doesn't", () => {
  const base = { grossMonthlyIncome: 60_000, familySize: 3, wantsPrivateCare: false } as const;

  it("marks a salaried assessment as the statutory rate", () => {
    const r = calculateShaHealth({ ...base, employmentType: "employed" });
    expect(r.isStatutoryRate).toBe(true);
  });

  it("marks non-salaried assessments as an estimate", () => {
    // The selector used to be decorative: employmentType was accepted and
    // never read, so all three options produced an identical answer presented
    // with identical confidence.
    for (const employmentType of ["self_employed", "informal"] as const) {
      const r = calculateShaHealth({ ...base, employmentType });
      expect(r.isStatutoryRate, employmentType).toBe(false);
    }
  });

  it("still returns the same best-estimate figure — only the framing differs", () => {
    // We do not invent a means-testing model we cannot verify. The number is
    // unchanged; the claim made about it is what got weaker.
    const employed = calculateShaHealth({ ...base, employmentType: "employed" });
    const informal = calculateShaHealth({ ...base, employmentType: "informal" });
    expect(informal.monthlyContribution).toBe(employed.monthlyContribution);
  });

  it("honours the statutory floor", () => {
    const r = calculateShaHealth({ ...base, employmentType: "employed", grossMonthlyIncome: 1_000 });
    expect(r.isAtFloor).toBe(true);
    expect(r.monthlyContribution).toBe(300);
  });
});

describe("round2 — the rounding primitive every engine sits on", () => {
  it("rounds to two places", () => {
    expect(round2(1.005)).toBeCloseTo(1.01, 10);
    expect(round2(2.344)).toBe(2.34);
    expect(round2(2.345)).toBeCloseTo(2.35, 10);
  });

  it("leaves whole numbers and zero alone", () => {
    expect(round2(0)).toBe(0);
    expect(round2(100)).toBe(100);
  });

  it("handles negatives without drifting away from zero", () => {
    expect(round2(-2.344)).toBe(-2.34);
    expect(Math.abs(round2(-0.001))).toBe(0);
  });
});
