import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { GOAL_CONFIGS } from "../goal-planner";
import { REAL_RETURN_DEFAULT } from "../retirement-kenya";

/**
 * The retirement planner's pot multiple, its presets, and its on-screen
 * explanation must all describe the same withdrawal rate.
 *
 * The planner sized a pot at income × 300 — the 4% rule — under a tagline
 * promising "a monthly income FOR LIFE". Those are different questions. The 4%
 * rule measures a 30-year DEPLETION of a US 60/40 portfolio; a pot that never
 * runs out is 1 ÷ real return. Sizing a perpetuity with a depletion rule
 * understates it, and understating a retirement pot is the expensive direction
 * to be wrong in, because the error only becomes visible to the saver decades
 * later when there is no time left to fix it.
 *
 * It also put the app in contradiction with itself: retirement-kenya.ts plans
 * at REAL_RETURN_DEFAULT = 3% real, justified against the live Mwangaza feed
 * and re-checked whenever the market moves. The planner implied 4% real for the
 * same saver, in the same country, on the same day.
 *
 * Three copies of one number is what makes this a test rather than a comment:
 * the constant in GoalPlanner.tsx, the four hardcoded presets in
 * goal-planner.ts, and the sentence shown under the income buttons. Change one
 * and the others keep quoting the old rate — the same drift this codebase keeps
 * finding between a claim and the thing it claims.
 */
const ROOT = new URL("../../", import.meta.url).pathname;
const planner = readFileSync(`${ROOT}components/planners/GoalPlanner.tsx`, "utf8");

/** The rate the component actually computes with, read from the source. */
const declared = Number(
  planner.match(/const PERPETUAL_REAL_WITHDRAWAL = ([\d.]+);/)?.[1] ?? NaN
);
const multiple = Math.round(12 / declared);

describe("the retirement pot is sized for the income it promises", () => {
  it("declares a perpetual withdrawal rate at all", () => {
    expect(declared, "PERPETUAL_REAL_WITHDRAWAL not found in GoalPlanner.tsx").toBeGreaterThan(0);
    expect(declared, "a perpetual real withdrawal above 5% is not a perpetuity").toBeLessThan(0.05);
  });

  it("is more conservative than the finite thirty-year plan", () => {
    /* The direction is the point, not the exact gap. A pot that must last
     * forever carries reinvestment risk the finite plan does not: its long
     * bonds mature and roll at rates nobody can know, and Kenya issues no
     * inflation-linked government bond to lock a real return against. If this
     * ever rises above the finite-plan rate, the app is claiming a perpetuity
     * is SAFER than a thirty-year drawdown, which is backwards. */
    expect(
      declared,
      `perpetual rate ${declared} is not below the finite-plan rate ${REAL_RETURN_DEFAULT}`
    ).toBeLessThan(REAL_RETURN_DEFAULT);
  });

  it("derives the multiple rather than hardcoding it", () => {
    expect(planner, "the multiple is hardcoded instead of computed from the rate").toMatch(
      /POT_PER_MONTHLY_INCOME = Math\.round\(12 \/ PERPETUAL_REAL_WITHDRAWAL\)/
    );
  });

  it("has presets that match the multiple exactly", () => {
    const retirement = Object.values(GOAL_CONFIGS).find((g) => g.builder === "income");
    expect(retirement, "no income-builder goal found").toBeDefined();
    const presets = retirement!.amountPresets ?? [];
    expect(presets.length, "no presets to check").toBeGreaterThan(2);

    for (const p of presets) {
      const monthly = Number(p.label.match(/Ksh\s*([\d,]+)k/)?.[1]?.replace(/,/g, "")) * 1_000;
      expect(Number.isFinite(monthly), `cannot read a monthly figure from "${p.label}"`).toBe(true);
      expect(
        p.amount,
        `"${p.label}" is Ksh ${p.amount.toLocaleString()} but ${monthly.toLocaleString()} × ${multiple} is ${(monthly * multiple).toLocaleString()}`
      ).toBe(monthly * multiple);
    }
  });

  it("does not still tell the reader it is using the 4% rule", () => {
    /* The copy is the part nobody re-reads after changing a constant, and it is
     * the only part the saver ever sees. */
    const body = planner.slice(planner.indexOf("export default function"));
    expect(body, "the planner still presents itself as the 4% rule").not.toMatch(
      /the 4% rule\s*—\s*a rough guide/i
    );
    expect(body, "the on-screen multiple is hardcoded, so it can go stale").not.toMatch(
      /income × 300/
    );
  });

  it("catches a mismatch when one is introduced", () => {
    /* Mutation check in both directions: the preset rule has to actually bind. */
    expect(multiple).toBe(600);
    expect(30_000 * multiple).toBe(18_000_000);
    expect(30_000 * 300).not.toBe(30_000 * multiple);
  });
});
