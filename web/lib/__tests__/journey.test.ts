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

  it("scales the Fuliza tax estimate with income tier", () => {
    const low = mapJourney({
      ...base,
      liquidity_leak: "mobile_loans",
      income_bracket: "under_50k",
    }).fulizaTax!;
    const high = mapJourney({
      ...base,
      liquidity_leak: "mobile_loans",
      income_bracket: "above_250k",
    }).fulizaTax!;
    expect(high.estMonthlyCost).toBeGreaterThan(low.estMonthlyCost);
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
    expect(drag.upsidePoints).toBeCloseTo(8.2, 5);
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
