import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { GOAL_CONFIGS } from "../goal-planner";
import { LIVING_REPLACEMENT_AT_RETIREMENT, REAL_RETURN_DEFAULT } from "../retirement-kenya";

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

/* Replacement comes from the SHARED constant, which the planner imports rather
 * than restating — that sharing is the fix for the 1.79x disagreement between
 * the two retirement tools, so the test reads it the same way the code does. */
const replacement = LIVING_REPLACEMENT_AT_RETIREMENT;
const withdrawal = Number(planner.match(/const WITHDRAWAL_DEFAULT = ([\d.]+);/)?.[1] ?? NaN);
const multiple = (replacement * 12) / withdrawal;

describe("the retirement pot is sized for the income it promises", () => {
  it("declares both rates, because one alone cannot size a pot", () => {
    expect(planner, "the planner restates the replacement rate instead of importing it").toMatch(
      /const REPLACEMENT_DEFAULT = LIVING_REPLACEMENT_AT_RETIREMENT;/
    );
    expect(replacement, "the shared replacement rate is missing").toBeGreaterThan(0);
    expect(replacement, "a replacement rate above 1 means spending MORE once retired").toBeLessThanOrEqual(1);
    expect(withdrawal, "WITHDRAWAL_DEFAULT not found").toBeGreaterThan(0);
    expect(withdrawal, "a withdrawal above 10% is not a retirement plan").toBeLessThan(0.1);
  });

  it("keeps the arithmetic in one function rather than spread across the file", () => {
    expect(planner, "potFor() is gone — the formula has been inlined somewhere").toMatch(
      /function potFor\(monthlyNow: number, replacement: number, withdrawal: number\)/
    );
    expect(planner).toMatch(/\(monthlyNow \* replacement \* 12\) \/ withdrawal/);
  });

  it("has presets that match both defaults exactly", () => {
    const retirement = Object.values(GOAL_CONFIGS).find((g) => g.builder === "income");
    expect(retirement, "no income-builder goal found").toBeDefined();
    const presets = retirement!.amountPresets ?? [];
    expect(presets.length, "no presets to check").toBeGreaterThan(2);

    for (const p of presets) {
      const monthly = Number(p.label.match(/Ksh\s*([\d,]+)k/)?.[1]?.replace(/,/g, "")) * 1_000;
      expect(Number.isFinite(monthly), `cannot read a monthly figure from "${p.label}"`).toBe(true);
      expect(
        p.amount,
        `"${p.label}" is Ksh ${p.amount.toLocaleString()} but ${monthly.toLocaleString()} x ${replacement} x 12 / ${withdrawal} is ${(monthly * multiple).toLocaleString()}`
      ).toBe(Math.round(monthly * multiple));
    }
  });

  it("tells the reader which direction the withdrawal rate moves the pot", () => {
    /* This is the whole reason both rates are on screen. Lowering the draw
     * ENLARGES the pot — pot = income / rate — and the opposite is the
     * intuition almost everyone brings, including the two people who changed
     * this page today. A reader who drags the slider down expecting a smaller
     * number must be told before they act on it. */
    const body = planner.slice(planner.indexOf("export default function"));
    expect(body, "the page does not warn that a lower draw needs a bigger pot").toMatch(
      /bigger<\/strong> pot|bigger pot/i
    );
  });

  it("promises an income for life only when the draw could actually sustain one", () => {
    /* The test is against the app's OWN return assumption, not a hardcoded
     * threshold. A pot lasts forever only if you withdraw no more than it
     * earns in real terms; retirement-kenya.ts fixes that at
     * REAL_RETURN_DEFAULT, justified against the live Mwangaza feed.
     *
     * Draw more than it earns and the pot depletes — which is fine, and is
     * what the 4% default now is, but then the page must not say "for life".
     * Keying on the constant means that if the feed ever justifies a different
     * real return, this moves with it instead of quietly going stale. */
    const retirement = Object.values(GOAL_CONFIGS).find((g) => g.builder === "income");
    if (withdrawal > REAL_RETURN_DEFAULT) {
      expect(
        retirement!.tagline,
        `drawing ${withdrawal * 100}% against a ${REAL_RETURN_DEFAULT * 100}% real return depletes the pot, so the tagline must not promise an income for life`
      ).not.toMatch(/for life/i);
    }
  });

  it("catches a preset that stops matching the rates", () => {
    /* Mutation check both ways: the binding has to actually bite. */
    expect(multiple).toBe(150);
    expect(Math.round(150_000 * multiple)).toBe(22_500_000);
    expect(Math.round(30_000 * multiple)).toBe(4_500_000);
    expect(Math.round(150_000 * 300)).not.toBe(Math.round(150_000 * multiple));
  });
});
