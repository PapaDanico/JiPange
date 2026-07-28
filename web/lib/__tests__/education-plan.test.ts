import { describe, it, expect } from "vitest";
import {
  FEE_ANCHORS,
  DEFAULT_FEE_ESCALATION,
  FEE_ESCALATION_TYPICAL_RANGE,
  LAST_GRADE_INDEX,
  gradeIndex,
  feeAnchor,
  buildChildPlan,
  buildHouseholdPlan,
  simulateFund,
  solveLevelContribution,
  interestContributionKES,
  DEFAULT_LEAD_MONTHS,
  shareOfNetPayPct,
} from "../education-plan";
import { CBC_GRADES } from "../cbc-grades";
import { solveMonthlyContribution } from "../savings-goal";
import { SENIOR_SCHOOL_BOARDING_ANNUAL_KES, SENIOR_SCHOOL_DAY_ANNUAL_KES } from "../tool-stats";

/** Fixed so escalation arithmetic is checkable by hand, not by the clock. */
const AS_OF = 2026;
const opts = { asOfYear: AS_OF };

describe("the fee anchors", () => {
  it("has entries, so every loop below is checking something", () => {
    expect(FEE_ANCHORS.length).toBeGreaterThanOrEqual(5);
  });

  it("attributes every anchor to a named school or a Ministry circular", () => {
    for (const a of FEE_ANCHORS) {
      expect(a.source.length, `${a.key} has no source`).toBeGreaterThan(20);
      expect(a.annualKES, `${a.key} has no fee`).toBeGreaterThan(0);
      // A source that names nobody is the defect this module was written to
      // avoid: a market average nobody published.
      expect(a.source, `${a.key} cites no institution`).toMatch(
        /Ministry|Academy|School|Braeburn|International/i
      );
    }
  });

  it("reuses the Ministry figures the rest of the codebase already carries", () => {
    // Two constants for one Ministry circular is how they drift apart.
    expect(feeAnchor("public-boarding")!.annualKES).toBe(SENIOR_SCHOOL_BOARDING_ANNUAL_KES);
    expect(feeAnchor("public-day")!.annualKES).toBe(SENIOR_SCHOOL_DAY_ANNUAL_KES);
  });

  it("marks exactly the statutory ones statutory", () => {
    const statutory = FEE_ANCHORS.filter((a) => a.statutory).map((a) => a.key);
    expect(statutory).toEqual(["public-day", "public-boarding"]);
  });

  it("keeps the default escalation inside the range it claims to come from", () => {
    expect(DEFAULT_FEE_ESCALATION).toBeGreaterThanOrEqual(FEE_ESCALATION_TYPICAL_RANGE.low);
    expect(DEFAULT_FEE_ESCALATION).toBeLessThanOrEqual(FEE_ESCALATION_TYPICAL_RANGE.high);
  });

  /**
   * The number that is deliberately absent.
   *
   * An education-CPI print of 18.3% is in circulation and could not be traced
   * to a KNBS release. If somebody later adopts it as the default, they should
   * do so having read the comment in education-plan.ts — not by typing it in
   * because it sounded authoritative. This fails loudly if it appears.
   */
  it("has not quietly adopted the untraceable education-CPI figure", () => {
    expect(DEFAULT_FEE_ESCALATION).not.toBeCloseTo(0.183, 3);
  });
});

