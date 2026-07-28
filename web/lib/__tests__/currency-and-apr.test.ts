import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { formatKES } from "../budget";
import { calculateFulizaCost } from "../fuliza";

describe("money is written Ksh", () => {
  it("never emits the ISO code", () => {
    for (const v of [0, 1, 999, 1_000, 31_318_382, -500]) {
      expect(formatKES(v), `formatKES(${v})`).not.toContain("KES");
      expect(formatKES(v), `formatKES(${v})`).toContain("Ksh");
    }
  });

  it("groups thousands", () => {
    expect(formatKES(31_318_382)).toBe("Ksh 31,318,382");
    expect(formatKES(0)).toBe("Ksh 0");
  });

  it("puts the minus before the unit, not after it", () => {
    // "Ksh -500" reads as a quantity of some negative currency.
    expect(formatKES(-500)).toBe("-Ksh 500");
  });

  it("does not print NaN at a reader", () => {
    expect(formatKES(NaN)).toBe("Ksh 0");
  });
});

/**
 * The APR is already a percentage. Multiplying it again is a hundredfold lie.
 *
 * `calculateFulizaCost` returns `annualisedApr` in PERCENT — 219 means 219%.
 * The tariff rewrite changed it to those units and three of the four places
 * that display it kept multiplying by 100, so the page, the PDF and the
 * WhatsApp share text all announced "21900% APR" on a Ksh 5,000 balance.
 *
 * The fourth place did not, so the same component printed 219% and 21,900%
 * on one screen — and that is what makes this worth a permanent guard rather
 * than a one-line correction. A figure that is wrong everywhere gets reported.
 * A figure that is wrong in three places out of four looks like a rendering
 * quirk, and the tool that exists to say "this credit is expensive" spends its
 * credibility arguing something absurd.
 *
 * The unit test and the source scan below catch the two different ways this
 * can come back: someone changing the units, and someone re-adding the scale.
 */
describe("the Fuliza APR is quoted in the units it is returned in", () => {
  it("returns percent, not a fraction", () => {
    const r = calculateFulizaCost(5_000, 30);
    // Ksh 25/day + 20% excise = 30/day. 30 x 365 / 5000 = 219%.
    expect(r.annualisedApr).toBeCloseTo(219, 0);
    // The guard against a silent switch back to a 0-1 fraction: every real
    // Fuliza borrowing is triple-digit APR, so a value below 1 is a unit slip.
    for (const p of [150, 1_000, 5_000, 10_000, 50_000]) {
      expect(calculateFulizaCost(p, 30).annualisedApr).toBeGreaterThan(1);
    }
  });

  it("is never scaled by a further 100 anywhere it is displayed", () => {
    const src = readFileSync(
      join(new URL("../../", import.meta.url).pathname, "components/tools/FulizaCostCalculator.tsx"),
      "utf8"
    ).replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");
    const offenders = src.match(/annualisedApr\s*\*\s*100/g) ?? [];
    expect(
      offenders,
      "annualisedApr is already a percentage — multiplying by 100 prints 21900% for a 219% loan"
    ).toEqual([]);
  });

  it("stays consistent with the share message and the loan comparison", () => {
    // loan-comparison divides by 100 to get a fraction; if the units ever move,
    // these two stop agreeing and one of the tools is wrong.
    const cost = calculateFulizaCost(5_000, 30);
    expect(cost.annualisedApr / 100).toBeCloseTo(cost.dailyFee * 365 / 5_000, 10);
  });
});
