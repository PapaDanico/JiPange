import { describe, it, expect } from "vitest";
import { buildActionPlan, buildGoalStrategy } from "../native-plan";
import { actionPlanSchema, goalStrategySchema, type GoalStrategyRequest, type Profile } from "../types";
import { tbillRate } from "../rates-feed";
import { PRODUCT_LINKS } from "../affiliate-links";

/**
 * The point of replacing the model with an engine is that the advice becomes
 * testable. A model's output could only ever be schema-checked; this can be
 * held to the standards the prompt used to merely request — honesty when the
 * budget is empty, live rates instead of brochure figures, no two
 * recommendations wearing the same hat.
 */

const profile = (over: Partial<Profile> = {}): Profile =>
  ({
    age: 29,
    county: "Nairobi",
    grossMonthlySalary: 85_000,
    dependants: 0,
    chamaMember: false,
    ...over,
  }) as Profile;

describe("buildActionPlan", () => {
  it("returns exactly three items in the API's shape, ranked 1-2-3", () => {
    const plan = buildActionPlan({ profile: profile(), net: 66_000, surplus: 15_000 });
    expect(() => actionPlanSchema.parse(plan)).not.toThrow();
    expect(plan.map((p) => p.rank)).toEqual([1, 2, 3]);
  });

  it("is deterministic — same numbers, same advice, every time", () => {
    const input = { profile: profile(), net: 66_000, surplus: 15_000 };
    expect(buildActionPlan(input)).toEqual(buildActionPlan(input));
  });

  it("honours the honesty rule: an empty budget gets leak-finding, not products", () => {
    const plan = buildActionPlan({ profile: profile(), net: 40_000, surplus: 0 });
    expect(plan.some((p) => p.category === "investment")).toBe(false);
    expect(plan[0].description.toLowerCase()).toContain("track");
  });

  it("never recommends the same category twice", () => {
    for (const surplus of [1_000, 5_000, 15_000, 40_000]) {
      for (const over of [{}, { dependants: 3 }, { chamaMember: true }, { grossMonthlySalary: 300_000 }]) {
        const plan = buildActionPlan({ profile: profile(over), net: 66_000, surplus });
        const cats = plan.map((p) => p.category);
        expect(new Set(cats).size, `duplicate category for surplus=${surplus} ${JSON.stringify(over)}`).toBe(cats.length);
      }
    }
  });

  it("quotes the LIVE 364-day net yield, not a number typed into the engine", () => {
    const bill = tbillRate(364);
    expect(bill).not.toBeNull();
    const plan = buildActionPlan({ profile: profile(), net: 120_000, surplus: 40_000 });
    const invest = plan.find((p) => p.category === "investment");
    expect(invest, "a Ksh 40k surplus should reach the T-bill recommendation").toBeTruthy();
    expect(invest!.impact).toContain(bill!.netEAY.toFixed(2));
  });

  it("raises insurance for dependants and pension relief for higher earners", () => {
    const withKids = buildActionPlan({ profile: profile({ dependants: 3 }), net: 66_000, surplus: 10_000 });
    expect(withKids.some((p) => p.category === "insurance")).toBe(true);

    const earner = buildActionPlan({ profile: profile({ grossMonthlySalary: 250_000 }), net: 170_000, surplus: 60_000 });
    const tax = earner.find((p) => p.category === "tax");
    expect(tax, "a 30%-band earner should be told about s.15(3)").toBeTruthy();
    expect(tax!.description).toContain("s.15(3)");
  });
});

describe("buildGoalStrategy", () => {
  const request = (over: Partial<GoalStrategyRequest> = {}): GoalStrategyRequest => ({
    goalType: "emergency",
    goalTitle: "Emergency fund",
    targetAmount: 200_000,
    years: 2,
    currentSavings: 10_000,
    requiredMonthly: 8_000,
    feasibility: "comfortable",
    monthlyCapacity: 20_000,
    ...over,
  });

  it("returns the API's exact shape for every goal type", () => {
    for (const goalType of ["education", "home", "emergency", "business", "retirement"] as const) {
      const s = buildGoalStrategy(request({ goalType }));
      expect(() => goalStrategySchema.parse(s)).not.toThrow();
      expect(s.steps.map((x) => x.step)).toEqual([1, 2, 3]);
    }
  });

  it("keeps emergency money liquid — never bonds, never lock-in", () => {
    const s = buildGoalStrategy(request({ goalType: "emergency" }));
    expect(s.vehicle.toLowerCase()).toContain("money market");
    expect(`${s.why} ${s.steps.map((x) => x.description).join(" ")}`).not.toMatch(/bond|DhowCSD/i);
  });

  it("addresses an out-of-reach goal honestly instead of pretending", () => {
    const s = buildGoalStrategy(
      request({ feasibility: "beyond-reach", requiredMonthly: 50_000, monthlyCapacity: 12_000 })
    );
    expect(s.steps[0].description).toContain("exceeds");
    expect(s.steps[0].description).toMatch(/12,000/);
  });

  it("points retirement at the s.15(3) relief and tax-free infrastructure bonds", () => {
    const s = buildGoalStrategy(request({ goalType: "retirement", years: 25 }));
    expect(s.vehicle.toLowerCase()).toContain("pension");
    expect(s.steps.map((x) => x.description).join(" ")).toMatch(/IFB|infrastructure/i);
  });
});