describe("one child's schedule", () => {
  it("covers every remaining year of school, including this one", () => {
    // The existing calculator starts at the next CBC transition and omits
    // everything before it. For a Grade 3 child that silently drops four
    // years of primary-school fees a private-school parent is already paying.
    const plan = buildChildPlan({ gradeValue: "grade3", annualFeeTodayKES: 300_000 }, opts);
    expect(plan.years.length).toBe(LAST_GRADE_INDEX - gradeIndex("grade3") + 1);
    expect(plan.years[0].gradeLabel).toContain("Grade 3");
    expect(plan.years[0].calendarYear).toBe(AS_OF);
    expect(plan.years[plan.years.length - 1].gradeLabel).toContain("Grade 12");
  });

  it("runs fourteen years from PP1", () => {
    const plan = buildChildPlan({ gradeValue: "pp1", annualFeeTodayKES: 100_000 }, opts);
    expect(plan.years.length).toBe(14);
    expect(plan.years.map((y) => y.stage)).toEqual([
      "pre-primary", "pre-primary",
      "primary", "primary", "primary", "primary", "primary", "primary",
      "junior", "junior", "junior",
      "senior", "senior", "senior",
    ]);
  });

  it("escalates each year by exactly the rate given", () => {
    const plan = buildChildPlan(
      { gradeValue: "grade10", annualFeeTodayKES: 100_000, escalation: 0.1 },
      opts
    );
    expect(plan.years.map((y) => y.feeKES)).toEqual([100_000, 110_000, 121_000]);
  });

  it("charges a flat fee when escalation is zero", () => {
    const plan = buildChildPlan(
      { gradeValue: "grade10", annualFeeTodayKES: 50_000, escalation: 0 },
      opts
    );
    expect(plan.totalNominalKES).toBe(150_000);
    expect(plan.totalNominalKES).toBe(plan.totalIfFeesNeverRoseKES);
  });

  /**
   * The finding the module exists to surface.
   *
   * Multiplying this year's fee by the years remaining is what every parent
   * does in their head, and what the current tool invites by asking for
   * "total fees" as a single figure. Over a full fourteen years at a rate
   * inside the reported band, it understates the bill by around half.
   */
  it("shows the gap against multiplying this year's fee by the years left", () => {
    const plan = buildChildPlan({ gradeValue: "pp1", annualFeeTodayKES: 300_000 }, opts);
    expect(plan.totalIfFeesNeverRoseKES).toBe(300_000 * 14);
    expect(plan.totalNominalKES).toBeGreaterThan(plan.totalIfFeesNeverRoseKES * 1.5);
    // And it is not unbounded either — a sanity rail on the compounding.
    expect(plan.totalNominalKES).toBeLessThan(plan.totalIfFeesNeverRoseKES * 3);
  });

  it("is monotonic in escalation", () => {
    const at = (e: number) =>
      buildChildPlan({ gradeValue: "grade1", annualFeeTodayKES: 200_000, escalation: e }, opts)
        .totalNominalKES;
    expect(at(0.05)).toBeLessThan(at(0.08));
    expect(at(0.08)).toBeLessThan(at(0.12));
  });

  it("discounts to today's money, and by less when fees outrun inflation", () => {
    const plan = buildChildPlan(
      { gradeValue: "pp1", annualFeeTodayKES: 300_000, escalation: 0.08 },
      { ...opts, inflation: 0.065 }
    );
    // Fees rising faster than prices means the real burden GROWS: each year's
    // bill costs more in today's money than the last.
    expect(plan.years[13].feeTodayKES).toBeGreaterThan(plan.years[0].feeTodayKES);
    expect(plan.totalTodayKES).toBeLessThan(plan.totalNominalKES);
  });

  it("appends university years after Grade 12", () => {
    const plan = buildChildPlan(
      {
        gradeValue: "grade11",
        annualFeeTodayKES: 100_000,
        escalation: 0,
        universityYears: 4,
        universityAnnualTodayKES: 250_000,
      },
      opts
    );
    expect(plan.years.length).toBe(6); // G11, G12, + 4 university
    expect(plan.years[2].stage).toBe("university");
    expect(plan.years[2].gradeLabel).toBe("University year 1");
    expect(plan.totalNominalKES).toBe(100_000 * 2 + 250_000 * 4);
  });

  it("returns an empty plan for a child already past Grade 12", () => {
    const plan = buildChildPlan({ gradeValue: "not-a-grade", annualFeeTodayKES: 100_000 }, opts);
    expect(plan.years).toEqual([]);
    expect(plan.totalNominalKES).toBe(0);
  });

  it("treats a missing or negative fee as zero rather than producing nonsense", () => {
    const plan = buildChildPlan({ gradeValue: "grade1", annualFeeTodayKES: -5_000 }, opts);
    expect(plan.totalNominalKES).toBe(0);
  });

  it("agrees with the public-track figure the education page already publishes", () => {
    // Grade 10 at the Ministry boarding rate with no escalation must reproduce
    // the three-year total the site quotes. If these ever disagree, one of the
    // two is wrong and a reader is seeing both.
    const plan = buildChildPlan(
      {
        gradeValue: "grade10",
        annualFeeTodayKES: SENIOR_SCHOOL_BOARDING_ANNUAL_KES,
        escalation: 0,
      },
      opts
    );
    expect(plan.totalNominalKES).toBe(SENIOR_SCHOOL_BOARDING_ANNUAL_KES * 3);
  });
});

