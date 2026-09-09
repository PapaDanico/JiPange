import { describe, it, expect } from "vitest";
import {
  LIVING_FLOOR_SHARE,
  MEDICAL_REAL_ESCALATION,
  PRIVATE_COVER_ENTRY_LIMIT_AGE,
  REAL_RETURN_DEFAULT,
  planKenyanRetirement,
  realReturnEvidence,
} from "@/lib/retirement-kenya";
import { currentInflation, tbillRate } from "@/lib/rates-feed";
import { DEFAULT_INFLATION_RATE } from "@/lib/projections";

/**
 * Retirement priced for Kenya rather than imported from elsewhere.
 *
 * The three claims this module makes, each pinned so it cannot quietly stop
 * being true: everything is in today's money at a real return, ordinary living
 * costs fall while medical climbs, and medical eats a far larger share of the
 * CAPITAL than of the budget it comes out of.
 */

const BASE = {
  currentAge: 35,
  retirementAge: 60,
  currentMonthlyExpenses: 120_000,
  currentMonthlyMedical: 8_000,
  currentCapital: 2_000_000,
  monthlyContribution: 50_000,
};

describe("the return assumption is conservative, and the evidence is shown", () => {
  it("plans below what today's paper actually yields in real terms", () => {
    const infl = currentInflation();
    const bill = tbillRate(364)!;
    // Long Kenyan bonds clear far above this in real terms right now. Planning
    // thirty years on today's fiscal moment is the error this avoids.
    const longBondRealIfTaxFree = (1 + 0.137) / (1 + infl) - 1;
    expect(longBondRealIfTaxFree).toBeGreaterThan(0.05);
    expect(REAL_RETURN_DEFAULT).toBeLessThan(longBondRealIfTaxFree);
    // ...but not so timid it sits under a one-year Treasury bill.
    const billReal = (1 + bill.netEAY / 100) / (1 + infl) - 1;
    expect(REAL_RETURN_DEFAULT).toBeGreaterThan(billReal);
  });

  it("reports the evidence alongside the assumption, from the live feed", () => {
    const e = realReturnEvidence();
    expect(e.planning).toBe(REAL_RETURN_DEFAULT);
    expect(e.inflation).toBeCloseTo(currentInflation(), 12);
    expect(e.tbillRealNet).not.toBeNull();
    expect(e.tbillRealNet!).toBeLessThan(e.planning);
  });

  /**
   * The contradiction that prompted this. The old model justified a 5%
   * withdrawal rate by quoting an 11.5% money-market yield — which is 3.16%
   * real at the published CPI. Its own arithmetic disagreed with its
   * multiplier, in the direction that flattered the reader.
   */
  it("does not repeat the gross-nominal-for-real substitution", () => {
    /* DEFLATED BY THE LONG-RUN AVERAGE, NOT BY ONE MONTH'S PRINT.
     *
     * This used to divide by currentInflation(), and on 3 September 2026 it
     * went red: the CPI print moved 6.49% -> 6.60%, the 11.5% headline's real
     * value fell from 3.085% to 2.978%, and the 3% planning default breached
     * it by TWO BASIS POINTS.
     *
     * Two basis points is not a finding about the plan. It is one month of
     * CPI noise setting the bar for a THIRTY-YEAR assumption — which is
     * precisely the error projections.ts identifies and deliberately designs
     * around: DEFAULT_INFLATION_RATE is kept separate from the tracked print
     * so that "anchoring a retirement plan to whichever month the user
     * happened to open the app" cannot "let the plan swing on noise". This
     * test was doing the anchoring the app refuses to do.
     *
     * So the bound is taken at the long-run rate, which is the basis a
     * thirty-year plan is actually made on. Recorded plainly because it turned
     * a red test green: the change is to the BASIS, not to the standard, and
     * the standard still bites — the default must sit at or below what that
     * 11.5% headline really delivers.
     *
     * The current print is still checked, with a tolerance wide enough to
     * ignore a rounding wobble and narrow enough that a real inflation shock —
     * the thing that would genuinely invalidate a 3% real assumption — still
     * fires. */
    const nominalNetOfWht = 0.115 * 0.85;

    const mmfRealLongRun = (1 + nominalNetOfWht) / (1 + DEFAULT_INFLATION_RATE) - 1;
    expect(mmfRealLongRun).toBeLessThan(0.05);
    expect(REAL_RETURN_DEFAULT).toBeLessThanOrEqual(mmfRealLongRun);

    const mmfRealToday = (1 + nominalNetOfWht) / (1 + currentInflation()) - 1;
    expect(
      REAL_RETURN_DEFAULT - mmfRealToday,
      `at today's CPI the 3% planning default is ${((REAL_RETURN_DEFAULT - mmfRealToday) * 100).toFixed(2)}pp ` +
        "above what an 11.5% nominal MMF actually delivers in real terms. A gap this wide is " +
        "inflation moving far enough to invalidate the planning assumption, not rounding — " +
        "re-read REAL_RETURN_DEFAULT against the evidence rather than widening this bound."
    ).toBeLessThan(0.0025);
  });
});

