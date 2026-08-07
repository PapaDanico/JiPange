import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { amountOrZero, positiveAmount, round2 } from "../money";

/**
 * money.ts had no tests, and ten modules import round2 — including the tax
 * engine, where it produces the number on somebody's payslip comparison.
 */

describe("round2", () => {
  it("rounds to two places", () => {
    expect(round2(1.234)).toBe(1.23);
    expect(round2(1.235)).toBe(1.24);
    expect(round2(1.005)).toBe(1.01); // the case bare Math.round gets wrong
  });

  it("leaves whole numbers and zero alone", () => {
    expect(round2(0)).toBe(0);
    expect(round2(100)).toBe(100);
    expect(Object.is(round2(0), 0)).toBe(true); // not -0, which formats as "-0"
  });

  it("handles negatives without flipping the direction", () => {
    expect(round2(-1.234)).toBe(-1.23);
    expect(round2(-1.005)).toBeCloseTo(-1, 2);
  });

  it("does not turn a large salary into a rounding artefact", () => {
    expect(round2(1_234_567.891)).toBe(1_234_567.89);
  });

  /* Documents the limit rather than pretending there isn't one: the
   * +EPSILON trick fixes the common decimal cases and cannot fix binary
   * representation in general. Recorded so nobody "fixes" it by accident. */
  it("is not exact arithmetic, and this is the boundary", () => {
    expect(Number.isFinite(round2(0.1 + 0.2))).toBe(true);
    expect(round2(0.1 + 0.2)).toBe(0.3);
  });
});

describe("amountOrZero", () => {
  it("defaults blanks and junk to zero, as the idiom promises", () => {
    for (const empty of ["", " ", "abc", null, undefined, NaN, "-5", "0"]) {
      expect(amountOrZero(empty), `${JSON.stringify(empty)}`).toBe(0);
    }
  });

  it("takes ordinary amounts unchanged", () => {
    expect(amountOrZero("2500")).toBe(2500);
    expect(amountOrZero(19.99)).toBe(19.99);
  });

  /* The hole in `Number(x) || 0`: Infinity is truthy, so the fallback never
   * fires and Infinity poisons whatever it is added to. The idiom reads as
   * "a number, or nothing" and silently was not. */
  it("returns zero for Infinity, where `Number(x) || 0` returns Infinity", () => {
    expect(amountOrZero("1e400")).toBe(0);
    expect(Number("1e400") || 0).toBe(Infinity); // the behaviour replaced
  });
});

describe("positiveAmount", () => {
  it("takes ordinary amounts", () => {
    expect(positiveAmount("50000")).toBe(50000);
    expect(positiveAmount("1234.56")).toBe(1234.56);
    expect(positiveAmount(120000)).toBe(120000);
  });

  /* THE CASE THAT MOTIVATED IT. Number("1e400") is Infinity, which is truthy
   * and > 0, so the `!x || x <= 0` guard used across the calculators lets it
   * reach the engine and NaN comes back. */
  it("rejects Infinity, which the old guard let through", () => {
    expect(positiveAmount("1e400")).toBeNull();
    expect(positiveAmount(Infinity)).toBeNull();
    expect(positiveAmount(-Infinity)).toBeNull();
    // Proof the old guard really did admit it — if this ever fails, the
    // premise of this function has changed and it should be re-read.
    const old = Number("1e400");
    expect(!old || old <= 0).toBe(false);
  });

  it("rejects everything that is not a positive number", () => {
    for (const bad of ["", " ", "abc", "-5", "0", null, undefined, NaN, {}, []]) {
      expect(positiveAmount(bad), `${JSON.stringify(bad)} was accepted`).toBeNull();
    }
  });

  it("accepts a very large but finite salary", () => {
    // The point is to block the impossible, not to editorialise about wealth.
    expect(positiveAmount("999999999")).toBe(999999999);
  });
});

/**
 * A RATCHET, NOT A CLEAN BILL OF HEALTH.
 *
 * The unsafe pattern started at 55 call sites across 24 files. The payroll
 * paths and every `Number(x) || 0` site are converted; 37 remain, each of the
 * form `Number(x)` followed by a hand-written `!x || x <= 0`. Converting those
 * changes control flow rather than an expression, so they go one at a time
 * with the calculator's own tests watching, not in a sweep.
 *
 * This test fails if that count GROWS. It does not pass because the codebase
 * is clean — it passes because the debt is not getting worse, and the number
 * below is the honest size of what is left. Lower it as sites are converted;
 * never raise it.
 */
describe("the unguarded-parse debt does not grow", () => {
  const REMAINING = 37;

  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const p = join(dir, name);
      if (name === "__tests__") return [];
      if (statSync(p).isDirectory()) return walk(p);
      return /\.tsx?$/.test(name) ? [p] : [];
    });

  it(`has no more than ${REMAINING} unguarded Number() parses left`, () => {
    const files = walk(new URL("../../components", import.meta.url).pathname);
    expect(files.length, "found no components — this count would be vacuous").toBeGreaterThan(20);

    const sites = files.flatMap((f) => {
      const src = readFileSync(f, "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, " ")
        .replace(/^\s*\/\/.*$/gm, " ");
      // `= Number(...)` assignments, excluding event handlers reading a
      // controlled input's value (those feed setState, not an engine).
      return (src.match(/=\s*Number\((?!e\.target)/g) ?? []).map(() => f);
    });

    expect(
      sites.length,
      `unguarded Number() parses went from ${REMAINING} to ${sites.length}. ` +
        `Use positiveAmount() from @/lib/money — it rejects Infinity, which ` +
        `\`!x || x <= 0\` does not. If you converted sites, LOWER the constant.`
    ).toBeLessThanOrEqual(REMAINING);
  });
});