describe("a household with several children", () => {
  const household = () =>
    buildHouseholdPlan(
      [
        { name: "Wanjiru", gradeValue: "grade5", annualFeeTodayKES: 300_000 },
        { name: "Kamau", gradeValue: "grade2", annualFeeTodayKES: 300_000 },
      ],
      opts
    );

  it("merges the children onto one timeline", () => {
    const h = household();
    // Kamau is in Grade 2, so the household pays until he finishes Grade 12:
    // ten more years after this one.
    expect(h.lastYear).toBe(AS_OF + (LAST_GRADE_INDEX - gradeIndex("grade2")));
    expect(h.totalNominalKES).toBe(
      h.children.reduce((s, c) => s + c.totalNominalKES, 0)
    );
  });

  it("finds the peak year, and it is one where both children are in school", () => {
    const h = household();
    expect(h.peakYear).not.toBeNull();
    expect(h.peakYear!.perChild.length).toBe(2);
    for (const y of h.years) {
      expect(y.totalKES).toBeLessThanOrEqual(h.peakYear!.totalKES);
    }
  });

  /**
   * Why the peak matters more than the average.
   *
   * The overlap years cost roughly double the solo years AND arrive after
   * escalation has been compounding, so the worst year is far above the
   * household's own average. A plan built on the average is underfunded
   * exactly when it is being tested.
   */
  it("puts the peak well above the average year", () => {
    const h = household();
    const average = h.totalNominalKES / h.years.length;
    expect(h.peakYear!.totalKES).toBeGreaterThan(average * 1.25);
  });

  it("names children rather than counting them", () => {
    const h = household();
    expect(h.children.map((c) => c.name)).toEqual(["Wanjiru", "Kamau"]);
    expect(h.peakYear!.perChild.map((c) => c.name).sort()).toEqual(["Kamau", "Wanjiru"]);
  });

  it("falls back to numbered names when none are given", () => {
    const h = buildHouseholdPlan(
      [
        { gradeValue: "grade1", annualFeeTodayKES: 100_000 },
        { gradeValue: "grade1", annualFeeTodayKES: 100_000 },
      ],
      opts
    );
    expect(h.children.map((c) => c.name)).toEqual(["Child 1", "Child 2"]);
  });

  it("handles an empty household without throwing", () => {
    const h = buildHouseholdPlan([], opts);
    expect(h.peakYear).toBeNull();
    expect(h.lastYear).toBeNull();
    expect(h.totalNominalKES).toBe(0);
  });
});

