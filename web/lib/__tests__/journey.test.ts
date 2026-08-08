import { describe, expect, it } from "vitest";
import {
  CURRENT_INFLATION,
  ASSUMED_CURRENT_YIELD,
  TARGET_MMF_YIELD,
  derivePersona,
  deriveSurvivalState,
  microMilestoneTarget,
  mapJourney,
  matchVehicle,
  type JourneyAnswers,
} from "../journey";

const base: JourneyAnswers = {
  primary_goal: "home_deposit",
  income_bracket: "50k_120k",
  liquidity_leak: "active_savings",
  current_vehicle: ["mmf"],
  timeline: "mid_term",
};

describe("Rule Block A — the Debt Intercept", () => {
  it("forces the Recovery theme and debt-first priority on mobile_loans", () => {
    const model = mapJourney({ ...base, liquidity_leak: "mobile_loans" });
    expect(model.theme).toBe("recovery");
    expect(model.priority1).toBe("Debt Paydown & Micro-Emergency Fund");
    expect(model.microFundTarget).not.toBeNull();
    expect(model.fulizaTax).not.toBeNull();
  });

  it("indexes the micro-fund target progressively within Ksh 10k-30k", () => {
    const targets = (["under_50k", "50k_120k", "120k_250k", "above_250k"] as const).map(
      (bracket) =>
        mapJourney({ ...base, liquidity_leak: "mobile_loans", income_bracket: bracket })
          .microFundTarget!
    );
    expect(targets[0]).toBe(10_000);
    expect(targets[3]).toBe(30_000);
    for (let i = 1; i < targets.length; i++) {
      expect(targets[i]).toBeGreaterThan(targets[i - 1]);
    }
  });

  it("suppresses long-lock vehicles under Recovery", () => {
    const model = mapJourney({
      ...base,
      liquidity_leak: "mobile_loans",
      timeline: "long_term",
    });
    expect(model.match.id).not.toBe("ifb");
    expect(model.alternatives.map((v) => v.id)).not.toContain("ifb");
    expect(model.suppressedNote).toBeTruthy();
  });

  /**
   * The Fuliza tax does NOT scale with income, and that is the finding.
   *
   * This test used to assert that a higher earner pays more. Under the real
   * tariff they do not: the daily maintenance fee is a flat shilling amount per
   * balance band, and every income tier this app models — carrying Ksh 3,000 up
   * to Ksh 25,000 — sits inside the same 2,501-70,000 band at Ksh 25 a day
   * before excise.
   *
   * So the overdraft costs a Ksh 40,000 earner exactly what it costs a Ksh
   * 300,000 earner, in shillings. As a share of income that is steeply
   * regressive, which is a sharper thing to tell a reader than the old
   * assumption that the cost rises with what you make.
   */
  it("costs the same in shillings across every income tier in one band", () => {
    const cost = (income_bracket: string) =>
      mapJourney({
        ...base,
        liquidity_leak: "mobile_loans",
        income_bracket,
      } as never).fulizaTax!;

    const low = cost("under_50k");
    const high = cost("above_250k");
    expect(high.dailyFee).toBe(low.dailyFee);
    expect(high.estMonthlyCost).toBe(low.estMonthlyCost);
    // The balances genuinely differ; it is the tariff that flattens them.
    expect(high.estOutstanding).toBeGreaterThan(low.estOutstanding);
    expect(low.estAnnualCost).toBe(low.estMonthlyCost * 12);
  });

  it("does not fire for other liquidity leaks", () => {
    const model = mapJourney({ ...base, liquidity_leak: "credit_card" });
    expect(model.theme).toBe("growth");
    expect(model.fulizaTax).toBeNull();
    expect(model.microFundTarget).toBeNull();
  });
});

describe("Rule Block B — the Inflation Drag calculator", () => {
  it("activates for bank/M-Pesa money above the lowest bracket", () => {
    const model = mapJourney({ ...base, current_vehicle: ["mpesa_bank", "chama"] });
    expect(model.inflationDrag).not.toBeNull();
    const drag = model.inflationDrag!;
    // Net_Loss = median × (inflation − bank yield), per spec.
    expect(drag.netLossAnnual).toBe(
      Math.round(drag.medianSavings * (CURRENT_INFLATION - ASSUMED_CURRENT_YIELD))
    );
    // Derived from the constants, not pinned at 8.2. That literal was
    // (11.5 - 3.23) frozen into the test, so it asserted the value of a
    // hardcoded MMF yield rather than the arithmetic the card performs — and
    // it failed the moment that yield became anchored to the live bill, which
    // is the one change it should have been indifferent to.
    expect(drag.upsidePoints).toBeCloseTo(
      Math.floor((TARGET_MMF_YIELD - ASSUMED_CURRENT_YIELD) * 1000) / 10,
      5
    );
    expect(drag.mmfExtraAnnual).toBe(
      Math.round(drag.medianSavings * (TARGET_MMF_YIELD - ASSUMED_CURRENT_YIELD))
    );
  });

  it("stays off for under_50k and for non-bank vehicles", () => {
    expect(
      mapJourney({ ...base, current_vehicle: ["mpesa_bank"], income_bracket: "under_50k" })
        .inflationDrag
    ).toBeNull();
    expect(mapJourney({ ...base, current_vehicle: ["mmf", "sacco"] }).inflationDrag).toBeNull();
  });
});

