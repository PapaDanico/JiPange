import { describe, expect, it } from "vitest";
import { computeReadiness } from "../readiness";
import { calculateFinancials, BUDGET_ALLOCATION } from "../budget";
import type { JourneyAnswers } from "../journey";

/**
 * The readiness card had an indicator that could only ever say one thing.
 *
 * `calculations.savingsRate` is `(netMonthly * 0.2) / netMonthly` — the app's
 * own recommended allocation divided back out — so it is 0.2 for every reader
 * with income. The old "Savings Rate" indicator rounded that to 20, hit its
 * `rate >= 20` branch and reported "20% · Strong" to everybody, with its
 * `good`, `building` and `risk` branches unreachable by any input.
 *
 * A reader saving nothing was congratulated in the same words as a reader
 * saving a third of their pay. The app had no way to tell them apart, because
 * it never asked.
 *
 * There were no tests on this module at all, which is how it survived.
 */
const journey = (over: Partial<JourneyAnswers> = {}): JourneyAnswers =>
  ({
    life_stage: "building",
    income_zone: "mid",
    primary_goal: "grow_wealth",
    liquidity_leak: "active_savings",
    current_vehicle: ["mmf"],
    ...over,
  }) as JourneyAnswers;

const savingsOf = (gross: number) =>
  computeReadiness(calculateFinancials(gross), journey(), false)!.indicators.find(
    (i) => i.key === "savings"
  )!;

describe("the savings indicator states a target, not a grade", () => {
  it("never reports a readiness grade for a number the reader did not supply", () => {
    /* The specific regression: any grade here is a claim about the reader's
     * behaviour, and the app has no evidence for one. */
    for (const gross of [20_000, 50_000, 120_000, 400_000, 1_000_000]) {
      const s = savingsOf(gross);
      expect(
        ["strong", "good", "building", "risk"],
        `a Ksh ${gross} salary is graded "${s.status}" on savings the app never asked about`
      ).not.toContain(s.status);
      expect(s.status).toBe("target");
    }
  });

  it("says something that actually varies with the reader", () => {
    /* The old label was "20%" for everyone. If the replacement is also
     * constant it has fixed the wording and kept the defect. */
    const labels = [20_000, 50_000, 120_000, 400_000].map((g) => savingsOf(g).statusLabel);
    expect(new Set(labels).size, `every salary shows the same figure: ${labels.join(", ")}`).toBe(
      labels.length
    );
  });

  it("is the allocation applied to this reader's own take-home", () => {
    const gross = 120_000;
    const fin = calculateFinancials(gross);
    const shown = savingsOf(gross).statusLabel;
    const expected = Math.round(fin.netMonthly * BUDGET_ALLOCATION.savings);
    // Rendered with thousands separators; compare on digits alone.
    expect(shown.replace(/[^\d]/g, "")).toBe(String(expected));
  });

  it("tells the reader it is a plan rather than a measurement", () => {
    const s = savingsOf(75_000);
    expect(s.hint, "nothing warns that this is not what they actually save").toMatch(
      /not a measure|plan, not/i
    );
  });

  it("still says nothing at all without a salary", () => {
    const none = computeReadiness(null, journey(), false)!.indicators.find(
      (i) => i.key === "savings"
    )!;
    expect(none.status).toBe("unknown");
    expect(none.statusLabel).toBe("No data");
  });
});

describe("computeReadiness overall", () => {
  it("returns nothing when it knows nothing", () => {
    expect(computeReadiness(null, null, false)).toBeNull();
  });

  it("gives every indicator a key, a label and a status", () => {
    const d = computeReadiness(calculateFinancials(80_000), journey(), true)!;
    expect(d.indicators.length).toBe(4);
    for (const i of d.indicators) {
      expect(i.key, "an indicator has no key").toBeTruthy();
      expect(i.label, `${i.key} has no label`).toBeTruthy();
      expect(i.statusLabel, `${i.key} has no status label`).toBeTruthy();
    }
    expect(new Set(d.indicators.map((i) => i.key)).size).toBe(4);
  });

  it("reaches a risk grade where it genuinely has evidence", () => {
    /* The other indicators DO rest on answers the reader gave, so their
     * grades are earned. If none of them can reach "risk" the card is
     * incapable of warning anyone and is decoration. */
    const d = computeReadiness(
      calculateFinancials(80_000),
      journey({ liquidity_leak: "mobile_loans", current_vehicle: ["none"] }),
      false
    )!;
    expect(d.indicators.filter((i) => i.status === "risk").length).toBeGreaterThan(0);
  });
});