describe("the fund simulation", () => {
  const threeYears = [
    { yearsAhead: 0, feeKES: 120_000 },
    { yearsAhead: 1, feeKES: 120_000 },
    { yearsAhead: 2, feeKES: 120_000 },
  ];

  it("draws fees in January, May and September", () => {
    const sim = simulateFund({
      years: [{ yearsAhead: 0, feeKES: 90_000 }],
      monthlyContribution: 0,
      openingBalanceKES: 90_000,
      annualReturn: 0,
      leadMonths: 0,
    });
    const paying = sim.months.filter((m) => m.feePaidKES > 0).map((m) => m.monthIndex);
    expect(paying).toEqual([0, 4, 8]);
    for (const m of paying) expect(sim.months[m].feePaidKES).toBeCloseTo(30_000, 6);
  });

  it("front-loads Term 1 when asked", () => {
    const sim = simulateFund({
      years: [{ yearsAhead: 0, feeKES: 100_000 }],
      monthlyContribution: 0,
      openingBalanceKES: 100_000,
      annualReturn: 0,
      frontLoaded: true,
      leadMonths: 0,
    });
    expect(sim.months[0].feePaidKES).toBeCloseTo(50_000, 6);
    expect(sim.months[4].feePaidKES).toBeCloseTo(30_000, 6);
    expect(sim.months[8].feePaidKES).toBeCloseTo(20_000, 6);
  });

  it("shifts every draw by the lead time", () => {
    const sim = simulateFund({
      years: [{ yearsAhead: 0, feeKES: 90_000 }],
      monthlyContribution: 0,
      openingBalanceKES: 90_000,
      annualReturn: 0,
      leadMonths: DEFAULT_LEAD_MONTHS,
    });
    expect(sim.months.filter((m) => m.feePaidKES > 0).map((m) => m.monthIndex)).toEqual([
      12, 16, 20,
    ]);
  });

  it("reports infeasible when the fund runs dry", () => {
    const sim = simulateFund({ years: threeYears, monthlyContribution: 100, annualReturn: 0 });
    expect(sim.feasible).toBe(false);
    expect(sim.minBalanceKES).toBeLessThan(0);
  });
});

/**
 * The degenerate case, pinned so it stays visible.
 *
 * These assertions describe behaviour that is arithmetically correct and
 * useless as advice, which is why the default lead time exists. If somebody
 * later "fixes" the zero-lead case to give a friendlier number, they will be
 * hiding a real constraint rather than solving it, and these fail.
 */
describe("with no lead time at all, the first bill dominates everything", () => {
  const years = (e: number) =>
    buildChildPlan({ gradeValue: "grade1", annualFeeTodayKES: 300_000, escalation: e }, opts).years;

  it("stops responding to escalation", () => {
    const at = (e: number) =>
      solveLevelContribution({ years: years(e), annualReturn: 0.1, leadMonths: 0 });
    expect(at(0.12)).toBe(at(0.05));
  });

  it("responds to the expected return only through a single month's growth", () => {
    const at = (r: number) =>
      solveLevelContribution({ years: years(0.08), annualReturn: r, leadMonths: 0 });
    /* Not "stops responding" — that was the first draft of this assertion and
     * it was too strong. The contribution is the first term's bill divided by
     * one month of growth, so two points of extra return move it by under a
     * fifth of a per cent. Thirteen years of compounding do nothing at all. */
    const drift = Math.abs(at(0.12) - at(0.1)) / at(0.1);
    expect(drift).toBeLessThan(0.002);
    expect(
      interestContributionKES({ years: years(0.08), annualReturn: 0.1, leadMonths: 0 })
    ).toBe(0);
  });

  it("is exactly the first term's bill, discounted by one month's growth", () => {
    const first = years(0.08)[0].feeKES / 3;
    const solved = solveLevelContribution({
      years: years(0.08),
      annualReturn: 0.12,
      leadMonths: 0,
    });
    // Within a shilling: `first` is already rounded, so an exact equality here
    // would be asserting the rounding order rather than the behaviour.
    expect(solved).toBeCloseTo(first / 1.01, -1);
  });
});

