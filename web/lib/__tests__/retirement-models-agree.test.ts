import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import {
  LIVING_REPLACEMENT_AT_RETIREMENT,
  planKenyanRetirement,
} from "../retirement-kenya";

/**
 * The two retirement tools must not answer the same question differently.
 *
 * JiPange ships two. /planners/retirement takes one spending figure and
 * applies `spending x replacement / withdrawal`. /tools/fire-number runs
 * retirement-kenya.ts, which prices living and medical as separate streams,
 * declines the first, escalates the second and stops at a horizon.
 *
 * On 31 July 2026 they disagreed by a factor of 1.79 — Ksh 22.5m against
 * Ksh 40.3m for the same 150k/mo household. A reader who ran both got two
 * answers nearly double apart with nothing telling them which to believe.
 *
 * THE CAUSE, WHICH IS THE INTERESTING PART
 *
 * Not a bug in either model. Each held its own view of one number: how much of
 * today's spending a household still needs once retired. The planner said 50%.
 * The Kenya model said nothing at all — `livingAtRetirement` was today's cost
 * unchanged, declining 1%/yr to a 75% floor afterwards, which works out near
 * 89% across the plan.
 *
 * An assumption expressed as the ABSENCE of a step is the hardest kind to
 * notice. Nobody wrote 89% anywhere; it emerged from a line that looked like a
 * comment about inflation. That is why the fix is a named exported constant
 * both tools import, rather than two numbers someone remembers to keep equal.
 *
 * WHY THEY STILL DIFFER, AND WHY THAT IS RIGHT
 *
 * Replacement applies to LIVING only. Medical is not reduced — you need the
 * same cover the day after you retire as the day before — and the fuller model
 * escalates it 3% real from there. The planner takes one combined figure and
 * cannot tell the two apart, so it reduces medical too and lands lower.
 *
 * The residual is about 15%, in the conservative direction: the fuller model
 * asks for more. That is the correct direction for the tool that knows more.
 * This test pins the gap so it stays explained rather than becoming another
 * 1.79x nobody noticed.
 */
const ROOT = new URL("../../", import.meta.url).pathname;

/** The planner's arithmetic, restated here so the test reads what it ships. */
function plannerPot(monthlyNow: number, replacement: number, withdrawal: number): number {
  return Math.round((monthlyNow * replacement * 12) / withdrawal);
}

/** Read the planner's withdrawal default from source rather than assuming it. */
const planner = readFileSync(`${ROOT}components/planners/GoalPlanner.tsx`, "utf8");
const withdrawal = Number(planner.match(/const WITHDRAWAL_DEFAULT = ([\d.]+);/)?.[1] ?? NaN);

/** Representative households, medical taken at a tenth of total spending. */
const HOUSEHOLDS = [30_000, 50_000, 100_000, 150_000];

describe("the two retirement tools agree", () => {
  it("reads a real withdrawal default, so the comparison is not vacuous", () => {
    expect(withdrawal, "WITHDRAWAL_DEFAULT not found in GoalPlanner.tsx").toBeGreaterThan(0);
    expect(LIVING_REPLACEMENT_AT_RETIREMENT).toBeGreaterThan(0);
    expect(LIVING_REPLACEMENT_AT_RETIREMENT).toBeLessThanOrEqual(1);
  });

  it("shares one replacement rate rather than keeping two in step by hand", () => {
    expect(
      planner,
      "the planner declares its own replacement rate again instead of importing the shared one"
    ).toMatch(/const REPLACEMENT_DEFAULT = LIVING_REPLACEMENT_AT_RETIREMENT;/);
  });

  it("lands within a stated tolerance across representative households", () => {
    const offenders: string[] = [];
    for (const total of HOUSEHOLDS) {
      const medical = Math.round(total * 0.1);
      const kenya = planKenyanRetirement({
        currentAge: 35,
        retirementAge: 60,
        currentMonthlyExpenses: total - medical,
        currentMonthlyMedical: medical,
      }).capitalRequiredKes;
      const quick = plannerPot(total, LIVING_REPLACEMENT_AT_RETIREMENT, withdrawal);
      const ratio = kenya / quick;
      /* 1.0–1.35. The floor matters as much as the ceiling: if the fuller model
       * ever drops BELOW the quick estimate, the tool that prices medical
       * separately is asking for less than the one that cannot see medical at
       * all, which would mean something has gone wrong in the stream model. */
      if (ratio < 1.0 || ratio > 1.35) {
        offenders.push(
          `Ksh ${total.toLocaleString()}/mo: quick ${(quick / 1e6).toFixed(1)}m vs full ${(kenya / 1e6).toFixed(1)}m (${ratio.toFixed(2)}x)`
        );
      }
    }
    expect(
      offenders,
      [
        "The quick planner and the full Kenya model have drifted apart. They are",
        "allowed to differ — the full model prices medical separately and does not",
        "reduce it — but only by the ~15% that asymmetry explains. A larger gap",
        "means one of them has changed an assumption the other does not share.",
      ].join(" ")
    ).toEqual([]);
  });

  it("keeps the fuller model on the conservative side of the quick one", () => {
    /* Directional, and deliberately separate from the tolerance above. If a
     * reader is going to act on one number, the tool that knows less should
     * not be the one promising they need less. */
    const medical = 15_000;
    const kenya = planKenyanRetirement({
      currentAge: 35,
      retirementAge: 60,
      currentMonthlyExpenses: 135_000,
      currentMonthlyMedical: medical,
    }).capitalRequiredKes;
    const quick = plannerPot(150_000, LIVING_REPLACEMENT_AT_RETIREMENT, withdrawal);
    expect(
      kenya,
      "the quick estimate now asks for MORE than the full model — check the stream model"
    ).toBeGreaterThan(quick);
  });

  it("catches a divergence when one is introduced", () => {
    /* Mutation check: halving the replacement rate in one model only is exactly
     * the failure this file exists for, and it must be visible. */
    const medical = 15_000;
    const withHalf = planKenyanRetirement({
      currentAge: 35,
      retirementAge: 60,
      currentMonthlyExpenses: 135_000,
      currentMonthlyMedical: medical,
      livingReplacement: LIVING_REPLACEMENT_AT_RETIREMENT / 2,
    }).capitalRequiredKes;
    const shared = planKenyanRetirement({
      currentAge: 35,
      retirementAge: 60,
      currentMonthlyExpenses: 135_000,
      currentMonthlyMedical: medical,
    }).capitalRequiredKes;
    expect(withHalf, "livingReplacement has no effect — the wiring is broken").toBeLessThan(shared);
  });
});
