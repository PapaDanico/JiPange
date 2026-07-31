import { describe, it, expect } from "vitest";
import {
  solveBreakEven,
  projectedCapital,
  describeHeadroom,
  MAX_PLAUSIBLE_REAL_RETURN,
} from "../break-even";
import { REAL_RETURN_DEFAULT, planKenyanRetirement } from "../retirement-kenya";

/**
 * The inversion, tested against the model it inverts.
 *
 * The whole value of this module is that it agrees with planKenyanRetirement.
 * A break-even solved from a second, subtly different future-value formula
 * would produce a number that looks authoritative and quietly contradicts the
 * target printed beside it — which is exactly how the two retirement tools in
 * this repo came to disagree by 1.79x earlier. So the first and most important
 * test is a round-trip: solve for the required return, feed it back into the
 * real model, and land on the target.
 */
const BASE = {
  targetKes: 12_000_000,
  currentCapitalKes: 1_500_000,
  monthlyContributionKes: 25_000,
  years: 25,
};

describe("solving for the return a plan needs", () => {
  it("round-trips: the solved return actually reaches the target", () => {
    const b = solveBreakEven(BASE);
    expect(b.requiredRealReturn).not.toBeNull();
    const reached = projectedCapital(
      BASE.currentCapitalKes,
      BASE.monthlyContributionKes,
      BASE.years,
      b.requiredRealReturn!
    );
    expect(Math.abs(reached - BASE.targetKes) / BASE.targetKes).toBeLessThan(0.001);
  });

  it("agrees with the model it inverts, not with a private formula", () => {
    /* Point the solver at a plan's OWN capital requirement, solved at the
     * plan's OWN return, and the required return must come back as that
     * return. If these ever drift apart, one of the two is computing
     * retirement differently and the page is showing a reader two views of
     * one plan. */
    const plan = planKenyanRetirement({
      currentAge: 35,
      retirementAge: 60,
      currentMonthlyExpenses: 135_000,
      currentMonthlyMedical: 15_000,
      currentCapital: 1_000_000,
      monthlyContribution: 40_000,
    });
    const b = solveBreakEven({
      targetKes: plan.capitalRequiredKes,
      currentCapitalKes: 1_000_000,
      monthlyContributionKes: 40_000,
      years: plan.yearsToRetirement,
      assumedRealReturn: plan.realReturn,
    });
    const reached = projectedCapital(1_000_000, 40_000, plan.yearsToRetirement, b.requiredRealReturn!);
    expect(Math.abs(reached - plan.capitalRequiredKes) / plan.capitalRequiredKes).toBeLessThan(0.001);

    /* And the sign of the headroom must match the model's own verdict. A plan
     * the model calls on-track must not be described here as needing more. */
    if (plan.onTrack) expect(b.headroom!).toBeLessThanOrEqual(0.0001);
    else expect(b.headroom!).toBeGreaterThan(-0.0001);
  });

  it("says returns are the wrong lever when no plausible one works", () => {
    /* "You need 34% real" is arithmetically true and practically a joke. The
     * honest answer is that the contribution has to move. */
    const b = solveBreakEven({ ...BASE, targetKes: 900_000_000 });
    expect(b.unreachableByReturnsAlone).toBe(true);
    expect(b.requiredRealReturn).toBeNull();
    expect(b.headroom).toBeNull();
    expect(describeHeadroom(b), "a headroom sentence for an unreachable plan").toBeNull();
  });

  it("reports zero rather than a token return when growth is not needed", () => {
    /* Contributions alone already exceed the target. Any positive "required"
     * return would imply a dependence that does not exist. */
    const b = solveBreakEven({
      targetKes: 1_000_000,
      currentCapitalKes: 5_000_000,
      monthlyContributionKes: 10_000,
      years: 10,
    });
    expect(b.arrivesWithoutGrowth).toBe(true);
    expect(b.requiredRealReturn).toBe(0);
    expect(b.headroom).toBeLessThan(0);
  });

  it("handles a zero real return without dividing by zero", () => {
    /* The annuity formula blows up at exactly 0. The limit is the plain sum of
     * contributions — what a reader would work out on paper. */
    const fv = projectedCapital(100_000, 10_000, 10, 0);
    expect(fv).toBe(100_000 + 10_000 * 12 * 10);
    expect(Number.isFinite(fv)).toBe(true);
  });

  it("survives garbage without producing confident nonsense", () => {
    /* Same lesson as the NaN sanitiser next door: Math.max(0, NaN) is NaN, so
     * a clamp is not validation. */
    for (const bad of [Number.NaN, Number.POSITIVE_INFINITY, -5_000_000]) {
      const b = solveBreakEven({ ...BASE, currentCapitalKes: bad });
      expect(Number.isFinite(b.assumedRealReturn)).toBe(true);
      if (b.requiredRealReturn !== null) {
        expect(Number.isFinite(b.requiredRealReturn)).toBe(true);
        expect(b.requiredRealReturn).toBeGreaterThanOrEqual(0);
        expect(b.requiredRealReturn).toBeLessThanOrEqual(MAX_PLAUSIBLE_REAL_RETURN);
      }
    }
  });

  it("defaults to the shared return assumption rather than its own", () => {
    /* One constant, not two kept in step. */
    expect(solveBreakEven(BASE).assumedRealReturn).toBe(REAL_RETURN_DEFAULT);
  });

  it("describes headroom in both directions, and never as a bare zero", () => {
    const comfortable = solveBreakEven({ ...BASE, monthlyContributionKes: 90_000 });
    expect(describeHeadroom(comfortable)).toMatch(/still arrive/i);

    const short = solveBreakEven({ ...BASE, monthlyContributionKes: 5_000 });
    if (!short.unreachableByReturnsAlone) {
      expect(describeHeadroom(short)).toMatch(/MORE than it assumes/);
    }
  });
});
