import { describe, expect, it } from "vitest";

import {
  FULIZA_ACCESS_FEE_RATE,
  FULIZA_DAILY_FEE_BANDS,
  FULIZA_EXCISE_RATE,
  FULIZA_FREE_DAYS,
  FULIZA_GRACE_BALANCE_CEILING,
  FULIZA_MAX_LIMIT,
} from "../fuliza";
import { TARIFFS, tariffLine, tariffsDueForReview } from "../tariffs";

describe("tariff registry", () => {
  it("records a verification date that is not after the review date", () => {
    for (const t of Object.values(TARIFFS)) {
      expect(t.verifiedOn < t.reviewBy).toBe(true);
    }
  });

  it("names the module holding the constants it governs", () => {
    // A registry entry that cannot be traced to the numbers it describes is a
    // claim in prose, which is the defect this whole pattern exists to remove.
    for (const t of Object.values(TARIFFS)) {
      expect(t.constantsIn).toMatch(/^lib\/[a-z-]+\.ts$/);
      expect(t.url).toMatch(/^https:\/\//);
    }
  });

  it("is not due for review today", () => {
    // Not a staleness assertion — a check that the fixture is meaningful. If
    // this ever fails the fix is to re-read the provider's tariff, not to move
    // the date, and lib/tariffs.ts says so at the point it matters.
    expect(tariffsDueForReview()).toEqual([]);
  });

  it("fires once the clock passes a review date", () => {
    // The guard that matters. A staleness gate that cannot fire in the case it
    // exists to detect is worse than none, because it reads as reassurance.
    const dayAfter = "2027-03-01";
    expect(dayAfter > TARIFFS.fuliza.reviewBy).toBe(true);

    const due = tariffsDueForReview(["fuliza"], dayAfter);
    expect(due).toHaveLength(1);
    expect(due[0].product).toBe("Fuliza");
  });

  it("narrows to the tariffs a calculator actually prices on", () => {
    // A PAYE calculator must not warn about Fuliza. Passing no keys means "all
    // of them"; passing an empty list means "none", and those must not collapse
    // into each other.
    const wayPast = "2099-01-01";
    expect(tariffsDueForReview(undefined, wayPast).length).toBeGreaterThan(0);
    expect(tariffsDueForReview([], wayPast)).toEqual([]);
  });

  it("derives its attribution line rather than restating it", () => {
    const line = tariffLine(["fuliza"]);
    expect(line).toContain(TARIFFS.fuliza.governs);
    expect(line).toContain("Fuliza");
    expect(line).toContain("Safaricom");
  });
});

describe("the Fuliza tariff record against the constants it governs", () => {
  /*
   * These pin the constants the 11 August 2026 verification actually confirmed
   * against Safaricom's published tariff. They are not testing arithmetic —
   * fuliza.test.ts does that. They exist so that changing a band is a
   * deliberate act that fails here first and sends the changer to the registry
   * to record a fresh verification, rather than a silent edit that leaves
   * verifiedOn asserting something untrue.
   */
  it("prices the bands that were verified", () => {
    expect(FULIZA_DAILY_FEE_BANDS.map((b) => [b.upTo, b.fee])).toEqual([
      [100, 0],
      [500, 2.5],
      [1_000, 5],
      [1_500, 18],
      [2_500, 20],
      [70_000, 25],
    ]);
  });

  it("keeps the access fee, excise and grace terms that were verified", () => {
    expect(FULIZA_ACCESS_FEE_RATE).toBe(0.01);
    expect(FULIZA_EXCISE_RATE).toBe(0.2);
    expect(FULIZA_GRACE_BALANCE_CEILING).toBe(1_000);
    expect(FULIZA_FREE_DAYS).toBe(3);
    expect(FULIZA_MAX_LIMIT).toBe(70_000);
  });

  it("keeps the top band and the facility ceiling in step", () => {
    // The comment in lib/fuliza.ts explains why: the loan comparison table once
    // offered Fuliza on a Ksh 200,000 loan, where a flat Ksh 25/day looked
    // cheaper than a SACCO. A facility you cannot draw is not a quote. If the
    // ceiling ever moves without the band following, that returns.
    const top = FULIZA_DAILY_FEE_BANDS[FULIZA_DAILY_FEE_BANDS.length - 1];
    expect(top.upTo).toBe(FULIZA_MAX_LIMIT);
  });

  it("stays regressive in the direction the copy claims", () => {
    // The record's note says the smallest borrowings carry the highest
    // annualised cost, and page copy is built on that. It holds only while the
    // fee is a flat sum per band. A percentage tariff would invert it silently.
    const fees = FULIZA_DAILY_FEE_BANDS.map((b) => b.fee);
    const ascending = fees.every((f, i) => i === 0 || f >= fees[i - 1]);
    expect(ascending).toBe(true);

    // Flat-per-band means fee-to-balance falls as the balance rises.
    const rateAt = (b: { upTo: number; fee: number }) => b.fee / b.upTo;
    const charged = FULIZA_DAILY_FEE_BANDS.filter((b) => b.fee > 0);
    const smallest = rateAt(charged[0]);
    const largest = rateAt(charged[charged.length - 1]);
    expect(smallest).toBeGreaterThan(largest);
  });
});
