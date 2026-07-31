/**
 * Not "here is your number" — "here is what has to be true for it to work".
 *
 * WHY THIS EXISTS
 *
 * Every retirement tool, this one included, hands back a target and an
 * implicit promise: save this much, earn the assumed return, arrive. The
 * assumed return is the load-bearing part and it is the part nobody examines,
 * because it arrives pre-filled and looks like a fact rather than a forecast.
 * A plan that works at 3% real and fails at 2% is a different plan from one
 * that works at either, and the current output cannot tell those apart.
 *
 * So this inverts the question. Given what someone actually has and actually
 * saves, what return must they earn? And then the part that makes it useful
 * rather than merely clever: is that number reachable with Kenyan government
 * paper, or does it require something the saver has not been told they are
 * betting on?
 *
 * WHY IT IS A SEPARATE MODULE AND NOT A FIELD ON THE PLAN
 *
 * planKenyanRetirement already reports `onTrack` and
 * `additionalMonthlyNeededKes` — the "save more" lever. This is the other
 * lever, and the two must not be confused: told to save 20,000 more a month a
 * reader may reasonably conclude they cannot retire, when in fact their plan
 * works at a return they could reach by changing what they hold. Presenting
 * only the savings lever quietly recommends the harder of two answers.
 *
 * WHAT THIS DELIBERATELY DOES NOT DO
 *
 * It does not recommend an instrument, and it never says a required return is
 * "achievable" — only where it sits against what Kenyan government paper has
 * paid. Today's Kenyan real yields are extraordinary and, as REAL_RETURN_DEFAULT
 * argues at length, a thirty-year plan must not assume they persist. A module
 * that answered "yes, reachable" using this month's print would be making
 * precisely the error the return assumption was written to avoid.
 */

import { REAL_RETURN_DEFAULT } from "./retirement-kenya";

/** Below this the solver reports "no return gets you there" instead of a number. */
export const MAX_PLAUSIBLE_REAL_RETURN = 0.15;

export interface BreakEven {
  /** The real return that makes projected capital exactly meet the target. */
  requiredRealReturn: number | null;
  /** What the plan currently assumes. */
  assumedRealReturn: number;
  /**
   * requiredRealReturn - assumedRealReturn. Negative means the plan has room:
   * returns could disappoint by this much and still arrive.
   */
  headroom: number | null;
  /** True when no return below MAX_PLAUSIBLE_REAL_RETURN closes the gap. */
  unreachableByReturnsAlone: boolean;
  /** True when the plan already arrives at a zero real return. */
  arrivesWithoutGrowth: boolean;
}

/**
 * Future value of existing capital plus a level monthly contribution, in real
 * terms. The same arithmetic planKenyanRetirement uses, deliberately — a
 * second formula here would be a second opinion, and this codebase has already
 * paid for having two of those.
 */
export function projectedCapital(
  currentCapital: number,
  monthlyContribution: number,
  years: number,
  realReturn: number
): number {
  const growth = Math.pow(1 + realReturn, years);
  const annual = monthlyContribution * 12;
  /* At exactly zero the annuity formula divides by zero. The limit is simply
   * the undiscounted sum of contributions, which is what a reader would work
   * out on paper — so it is returned rather than guarded with an epsilon that
   * would quietly shift the answer. */
  const contributionsFV =
    realReturn === 0 ? annual * years : (annual * (growth - 1)) / realReturn;
  return currentCapital * growth + contributionsFV;
}

/**
 * Solve for the real return that just reaches the target.
 *
 * Bisection rather than algebra: the future-value equation cannot be inverted
 * in closed form once both a lump sum and a contribution stream are present,
 * and bisection is monotone here because projected capital rises strictly with
 * the return for any non-negative inputs. Fifty iterations over a bounded
 * interval is far more precision than a retirement plan can carry, and it
 * cannot fail to terminate.
 */
export function solveBreakEven(input: {
  targetKes: number;
  currentCapitalKes: number;
  monthlyContributionKes: number;
  years: number;
  assumedRealReturn?: number;
}): BreakEven {
  const assumed = input.assumedRealReturn ?? REAL_RETURN_DEFAULT;
  const clean = (n: number) => (Number.isFinite(n) ? Math.max(0, n) : 0);
  const target = clean(input.targetKes);
  const capital = clean(input.currentCapitalKes);
  const monthly = clean(input.monthlyContributionKes);
  const years = clean(input.years);

  const at = (r: number) => projectedCapital(capital, monthly, years, r);

  const base = {
    assumedRealReturn: assumed,
    arrivesWithoutGrowth: at(0) >= target,
  };

  /* Already there with no growth at all: no return is "required", and
   * reporting some tiny positive number would imply a dependence that does not
   * exist. */
  if (base.arrivesWithoutGrowth) {
    return {
      ...base,
      requiredRealReturn: 0,
      headroom: 0 - assumed,
      unreachableByReturnsAlone: false,
    };
  }

  if (at(MAX_PLAUSIBLE_REAL_RETURN) < target) {
    /* No plausible return closes the gap. Saying "you need 34% real" would be
     * arithmetically true and practically a joke; the honest answer is that
     * returns are the wrong lever and the contribution has to move. */
    return {
      ...base,
      requiredRealReturn: null,
      headroom: null,
      unreachableByReturnsAlone: true,
    };
  }

  let lo = 0;
  let hi = MAX_PLAUSIBLE_REAL_RETURN;
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    if (at(mid) < target) lo = mid;
    else hi = mid;
  }
  const required = (lo + hi) / 2;

  return {
    ...base,
    requiredRealReturn: required,
    headroom: required - assumed,
    unreachableByReturnsAlone: false,
  };
}

/**
 * How much the return could disappoint before the plan stops arriving,
 * expressed the way a person would say it.
 *
 * Returns null when there is no headroom to describe, rather than "0.0
 * percentage points", which reads as a measurement rather than as an absence.
 */
export function describeHeadroom(b: BreakEven): string | null {
  if (b.unreachableByReturnsAlone) return null;
  if (b.requiredRealReturn === null || b.headroom === null) return null;
  const pp = Math.abs(b.headroom * 100);
  if (b.headroom > 0) {
    return `This plan needs ${pp.toFixed(1)} percentage points MORE than it assumes — as things stand it does not get there.`;
  }
  return `Returns could come in ${pp.toFixed(1)} percentage points below the assumption and this plan would still arrive.`;
}