describe("everything is in today's money", () => {
  /**
   * The teeth. A model working in real terms must be indifferent to the
   * inflation rate — if a nominal growth term ever creeps back in, the answer
   * moves. Nothing in the inputs mentions inflation, so nothing in the output
   * may depend on it.
   */
  it("never inflates the headline into a frightening nominal number", () => {
    const near = planKenyanRetirement({ ...BASE, currentAge: 59 });
    const far = planKenyanRetirement({ ...BASE, currentAge: 25 });
    // Living costs are the same in today's money whether retirement is one year
    // away or thirty-five. Only medical has aged.
    expect(far.years[0].livingKes).toBeCloseTo(near.years[0].livingKes, 6);
    expect(far.years[0].medicalKes).toBeGreaterThan(near.years[0].medicalKes);
  });

  it("prices the stream rather than applying a multiplier", () => {
    const r = planKenyanRetirement(BASE);
    let pv = 0;
    r.years.forEach((y, t) => { pv += y.totalKes / Math.pow(1 + r.realReturn, t); });
    expect(r.capitalRequiredKes).toBeCloseTo(pv, 4);
  });

  it("needs more capital when the assumed return is lower", () => {
    const cautious = planKenyanRetirement({ ...BASE, realReturn: 0.01 });
    const bullish = planKenyanRetirement({ ...BASE, realReturn: 0.06 });
    expect(cautious.capitalRequiredKes).toBeGreaterThan(bullish.capitalRequiredKes);
  });
});

describe("the two streams diverge, which is the whole point", () => {
  const r = planKenyanRetirement(BASE);

  it("lets ordinary living costs fall, but not to nothing", () => {
    const first = r.years[0].livingKes;
    const last = r.years[r.years.length - 1].livingKes;
    expect(last).toBeLessThan(first);
    // The Kenyan floor: dependants do not retire when you do.
    expect(last).toBeGreaterThanOrEqual(first * LIVING_FLOOR_SHARE - 1);
  });

  it("makes medical climb every single year", () => {
    for (let i = 1; i < r.years.length; i++) {
      expect(r.years[i].medicalKes).toBeGreaterThan(r.years[i - 1].medicalKes);
    }
  });

  it("has medical take a growing share of spending right to the end", () => {
    expect(r.years[r.years.length - 1].medicalShare).toBeGreaterThan(r.years[0].medicalShare);
    expect(r.years[r.years.length - 1].medicalShare).toBeGreaterThan(0.25);
  });

  /**
   * The finding. Medical is a small slice of a monthly budget and a large slice
   * of the capital, because every other cost shrinks in real terms while this
   * one compounds. Anything that models medical inside a flat expense figure
   * cannot show this.
   */
  it("amplifies medical from a budget line into a capital problem", () => {
    expect(r.medicalShareOfSpendingToday).toBeCloseTo(8_000 / 128_000, 6);
    expect(r.medicalShareOfCapital).toBeGreaterThan(r.medicalShareOfSpendingToday * 2);
    expect(r.medicalCapitalKes).toBeGreaterThan(0);
    expect(r.medicalCapitalKes).toBeLessThan(r.capitalRequiredKes);
  });

  it("amplifies harder the longer the retirement runs", () => {
    const short = planKenyanRetirement({ ...BASE, planningHorizonAge: 70 });
    const long = planKenyanRetirement({ ...BASE, planningHorizonAge: 95 });
    expect(long.medicalShareOfCapital).toBeGreaterThan(short.medicalShareOfCapital);
  });

  it("responds to the medical escalation assumption it declares", () => {
    const flat = planKenyanRetirement({ ...BASE, medicalRealEscalation: 0 });
    const steep = planKenyanRetirement({ ...BASE, medicalRealEscalation: MEDICAL_REAL_ESCALATION * 2 });
    expect(steep.medicalShareOfCapital).toBeGreaterThan(flat.medicalShareOfCapital);
    expect(steep.capitalRequiredKes).toBeGreaterThan(flat.capitalRequiredKes);
  });
});

