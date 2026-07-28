import { describe, it, expect } from "vitest";
import { calculateFulizaCost, fulizaDailyFee } from "@/lib/fuliza";
import { compareLoanProducts } from "@/lib/loan-comparison";
import {
  DHOWCSD_BILL_MINIMUM,
  DHOWCSD_MINIMUM,
  KENYAN_INFLATION,
  dhowcsdLadder,
} from "@/lib/market-2026";
import { calculateShaHealth } from "@/lib/sha";
import {
  RATES,
  TBILL_RATES,
  currentInflation,
  inflationAttribution,
} from "@/lib/rates-feed";
import { CURRENT_INFLATION } from "@/lib/journey";
import { DEFAULT_INFLATION_RATE } from "@/lib/projections";
import { round2 } from "@/lib/money";

/**
 * Each test here pins a number that was, at some point, contradicting another
 * number on the same screen. They are grouped by the contradiction rather than
 * by module, because that is the shape of the bug: no single function was
 * wrong on its own terms, and every one of these shipped.
 */

describe("Fuliza: one screen, one APR", () => {
  /**
   * This block used to police a contradiction between two annualisations of a
   * flat 1.083%-per-day model — "~400%" on the card against ~4,999% in the
   * share message. Both are now gone, because the model underneath them was
   * wrong: Fuliza charges a flat shilling fee per balance band, not a
   * percentage, and gives three free days at or below Ksh 1,000.
   *
   * The contradiction this file exists to catch has therefore moved. It is no
   * longer "two different annualisations of one rate" but "an APR that does
   * not follow from the fees on the same screen", which is what the tests
   * below check — against a tariff where the APR legitimately differs by band.
   */
  it("the APR is one a reader could derive from the fees shown", () => {
    /* Borrow 600 for 30 days. The APR annualises the MAINTENANCE fee over the
     * days it is actually charged — the access fee is a one-off, and rolling
     * it into an annual rate would make a one-day borrowing look like a
     * different product from a thirty-day one at the same price. */
    const r = calculateFulizaCost(600, 30);
    const maintenance = r.totalFee - r.accessFee;
    const impliedApr = (maintenance / 600) * (365 / r.chargeableDays) * 100;
    expect(r.annualisedApr).toBeCloseTo(impliedApr, 2);
  });

  it("charges nothing on the zero-input guard path", () => {
    const zero = calculateFulizaCost(0, 0);
    expect(zero.totalFee).toBe(0);
    expect(zero.accessFee).toBe(0);
    expect(zero.annualisedApr).toBe(0);
  });

  /**
   * There is no single Fuliza APR, and pretending otherwise was the deeper
   * error in the old model.
   *
   * The fee is a flat sum per balance band, so the annualised cost FALLS
   * steeply as the principal rises — roughly 730% on Ksh 150 against 110% on
   * Ksh 10,000. The smallest borrowers pay by far the most, and they are who
   * this tool is for.
   */
  it("shows the tariff is regressive rather than one flat rate", () => {
    const small = calculateFulizaCost(150, 30).annualisedApr;
    const large = calculateFulizaCost(10_000, 30).annualisedApr;
    expect(small).toBeGreaterThan(large * 3);
  });

  /**
   * The cliff at Ksh 1,000, which the old percentage model could not express.
   *
   * One shilling more than 1,000 loses the three free days AND jumps from Ksh
   * 5 a day to Ksh 18 before excise. Borrowing 1,001 for three days costs
   * several times what borrowing 1,000 does.
   */
  it("prices the cliff either side of Ksh 1,000", () => {
    expect(fulizaDailyFee(1_000)).toBeLessThan(fulizaDailyFee(1_001));
    const under = calculateFulizaCost(1_000, 3);
    const over = calculateFulizaCost(1_001, 3);
    expect(under.chargeableDays).toBe(0);
    expect(over.chargeableDays).toBe(3);
    expect(over.totalFee).toBeGreaterThan(under.totalFee * 3);
  });

  it("the comparison table's Fuliza APR matches its own repayment figure", () => {
    // The row used to show a 30-day repayment of ~1.32x principal beside an
    // APR of 4,999%, which that repayment cannot produce.
    const rows = compareLoanProducts(10_000, 1);
    const fuliza = rows.find((r) => r.name.startsWith("Fuliza"))!;
    const cost = calculateFulizaCost(10_000, 30);
    expect(fuliza.apr).toBeCloseTo(cost.annualisedApr / 100, 10);
    // Derived from the maintenance fee over the days it is charged, on a
    // 365-day year. A 30-day month times 12 is a 360-day year and lands 1.4%
    // low — the two conventions must not be mixed, which is this file's point.
    const maintenance = cost.totalFee - cost.accessFee;
    const impliedApr = (maintenance / 10_000) * (365 / cost.chargeableDays);
    expect(fuliza.apr).toBeCloseTo(impliedApr, 2);
  });
});

describe("DhowCSD ladder: a plan CBK would actually accept", () => {
  /**
   * The tool advertised a Ksh 50,000 entry and split capital into thirds —
   * ~16,667 per bill, against a real per-bill minimum of Ksh 100,000. Every
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

describe("inflation: one app, one published rate", () => {
  /**
   * Three hardcoded figures used to answer the same question. The journey
   * funnel said 6.7%, the FIRE calculator said 6.4%, the projection engine
   * defaulted to 6.5% — and the first two were rendered to the reader as
   * "inflation runs at X%". A reader who visited two pages was told two
   * different things about the same month, and none of the three was sourced
   * or dated. Meanwhile the rates feed had been carrying a tracked, dated,
   * attributed CPI print the whole time.
   */
  it("quotes the published print, not a house estimate", () => {
    expect(CURRENT_INFLATION).toBeCloseTo(currentInflation(), 12);
    expect(RATES.macro.inflation).not.toBeNull();
    expect(CURRENT_INFLATION * 100).toBeCloseTo(RATES.macro.inflation!.value, 10);
  });

  it("gives the FIRE calculator and the journey funnel the same number", () => {
    // These were 0.064 and 0.067. The whole bug in one assertion.
    expect(KENYAN_INFLATION).toBe(CURRENT_INFLATION);
  });

  it("names its source and its date wherever it is quoted", () => {
    const a = inflationAttribution();
    expect(a).toContain(RATES.macro.inflation!.source);
    expect(a).toMatch(/20\d\d/);
    expect(a).toContain("Mwangaza Yield");
  });

  /**
   * The long-run projection default is NOT the same question and stays
   * separate on purpose: anchoring a thirty-year retirement plan to whichever
   * month the user opened the app would let the plan swing on noise. This
   * pins that it is a deliberate long-run figure in a sane band, not a stale
   * copy of the current print that someone forgot to wire up.
   */
  it("keeps the long-run projection assumption distinct but plausible", () => {
    expect(DEFAULT_INFLATION_RATE).toBeGreaterThan(0.03);
    expect(DEFAULT_INFLATION_RATE).toBeLessThan(0.12);
  });
});