/**
 * Providers are data, not prose.
 *
 * The first version of this engine named "CIC, Britam and Sanlam" in three
 * separate strings, which is a second source of truth about which products
 * exist — and it was wrong within weeks: Ziidi, reachable from the M-PESA app
 * and the largest fund in the market, was absent from the advice while
 * sitting in the directory the rest of the app already read.
 */
describe("the plan names only providers that exist in the directory", () => {
  const directory = PRODUCT_LINKS.map((p) => p.shortName.replace(/ MMF$/, ""));

  function allProse(): string {
    const plans = [
      buildActionPlan({ profile: profile(), net: 66_000, surplus: 15_000 }),
      buildActionPlan({ profile: profile({ dependants: 2 }), net: 66_000, surplus: 40_000 }),
      buildActionPlan({ profile: profile({ chamaMember: true }), net: 40_000, surplus: 3_000 }),
    ].flat();
    const strategies = (["emergency", "education", "home", "business", "retirement"] as const).map(
      (goalType) =>
        buildGoalStrategy({
          goalType,
          goalTitle: "Goal",
          targetAmount: 500_000,
          years: 5,
          currentSavings: 0,
          requiredMonthly: 8_000,
          feasibility: "comfortable",
          monthlyCapacity: 20_000,
        })
    );
    return [
      ...plans.map((p) => `${p.title} ${p.description} ${p.impact}`),
      ...strategies.map((s) => `${s.vehicle} ${s.why} ${s.watchOut} ${s.steps.map((x) => x.description).join(" ")}`),
    ].join(" ");
  }

  it("names a fund only if the directory carries it", () => {
    const prose = allProse();
    // Any capitalised fund-ish name the engine emits must be one we list.
    for (const candidate of ["CIC", "Britam", "Sanlam", "Ziidi", "Nabo", "ICEA", "Old Mutual", "Zimele"]) {
      if (prose.includes(candidate)) {
        expect(
          directory.some((d) => d.includes(candidate)),
          `the plan names "${candidate}" but the product directory does not list it`
        ).toBe(true);
      }
    }
  });

  /**
   * Checked at EACH call site, not across their union.
   *
   * The first version asserted only that the reachable fund appeared
   * somewhere in the combined prose — so reverting one of the two call sites
   * to a hard-coded "CIC, Britam and Sanlam" still passed, because the other
   * site carried the name. A union assertion cannot see a half-regression,
   * which is the shape most regressions actually take.
   */
  it("names the M-PESA-reachable fund in the action plan itself", () => {
    const reachable = PRODUCT_LINKS.find(
      (p) => p.type === "mmf" && /M-PESA/i.test(p.liquidity) && p.yieldPct === undefined
    );
    expect(reachable, "no M-PESA-reachable MMF in the directory").toBeTruthy();
    const short = reachable!.shortName.replace(/ MMF$/, "");

    const plan = buildActionPlan({ profile: profile(), net: 66_000, surplus: 15_000 });
    const mmfItem = plan.find((p) => /money market fund/i.test(p.title));
    expect(mmfItem, "no MMF recommendation in a plan with a healthy surplus").toBeTruthy();
    expect(mmfItem!.description, "the action plan does not name the reachable fund").toContain(short);
  });

  it("names it in the goal strategy too", () => {
    const reachable = PRODUCT_LINKS.find(
      (p) => p.type === "mmf" && /M-PESA/i.test(p.liquidity) && p.yieldPct === undefined
    )!;
    const short = reachable.shortName.replace(/ MMF$/, "");
    const s = buildGoalStrategy({
      goalType: "emergency",
      goalTitle: "Emergency fund",
      targetAmount: 200_000,
      years: 2,
      currentSavings: 0,
      requiredMonthly: 8_000,
      feasibility: "comfortable",
      monthlyCapacity: 20_000,
    });
    expect(s.steps.map((x) => x.description).join(" ")).toContain(short);
  });
});