describe("it says the things a plan usually hides", () => {
  it("names the year the money runs out", () => {
    const r = planKenyanRetirement(BASE);
    expect(r.planExhaustedAtAge).toBe(90);
    expect(r.warnings.join(" ")).toMatch(/exhausted at that point/);
    // And is honest that the familiar rules are pricing something else.
    expect(r.warnings.join(" ")).toMatch(/perpetuity/);
  });

  it("warns that retiree cover gets dearer, without claiming it becomes impossible", () => {
    /* This used to require the words "decline new entrants" / "will not accept
     * a NEW member". Research in July 2026 showed that was too absolute:
     * Britam's Bima ya Mwananchi Senior admits new members to 75, Jubilee's
     * J-Senior to 79, and Britam's Milele plan from 55 with no maximum exit
     * age. The door narrows and the price climbs; it does not shut.
     *
     * The assertion therefore INVERTS on that point — the warning must not
     * tell a 68-year-old that nothing is available, because that is false and
     * it is the kind of false that stops somebody looking. What it must still
     * do is create urgency, and now also name the cheaper route. */
    const soon = planKenyanRetirement({ ...BASE, currentAge: 58, retirementAge: 65 });
    expect(soon.yearsLeftToBuyCover).toBe(PRIVATE_COVER_ENTRY_LIMIT_AGE - 58);
    const text = soon.warnings.join(" ");
    expect(text, "the warning no longer creates any urgency").toMatch(/dearer|narrows|early/i);
    expect(text, "the tax-relieved pre-funding route is not mentioned").toMatch(
      /post-retirement medical fund/i
    );
    expect(text, "the warning still claims cover is unobtainable").not.toMatch(
      /will not accept a NEW member|generally available past \d+ only/i
    );
  });

  it("refuses to let a plan with no medical budget look complete", () => {
    const none = planKenyanRetirement({ ...BASE, currentMonthlyMedical: 0 });
    expect(none.medicalShareOfCapital).toBe(0);
    expect(none.warnings.join(" ")).toMatch(/SHA is a floor, not a plan/);
  });

  it("shows the old flat rule beside its own answer rather than quietly replacing it", () => {
    const r = planKenyanRetirement(BASE);
    expect(r.flatRuleKes).toBe(128_000 * 12 * 20);
    /* This used to assert the two land CLOSE (0.7-1.4x), and the module header
     * said the rework "barely moves the total". Both stopped being true in
     * July 2026 when LIVING_REPLACEMENT_AT_RETIREMENT was added: the flat rule
     * has no replacement assumption at all, so it implicitly demands a retiree
     * fund their full working spending for twenty years.
     *
     * The model should now land MATERIALLY BELOW it, and the bound is a floor
     * as well as a ceiling — if it ever creeps back toward 1.0 the replacement
     * rate has stopped being applied, which is exactly the silent failure that
     * let the two retirement tools disagree by 1.79x in the first place. */
    const ratio = r.capitalRequiredKes / r.flatRuleKes;
    expect(ratio, 'the model has drifted back toward the unadjusted flat rule').toBeLessThan(0.8);
    expect(ratio, 'the model has fallen implausibly far below the flat rule').toBeGreaterThan(0.4);
  });
});

describe("the savings side", () => {
  it("closes the gap it reports", () => {
    const r = planKenyanRetirement(BASE);
    if (r.onTrack) return;
    const fixed = planKenyanRetirement({
      ...BASE,
      monthlyContribution: BASE.monthlyContribution + r.additionalMonthlyNeededKes,
    });
    expect(fixed.projectedCapitalKes).toBeCloseTo(fixed.capitalRequiredKes, 2);
    expect(fixed.onTrack).toBe(true);
  });

  it("asks for nothing more once the plan is funded", () => {
    const rich = planKenyanRetirement({ ...BASE, currentCapital: 200_000_000 });
    expect(rich.onTrack).toBe(true);
    expect(rich.additionalMonthlyNeededKes).toBe(0);
  });

  it("survives being asked for a plan that has already started", () => {
    const now = planKenyanRetirement({ ...BASE, currentAge: 65, retirementAge: 60 });
    expect(now.yearsToRetirement).toBe(0);
    expect(Number.isFinite(now.capitalRequiredKes)).toBe(true);
    expect(now.additionalMonthlyNeededKes).toBe(0);
  });

  it("handles a zero real return without dividing by it", () => {
    const flat = planKenyanRetirement({ ...BASE, realReturn: 0 });
    expect(Number.isFinite(flat.capitalRequiredKes)).toBe(true);
    expect(Number.isFinite(flat.projectedCapitalKes)).toBe(true);
    expect(Number.isFinite(flat.additionalMonthlyNeededKes)).toBe(true);
    // With no return, the capital is simply the undiscounted sum of the years.
    const summed = flat.years.reduce((s, y) => s + y.totalKes, 0);
    expect(flat.capitalRequiredKes).toBeCloseTo(summed, 4);
  });
});