describe("Rule Block C — the Vehicle Matchmaker", () => {
  it("matches MMFs for emergency funds on any timeline", () => {
    for (const timeline of ["short_term", "mid_term", "long_term"] as const) {
      expect(matchVehicle("emergency_fund", timeline, false).match.id).toBe("mmf");
    }
  });

  it("matches MMFs for any goal on a short timeline", () => {
    expect(matchVehicle("home_deposit", "short_term", false).match.id).toBe("mmf");
    expect(matchVehicle("business_capital", "short_term", false).match.id).toBe("mmf");
  });

  it("matches Tier-1 Saccos for milestone goals over 1-3 years", () => {
    expect(matchVehicle("home_deposit", "mid_term", false).match.id).toBe("sacco");
    expect(matchVehicle("business_capital", "mid_term", false).match.id).toBe("sacco");
  });

  it("matches IFBs for long horizons — unless Recovery suppresses them", () => {
    expect(matchVehicle("home_deposit", "long_term", false).match.id).toBe("ifb");
    expect(matchVehicle("home_deposit", "long_term", true).match.id).toBe("sacco");
  });

  it("always offers alternatives distinct from the match", () => {
    const { match, alternatives } = matchVehicle("education", "mid_term", false);
    expect(alternatives.length).toBeGreaterThan(0);
    expect(alternatives.map((v) => v.id)).not.toContain(match.id);
  });
});

describe("derivePersona", () => {
  it("debt stress dominates every other signal", () => {
    expect(
      derivePersona({ ...base, liquidity_leak: "mobile_loans", current_vehicle: ["mmf", "sacco"] })
        .name
    ).toBe("The Debt-Stressed Striver");
  });

  it("real vehicles beat idle bank money", () => {
    expect(derivePersona({ ...base, current_vehicle: ["mpesa_bank", "mmf"] }).name).toBe(
      "The Budding Wealth Builder"
    );
    expect(derivePersona({ ...base, current_vehicle: ["sacco"] }).name).toBe(
      "The Budding Wealth Builder"
    );
  });

  it("idle bank money without debt is the leaking casual saver", () => {
    expect(derivePersona({ ...base, current_vehicle: ["mpesa_bank", "chama"] }).name).toBe(
      "The Casual Saver (Leaking Yield)"
    );
  });

  it("nothing tracked gets the clean-slate persona", () => {
    expect(derivePersona({ ...base, current_vehicle: ["none"] }).name).toBe(
      "The Clean-Slate Builder"
    );
  });
});

describe("deriveSurvivalState", () => {
  it("maps each leak to the right banner state", () => {
    expect(deriveSurvivalState("mobile_loans")).toBe("high_risk");
    expect(deriveSurvivalState("active_savings")).toBe("optimized");
    expect(deriveSurvivalState("credit_card")).toBe("exposed");
    expect(deriveSurvivalState("friends_family")).toBe("exposed");
  });
});

describe("microMilestoneTarget", () => {
  it("uses the goal base scaled by income bracket, rounded to 5k", () => {
    expect(
      microMilestoneTarget({ ...base, primary_goal: "home_deposit", income_bracket: "50k_120k" })
    ).toBe(100_000);
    expect(
      microMilestoneTarget({ ...base, primary_goal: "emergency_fund", income_bracket: "50k_120k" })
    ).toBe(50_000);
    expect(
      microMilestoneTarget({ ...base, primary_goal: "home_deposit", income_bracket: "under_50k" })
    ).toBe(50_000);
    expect(
      microMilestoneTarget({ ...base, primary_goal: "clear_debt", income_bracket: "above_250k" })
    ).toBe(60_000);
  });
});

/**
 * AN UNKNOWN GOAL FROM STORAGE MUST NOT TAKE THE PAGE DOWN.
 *
 * `JourneyAnswers.primary_goal` is typed as one of five values, and both
 * `GOAL_PRIORITY` and `GOAL_TO_DOMAIN` index it directly on that promise.
 * Runtime does not keep it: `getStoredJourneyAnswers` reads with
 * `JSON.parse(raw) as T` — a cast, not a validation — and `lib/backup.ts`
 * restores ANY jipange-prefixed key from a file the user supplies.
 *
 * So a backup written before a goal was renamed, or one hand-edited, walks an
 * unknown string in. `DOMAIN_META[undefined].bg` threw a TypeError that took
 * the whole of /plan to the error boundary — "Something went wrong" — with no
 * route back except clearing storage. This one produced the literal text
 * "undefined" as the reader's headline priority.
 *
 * Found by a print test whose vacuity guard fired: /plan rendered 137
 * characters where 200 were required. The assertion that caught it was not
 * looking for this at all.
 */
describe("a journey answer the code does not recognise", () => {
  const answers = {
    life_stage: "building",
    income_zone: "mid",
    // Not a PrimaryGoal. This exact string sat in the repo's own
    // print-reports fixture, which is where it was found.
    primary_goal: "grow_wealth",
    liquidity_leak: "active_savings",
    current_vehicle: ["mmf"],
    timeline: "1_3_years",
  } as unknown as JourneyAnswers;

  it("still produces a plan rather than throwing", () => {
    expect(() => mapJourney(answers)).not.toThrow();
  });

  it("falls back to the cushion instead of rendering 'undefined'", () => {
    const plan = mapJourney(answers);
    expect(plan.priority1).toBeTruthy();
    expect(plan.priority1).not.toContain("undefined");
    expect(plan.priority1).toBe("Build your emergency cushion");
  });

  it("still uses the real priority for a goal it does know", () => {
    const known = { ...answers, primary_goal: "home_deposit" } as unknown as JourneyAnswers;
    expect(mapJourney(known).priority1).toBe("Build your home deposit");
  });
});
