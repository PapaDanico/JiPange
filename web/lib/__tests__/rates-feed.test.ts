import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
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

/**
 * Tighter than the UI's staleness notice on purpose: we want to know the
 * pipeline has stopped a week before a reader would see a warning about it.
 * Wide enough to absorb the weekend, since the sync runs weekdays only.
 */
const SNAPSHOT_MAX_AGE_DAYS = 7;

describe("the snapshot is a contract we understand", () => {
  it("declares the schema this build was written against", () => {
    expect(RATES.schema).toBe(SUPPORTED_SCHEMA);
  });

  it("keeps the sync script's idea of the schema tied to this one", () => {
    /* scripts/sync-rates.mjs held its own literal `SUPPORTED_SCHEMA = 1`. Two
     * copies of a cross-repo contract kept in step by memory, on the seam where
     * drift is hardest to see — the other side of it lives in a different
     * repository.
     *
     * The failure is quiet in both directions. Bump this file and forget the
     * script, and the script refuses every new feed while the app serves a
     * snapshot that stops moving: no error, just rates going silently stale.
     * Bump the script and forget this file, and the script writes a snapshot
     * the app throws on at build time, after committing it.
     *
     * The script now reads the number out of rates-feed.ts. This pins that. */
    const script = readFileSync(
      new URL("../../../scripts/sync-rates.mjs", import.meta.url),
      "utf8"
    );
    expect(
      script,
      "the sync script has its own hardcoded schema number again"
    ).not.toMatch(/const SUPPORTED_SCHEMA\s*=\s*\d/);
    expect(
      script,
      "the sync script no longer reads the schema from rates-feed.ts"
    ).toMatch(/SUPPORTED_SCHEMA[\s\S]{0,600}rates-feed\.ts/);
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

  /**
   * The shipped snapshot itself must be fresh, not merely the function that
   * judges freshness.
   *
   * Everything above tests isStale() against synthetic dates, which it passes
   * whether or not anyone is still refreshing the file. That is the gap a dead
   * sync falls through: the workflow stops, the snapshot ages, every test stays
   * green, and the app quietly serves a fixed rate that the code describes as
   * live. The MMF assumption now derives from these figures, so a frozen
   * snapshot is a hardcoded yield wearing a live number's clothes — precisely
   * what removing the four typed MMF rates was meant to end.
   *
   * It failed once already, and quietly: the sync runs at 05:00 UTC on the
   * assumption that Mwangaza's 03:00 scrape has finished, but GitHub's
   * scheduled runs drift under load. On 27 July the upstream refresh landed at
   * 06:33, so the sync had already run and taken figures two days old. Nothing
   * anywhere reported it.
   *
   * A red build is the alarm. If this fails, run the "Sync rates from Mwangaza
   * Yield" workflow manually and find out why the schedule stopped working.
   */
  it("ships a snapshot that something is still refreshing", () => {
    const age = daysSinceRefresh();
    expect(
      age,
      `rates-snapshot.json is ${age} days old (generated ${RATES.generatedAt}). ` +
        "The sync workflow has not landed a refresh — run it manually and check " +
        "whether its schedule is still firing before this reaches the UI's " +
        `${STALE_AFTER_DAYS}-day stale notice.`
    ).toBeLessThanOrEqual(SNAPSHOT_MAX_AGE_DAYS);
  });

  it("every rate names the auction it came from", () => {
    for (const r of TBILL_RATES) {
      expect(r.auctionDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("documents the feed at a URL an outside reader can actually open", () => {
    /* This file is in a PUBLIC repository and used to link the contract as
     * github.com/PapaDanico/Mwangaza-Yield/blob/main/docs/RATES-FEED.md — into
     * a PRIVATE repo. Every third party the feed exists for got a 404 on the
     * document describing it, and from inside the organisation the link looked
     * fine. Asserted here because this repo is where the broken link lived. */
    const src = readFileSync(new URL("../rates-feed.ts", import.meta.url).pathname, "utf8");
    expect(src, "the contract link points into a repository outsiders cannot read").not.toMatch(
      /github\.com\/PapaDanico\/Mwangaza-Yield/
    );
    expect(src).toContain("https://mwangazayield.org/data/RATES-FEED.md");
  });
});
