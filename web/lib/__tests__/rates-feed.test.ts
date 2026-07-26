import { describe, it, expect } from "vitest";
import {
  RATES,
  SUPPORTED_SCHEMA,
  STALE_AFTER_DAYS,
  TBILL_RATES,
  attribution,
  daysSinceRefresh,
  isStale,
  tbillRate,
} from "@/lib/rates-feed";
import { dhowcsdLadder, BANK_SAVINGS_BASELINE } from "@/lib/market-2026";

/**
 * The bug these tests exist to prevent is not hypothetical — it shipped.
 *
 * The DhowCSD ladder held three hardcoded CBK quotes (8.83 / 8.96 / 8.99) and
 * projected income straight from them. A CBK quote is a discount rate, not a
 * return: the true gross yield is higher, and 15% withholding tax then makes
 * the net lower. The ladder was therefore wrong in both directions at once and
 * overstated a Ksh 300,000 ladder by roughly Ksh 2,300 a year.
 *
 * These tests pin the corrected behaviour hard enough that a well-meaning
 * refactor cannot reintroduce it.
 */

describe("the snapshot is a contract we understand", () => {
  it("declares the schema this build was written against", () => {
    expect(RATES.schema).toBe(SUPPORTED_SCHEMA);
  });

  it("names its publisher, so a figure on screen is traceable", () => {
    expect(RATES.publisher).toBe("Mwangaza Yield");
    expect(attribution()).toMatch(/CBK auction of .+, via Mwangaza Yield/);
  });

  it("carries all three DhowCSD tenors", () => {
    expect(TBILL_RATES.map((r) => r.tenorDays)).toEqual([91, 182, 364]);
    expect(tbillRate(91)).not.toBeNull();
    expect(tbillRate(9999)).toBeNull();
  });
});

describe("THE TRAP: a CBK quote is not a return", () => {
  it("keeps net below quoted below gross, for every tenor", () => {
    // If this ordering ever inverts, either the upstream computation changed
    // meaning or someone has substituted a quote for a yield again.
    for (const r of TBILL_RATES) {
      expect(r.grossEAY, `${r.tenorDays}d`).toBeGreaterThan(r.quotedDiscountRate);
      expect(r.netEAY, `${r.tenorDays}d`).toBeLessThan(r.quotedDiscountRate);
      expect(r.netEAY, `${r.tenorDays}d`).toBeLessThan(r.grossEAY);
    }
  });

  it("applies withholding tax at the Kenyan T-bill rate", () => {
    for (const r of TBILL_RATES) {
      expect(r.whtRate).toBe(0.15);
      // net ≈ gross × (1 − wht), within rounding of the published figures.
      expect(r.netEAY).toBeCloseTo(r.grossEAY * 0.85, 1);
    }
  });

  it("the gap is large enough that using the quote would matter", () => {
    for (const r of TBILL_RATES) {
      expect(r.quotedDiscountRate - r.netEAY).toBeGreaterThan(0.5);
    }
  });
});

describe("the ladder projects from net yields", () => {
  const CAPITAL = 300_000;
  const ladder = dhowcsdLadder(CAPITAL);

  it("uses each tenor's net yield, not its quote", () => {
    for (const bucket of ladder.buckets) {
      const rate = tbillRate(bucket.days)!;
      expect(bucket.yieldRate).toBeCloseTo(rate.netEAY / 100, 10);
      expect(bucket.quotedRate).toBeCloseTo(rate.quotedDiscountRate / 100, 10);
      expect(bucket.grossRate).toBeCloseTo(rate.grossEAY / 100, 10);
      // The projection must follow the net rate specifically.
      expect(bucket.annualYieldKes).toBeCloseTo(bucket.allocation * bucket.yieldRate, 6);
    }
  });

  it("comes in BELOW what the old hardcoded quotes claimed", () => {
    // The regression guard. Old constants: 0.0883 / 0.0896 / 0.0899.
    const OLD = { 91: 0.0883, 182: 0.0896, 364: 0.0899 };
    const third = CAPITAL / 3;
    const oldClaim = third * OLD[91] + third * OLD[182] + third * OLD[364];
    expect(ladder.ladderAnnualKes).toBeLessThan(oldClaim);
    // Measured on the shipped snapshot: about Ksh 2,300 a year on 300k.
    expect(oldClaim - ladder.ladderAnnualKes).toBeGreaterThan(1_500);
  });

  it("splits capital evenly and accounts for all of it", () => {
    const allocated = ladder.buckets.reduce((s, b) => s + b.allocation, 0);
    expect(allocated).toBeCloseTo(CAPITAL, 6);
    for (const b of ladder.buckets) expect(b.allocation).toBeCloseTo(CAPITAL / 3, 6);
  });

  it("blends the net yields and still beats the bank baseline", () => {
    const expected =
      ladder.buckets.reduce((s, b) => s + b.yieldRate, 0) / ladder.buckets.length;
    expect(ladder.blendedYield).toBeCloseTo(expected, 10);
    expect(ladder.blendedYield).toBeGreaterThan(BANK_SAVINGS_BASELINE);
    expect(ladder.advantageKes).toBeCloseTo(ladder.ladderAnnualKes - ladder.bankAnnualKes, 6);
    expect(ladder.advantageKes).toBeGreaterThan(0);
  });

  it("scales linearly with capital", () => {
    const doubled = dhowcsdLadder(CAPITAL * 2);
    expect(doubled.ladderAnnualKes).toBeCloseTo(ladder.ladderAnnualKes * 2, 6);
    expect(doubled.blendedYield).toBeCloseTo(ladder.blendedYield, 10);
  });
});

describe("freshness is surfaced, not assumed", () => {
  it("dates the figures from the feed's own stamp", () => {
    expect(RATES.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    const at = new Date(RATES.generatedAt);
    expect(Number.isNaN(at.getTime())).toBe(false);
  });

  it("counts age from the refresh, and calls old data old", () => {
    const at = new Date(RATES.generatedAt);
    const justAfter = new Date(at.getTime() + 86_400_000);
    expect(daysSinceRefresh(justAfter)).toBe(1);
    expect(isStale(justAfter)).toBe(false);

    const wayLater = new Date(at.getTime() + (STALE_AFTER_DAYS + 2) * 86_400_000);
    expect(isStale(wayLater)).toBe(true);
  });

  it("every rate names the auction it came from", () => {
    for (const r of TBILL_RATES) {
      expect(r.auctionDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});
