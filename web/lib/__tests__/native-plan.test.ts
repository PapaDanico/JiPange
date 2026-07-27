import { describe, it, expect } from "vitest";
import { buildActionPlan, buildGoalStrategy } from "../native-plan";
import { actionPlanSchema, goalStrategySchema, type GoalStrategyRequest, type Profile } from "../types";
import { tbillRate } from "../rates-feed";

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