describe("the level contribution", () => {
  const schedule = (n: number, fee: number) =>
    Array.from({ length: n }, (_, i) => ({ yearsAhead: i, feeKES: fee }));

  it("funds the schedule without the fund ever going negative", () => {
    // The defining property. Everything else here is a consequence of it.
    const years = schedule(6, 200_000);
    const monthly = solveLevelContribution({ years, annualReturn: 0.1 });
    const sim = simulateFund({ years, monthlyContribution: monthly, annualReturn: 0.1 });
    expect(sim.feasible).toBe(true);
    expect(sim.minBalanceKES).toBeGreaterThanOrEqual(-1);
  });

  it("is the MINIMUM such amount, not merely a sufficient one", () => {
    // A solver that returned the total liability every time would pass the
    // test above. This is the one that stops it.
    const years = schedule(6, 200_000);
    const monthly = solveLevelContribution({ years, annualReturn: 0.1 });
    const sim = simulateFund({ years, monthlyContribution: monthly - 50, annualReturn: 0.1 });
    expect(sim.feasible).toBe(false);
  });

  it("equals the simple division when there is no return and no front-loading", () => {
    // 12 months of contributions against one year of fees, drawn in thirds.
    // The binding constraint is the January draw at month 0, which the first
    // month's contribution alone must cover.
    const monthly = solveLevelContribution({
      years: [{ yearsAhead: 0, feeKES: 90_000 }],
      annualReturn: 0,
      leadMonths: 0,
    });
    expect(monthly).toBe(30_000);
  });

  /**
   * The heart of the matter, stated as a failing comparison.
   *
   * `solveMonthlyContribution` — the function the existing education
   * calculator uses — is asked for the same liability and answers with a much
   * smaller number, because it assumes the pot is never touched until the end.
   * For a family whose first bill is due in January that assumption is false,
   * and the error is in the dangerous direction: it tells them to save too
   * little.
   */
  it("demands more than the future-value solve, for the same liability", () => {
    const years = schedule(6, 200_000);
    const level = solveLevelContribution({ years, annualReturn: 0.1 });
    const fvSolve = solveMonthlyContribution({
      targetFutureValue: 200_000 * 6,
      annualRate: 0.1,
      years: 6,
    });
    /* A fund being drained three times a year compounds less than one left
     * alone, so it needs more in. The margin is real but modest — about a
     * seventh. Measured, not assumed: the first draft of this line claimed
     * the future-value answer was less than half of what was needed, which
     * was the mechanism confused with the end-to-end error below. */
    expect(level).toBeGreaterThan(fvSolve);
    expect(level / fvSolve).toBeGreaterThan(1.1);
    expect(level / fvSolve).toBeLessThan(1.3);
  });

  /**
   * THE FINDING. What a private-school parent is told today, against the truth.
   *
   * A Grade 1 child at a mid-tier private day school. The existing calculator
   * asks only about the two CBC transitions ahead, so the parent enters three
   * years of senior-school fees at today's price and is told to save about
   * Ksh 5,200 a month. Every one of the nine years of primary and junior fees
   * they are ALREADY paying is outside the model, and so is a decade of
   * escalation.
   *
   * The real level contribution is around Ksh 32,000 — over six times more.
   * An answer wrong by that factor is not a rough guide; it is a plan that
   * fails, and it fails late, when the child is sixteen and there is no time
   * left to fix it.
   */
  it("is many times the figure the old two-transition model produces", () => {
    const plan = buildChildPlan({ gradeValue: "grade1", annualFeeTodayKES: 333_500 }, opts);
    const truth = solveLevelContribution({ years: plan.years, annualReturn: 0.1 });

    const oldModel = solveMonthlyContribution({
      targetFutureValue: 333_500 * 3, // "senior secondary total fees", at today's price
      annualRate: 0.1,
      years: 9, // grade1 → yearsToSSS
    });

    expect(truth / oldModel).toBeGreaterThan(5);
  });

  it("falls as the expected return rises", () => {
    const years = schedule(10, 300_000);
    const at = (r: number) => solveLevelContribution({ years, annualReturn: r });
    expect(at(0.12)).toBeLessThan(at(0));
    expect(at(0.06)).toBeLessThan(at(0));
  });

  it("falls when there is already money in the fund", () => {
    const years = schedule(6, 200_000);
    const bare = solveLevelContribution({ years, annualReturn: 0.1 });
    const seeded = solveLevelContribution({
      years,
      annualReturn: 0.1,
      openingBalanceKES: 500_000,
    });
    expect(seeded).toBeLessThan(bare);
  });

  it("rises when the school front-loads Term 1", () => {
    const years = schedule(6, 200_000);
    const even = solveLevelContribution({ years, annualReturn: 0.1 });
    const front = solveLevelContribution({ years, annualReturn: 0.1, frontLoaded: true });
    expect(front).toBeGreaterThan(even);
  });

  it("rises with escalation, through a real plan", () => {
    const at = (e: number) =>
      solveLevelContribution({
        years: buildChildPlan(
          { gradeValue: "grade1", annualFeeTodayKES: 300_000, escalation: e },
          opts
        ).years,
        annualReturn: 0.1,
      });
    expect(at(0.12)).toBeGreaterThan(at(0.05));
  });

  it("asks for nothing when there is nothing to fund", () => {
    expect(solveLevelContribution({ years: [], annualReturn: 0.1 })).toBe(0);
    expect(
      solveLevelContribution({ years: [{ yearsAhead: 0, feeKES: 0 }], annualReturn: 0.1 })
    ).toBe(0);
  });

  it("asks for nothing when the opening balance already covers everything", () => {
    const years = schedule(3, 100_000);
    expect(
      solveLevelContribution({ years, annualReturn: 0.1, openingBalanceKES: 10_000_000 })
    ).toBe(0);
  });
});

