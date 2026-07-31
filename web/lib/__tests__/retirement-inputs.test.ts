import { describe, it, expect } from "vitest";
import { planKenyanRetirement } from "../retirement-kenya";

/**
 * The model's boundary, tested for the failure that is worse than a crash.
 *
 * WHY THIS FILE EXISTS
 *
 * `Math.max(0, NaN)` is NaN, and `x ?? default` passes NaN through. Every
 * clamp and every default in planKenyanRetirement therefore LOOKED like input
 * validation and none of it was. A NaN monthly expense returned a NaN
 * capitalRequiredKes sitting next to a finite, believable PRMF contribution of
 * about 15,300 a month — one obviously broken number and one that reads fine,
 * on the same card. A reader discounts the broken half and trusts the rest.
 *
 * The app's own callers happen to be safe (`Number(x) || 0` collapses NaN to
 * zero), so nothing user-facing was wrong. But the module is exported for
 * licensing, and a licensee handing it a parsed form field should not get
 * arithmetic soup. That is why this is tested at the module boundary rather
 * than at the form.
 *
 * WHAT THESE ASSERT, AND WHAT THEY DELIBERATELY DO NOT
 *
 * Not the values — those are the job of the model tests next door. Only that
 * every number coming out is a NUMBER, whatever went in. Asserting particular
 * outputs for garbage inputs would freeze the fallbacks into the test suite
 * and make legitimate changes to them look like regressions.
 */

/** Every numeric leaf of the result, so a NaN cannot hide in a nested field. */
function numbersIn(value: unknown, path = "result"): [string, number][] {
  if (typeof value === "number") return [[path, value]];
  if (Array.isArray(value)) {
    return value.flatMap((v, i) => numbersIn(v, `${path}[${i}]`));
  }
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([k, v]) => numbersIn(v, `${path}.${k}`));
  }
  return [];
}

function expectAllFinite(result: unknown, label: string) {
  const numbers = numbersIn(result);
  /* Vacuity guard. A walker that finds nothing passes every assertion below
   * and proves nothing — this codebase has already shipped one guard that
   * scanned zero files and reported success five times. */
  expect(numbers.length, "the result walker found no numbers at all").toBeGreaterThan(10);
  for (const [path, n] of numbers) {
    expect(Number.isFinite(n), `${label}: ${path} is ${n}`).toBe(true);
  }
}

const SANE = {
  currentAge: 35,
  retirementAge: 60,
  currentMonthlyExpenses: 135_000,
  currentMonthlyMedical: 15_000,
};

describe("the retirement model's input boundary", () => {
  it("survives NaN in every numeric input, one at a time", () => {
    /* One at a time rather than all at once: an all-NaN case can pass by
     * accident if a single early guard short-circuits the whole computation,
     * which would hide the other nine unsanitised reads. */
    const keys = [
      "currentAge",
      "retirementAge",
      "currentMonthlyExpenses",
      "currentMonthlyMedical",
      "currentCapital",
      "monthlyContribution",
      "realReturn",
      "medicalRealEscalation",
      "livingRealDecline",
      "livingReplacement",
      "planningHorizonAge",
    ] as const;

    for (const key of keys) {
      const r = planKenyanRetirement({ ...SANE, [key]: Number.NaN });
      expectAllFinite(r, `${key}=NaN`);
    }
  });

  it("survives Infinity, which NaN checks alone would let through", () => {
    /* `Number.isFinite` rejects both; `Number.isNaN` would not. Written down
     * so a future simplification to isNaN fails here rather than in the wild. */
    for (const bad of [Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      expectAllFinite(
        planKenyanRetirement({ ...SANE, currentMonthlyExpenses: bad }),
        `expenses=${bad}`
      );
    }
  });

  it("survives the ordinary awkward cases too", () => {
    const cases: Record<string, Parameters<typeof planKenyanRetirement>[0]> = {
      "retiring today": { ...SANE, currentAge: 60 },
      "already past retirement": { ...SANE, currentAge: 70, retirementAge: 60 },
      "zero everything": {
        currentAge: 0,
        retirementAge: 0,
        currentMonthlyExpenses: 0,
        currentMonthlyMedical: 0,
      },
      "zero real return": { ...SANE, realReturn: 0 },
      "negative expenses": { ...SANE, currentMonthlyExpenses: -50_000 },
      "horizon before retirement": { ...SANE, planningHorizonAge: 40 },
    };
    for (const [label, input] of Object.entries(cases)) {
      expectAllFinite(planKenyanRetirement(input), label);
    }
  });

  it("keeps a NaN out of the PRMF split specifically", () => {
    /* The original symptom, pinned. The PRMF card is the place a broken total
     * sat beside a plausible contribution, so it gets its own assertion rather
     * than relying on the sweep above to happen to cover it. */
    const r = planKenyanRetirement({ ...SANE, currentMonthlyExpenses: Number.NaN });
    expect(Number.isFinite(r.capitalRequiredKes)).toBe(true);
    expect(Number.isFinite(r.prmf.targetKes)).toBe(true);
    expect(Number.isFinite(r.prmf.livingOnlyCapitalKes)).toBe(true);
    expect(Number.isFinite(r.prmf.monthlyContributionKes)).toBe(true);
    expect(
      Math.round(r.prmf.targetKes + r.prmf.livingOnlyCapitalKes),
      "the split stops adding up once an input is garbage"
    ).toBe(Math.round(r.capitalRequiredKes));
  });
});
