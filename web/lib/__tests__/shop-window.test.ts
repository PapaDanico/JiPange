import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fulizaDailyFee } from "../fuliza";
import { TIERS } from "../tiers";
import { TOOL_META } from "../tool-meta";

const read = (p: string) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");

/**
 * The shop window has to say what the shop says.
 *
 * Three separate figures on the homepage and the support page had drifted from
 * the modules that own them, all in the same shape: a number typed into prose
 * beside a constant that says something else.
 *
 *   - "All 18 calculators" (homepage) vs "All 26 calculators" (tiers) vs 25 real
 *   - "Ksh 6.50/day ... 400%" for Fuliza, when the tariff computes Ksh 6.00 and
 *     365% for the same Ksh 600 balance
 *
 * Each was corrected in the tool and left standing in the marketing copy, which
 * is the version most readers see first.
 */
describe("the homepage figures are derived, not retyped", () => {
  /* Comments stripped before scanning.
   *
   * The first version of this guard failed on the comment that RECORDS the old
   * figures — "this page said All 18 calculators ... Ksh 6.50/day". A guard
   * that forbids naming the bug it prevents makes the code less explicable, so
   * it scans what ships rather than what explains it. */
  const home = read("app/page.tsx")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/^\s*\/\/.*$/gm, " ");

  it("states no literal calculator count", () => {
    expect(home, "a calculator count is hard-coded again").not.toMatch(/All \d+ calculators/);
    expect(home).toMatch(/All \{TOOL_COUNT\} calculators/);
  });

  it("agrees with the tier copy on how many calculators there are", () => {
    const free = TIERS.find((t) => t.id === "free")!;
    const claim = free.includes.find((line) => /calculators/.test(line))!;
    const stated = Number(claim.match(/(\d+)/)![1]);
    const actual = Object.keys(TOOL_META).filter((h) => h.startsWith("/tools/")).length;
    expect(stated, `tier copy says ${stated}, there are ${actual}`).toBe(actual);
  });

  it("quotes no literal Fuliza daily fee or headline APR", () => {
    // The tariff moves. When it does, the tool follows and prose does not.
    expect(home, "a Fuliza daily fee is hard-coded").not.toMatch(/Ksh 6\.50\/day/);
    expect(home, "a Fuliza APR is hard-coded").not.toMatch(/≈\d+%/);
  });

  it("derives a Fuliza headline that matches the tariff", () => {
    // The figures the page will render, computed the same way it computes them.
    const daily = fulizaDailyFee(600);
    expect(daily, "the Ksh 600 band fee is no longer Ksh 5.00 + 20% excise").toBeCloseTo(6, 2);
    expect(Math.round((daily * 365) / 600 * 100)).toBe(365);
  });
});

/**
 * A contact address nobody can reach is worse than none.
 *
 * Terms and About both published hello@jipangefinance.app. The site is .org,
 * so every "spotted an error? write to us" loop and every data-rights request
 * under the Data Protection Act went nowhere — silently, since a bounce goes
 * to the sender and never to us.
 */
describe("the published contact address", () => {
  it("uses a domain this site actually serves", () => {
    for (const p of ["app/terms/page.tsx", "app/about/page.tsx"]) {
      const src = read(p);
      expect(src, `${p} publishes the dead .app domain`).not.toMatch(/jipangefinance\.app/);
      expect(src, `${p} no longer publishes a contact address at all`).toMatch(
        /jipangefinance\.org/
      );
    }
  });
});