describe("what the fund contributes", () => {
  it("reports interest that grows with the horizon", () => {
    const short = interestContributionKES({
      years: Array.from({ length: 3 }, (_, i) => ({ yearsAhead: i, feeKES: 200_000 })),
      annualReturn: 0.1,
    });
    const long = interestContributionKES({
      years: Array.from({ length: 12 }, (_, i) => ({ yearsAhead: i, feeKES: 200_000 })),
      annualReturn: 0.1,
    });
    expect(short).toBeGreaterThan(0);
    expect(long).toBeGreaterThan(short);
  });

  it("reports no interest at a zero return", () => {
    expect(
      interestContributionKES({
        years: Array.from({ length: 5 }, (_, i) => ({ yearsAhead: i, feeKES: 100_000 })),
        annualReturn: 0,
      })
    ).toBe(0);
  });
});

describe("affordability", () => {
  it("expresses the contribution as a share of net pay", () => {
    expect(shareOfNetPayPct(30_000, 120_000)).toBe(25);
    expect(shareOfNetPayPct(0, 120_000)).toBe(0);
    expect(shareOfNetPayPct(30_000, 0)).toBe(0);
  });

  /**
   * The finding a private-school parent most needs and is nowhere told.
   *
   * A single mid-tier private day place, funded properly from Grade 1, costs
   * more per month than the median formal salary this app models take-home pay
   * for. That is not an argument against private school; it is an argument for
   * seeing the number before committing to fourteen years of it.
   */
  it("shows a mid-tier private place consuming most of a good salary", () => {
    const plan = buildChildPlan({ gradeValue: "grade1", annualFeeTodayKES: 333_500 }, opts);
    const monthly = solveLevelContribution({ years: plan.years, annualReturn: 0.1 });
    expect(shareOfNetPayPct(monthly, 100_000)).toBeGreaterThan(30);
  });
});

describe("the grade ladder the schedule walks", () => {
  it("is the CBC ladder, unchanged", () => {
    // If a grade is inserted or renamed, the stage boundaries above move
    // silently. This is the tripwire for that.
    expect(CBC_GRADES.length).toBe(14);
    expect(CBC_GRADES[0].value).toBe("pp1");
    expect(CBC_GRADES[LAST_GRADE_INDEX].value).toBe("grade12");
    expect(gradeIndex("grade7")).toBe(8);
    expect(gradeIndex("grade10")).toBe(11);
  });
});
