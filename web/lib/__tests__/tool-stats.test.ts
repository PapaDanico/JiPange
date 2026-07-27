import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { calculateNetPay, PENSION_RELIEF_CAP_MONTHLY } from "../tax";
import {
  pensionReliefSavingMonthly,
  pensionReliefSavingAnnual,
  raiseWorthAnnual,
  EXAMPLE_RAISE_KES,
  EXAMPLE_BASE_SALARY_KES,
  PENSION_EXAMPLE_SALARY_KES,
} from "../tool-stats";

/**
 * A headline figure may not contradict the calculator underneath it.
 *
 * Three did. Each was a string typed into a tool page, sitting directly above
 * the engine that computes the right answer, and no test in this repository
 * could see any of them:
 *
 *   tax-shield          Ksh 72,000/yr   -> 108,000   (the pre-2024 pension cap)
 *   salary-negotiation  Ksh 108,000/yr  -> 113,085   (marginal rates summed,
 *                                                     not applied in order)
 *   take-home-pay       Ksh 4,500/mo    -> 9,000     (contradicted tax-shield
 *                                                     on the same site)
 *
 * The last one is the one to remember: two pages of the same product answered
 * the same question differently, in the largest type on each page, for as long
 * as both existed.
 */

describe("the headline figures come from the engine", () => {
  it("values the pension relief the way the tax engine does", () => {
    const without = calculateNetPay(PENSION_EXAMPLE_SALARY_KES).netMonthly;
    const withRelief = calculateNetPay(PENSION_EXAMPLE_SALARY_KES, {
      pensionContribution: PENSION_RELIEF_CAP_MONTHLY,
    }).netMonthly;
    expect(pensionReliefSavingMonthly()).toBeCloseTo(withRelief - without, 6);
    expect(pensionReliefSavingAnnual()).toBeCloseTo(pensionReliefSavingMonthly() * 12, 6);
  });

  it("does not double-count the contribution itself", () => {
    /* The first version of this returned Ksh 39,000 a month, because it added
     * the 30,000 contribution back on top of a netMonthly that had never
     * subtracted it. That was obvious enough to catch by eye. This pins it so
     * a subtler version of the same mistake cannot get through: the saving is
     * PAYE forgone, so it can never exceed the contribution that bought it. */
    expect(pensionReliefSavingMonthly()).toBeLessThan(PENSION_RELIEF_CAP_MONTHLY);
    expect(pensionReliefSavingMonthly()).toBeGreaterThan(0);
  });

  it("values a raise by running both salaries, not by summing rates", () => {
    const before = calculateNetPay(EXAMPLE_BASE_SALARY_KES).netMonthly;
    const after = calculateNetPay(EXAMPLE_BASE_SALARY_KES + EXAMPLE_RAISE_KES).netMonthly;
    expect(raiseWorthAnnual()).toBeCloseTo((after - before) * 12, 6);

    /* NSSF, SHIF and the housing levy are deducted BEFORE PAYE is assessed, so
     * adding the marginal rates together overstates the bite. The old figure
     * did exactly that and came out ~5,000/yr light. Assert the real answer
     * beats the naive one, which is the direction the ordering guarantees. */
    const naive = EXAMPLE_RAISE_KES * (1 - (0.3 + 0.06 + 0.0275 + 0.015)) * 12;
    expect(raiseWorthAnnual()).toBeGreaterThan(naive);
    // And a raise can never be worth more after tax than before it.
    expect(raiseWorthAnnual()).toBeLessThan(EXAMPLE_RAISE_KES * 12);
  });
});

/**
 * No tool page may state a JiPange-computed figure as a literal.
 *
 * Scoped deliberately to stats we attribute to OURSELVES. Most hero stats
 * quote an outside body — a KRA report, a FinAccess survey — and those are
 * prose, correctly hand-written with a citation. But a figure sourced to
 * JiPange is a claim that our own engine produced it, and that claim has to be
 * true. Of the eight making it, three were false.
 */
describe("figures we attribute to ourselves are actually ours", () => {
  const toolsDir = join(new URL("../../", import.meta.url).pathname, "app/tools");

  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((n) => {
      const p = join(dir, n);
      return statSync(p).isDirectory() ? walk(p) : /page\.tsx$/.test(n) ? [p] : [];
    });

  const pages = walk(toolsDir);

  it("scans a real set of tool pages", () => {
    expect(pages.length, "no tool pages found — the scan below is vacuous").toBeGreaterThan(20);
  });

  /**
   * The three that were wrong must now be interpolated rather than typed.
   *
   * Checked by shape: a `stat:` on these pages has to be a template literal
   * carrying a `${...}`, not a quoted string. That is a crude test and it is
   * the right one — the failure was precisely that a human could type a number
   * there, and this makes that impossible to do silently.
   */
  /**
   * Figures still credited to JiPange that nobody has traced to an engine.
   *
   * These are DEBT, listed rather than pardoned. Three of this class were
   * checked and all three were wrong, so the prior on the rest is not good —
   * but deriving them needs product decisions (what return does a "projection"
   * assume? whose market survey?), and blocking the build until someone makes
   * ten of those would get the guard deleted rather than the figures fixed.
   *
   * So the rule is: these ten may stay, and an ELEVENTH may not. Every new
   * figure credited to JiPange has to come from the engine. The list only
   * shrinks.
   *
   * Most suspicious of the ten, for whoever picks this up: salary's "≈37%"
   * total deduction rate. Statutory deductions asymptote to about 34% of gross
   * (30% PAYE + 6% NSSF on a capped band + 2.75% SHIF + 1.5% AHL, with the
   * last three deductible before PAYE), so 37% looks high rather than merely
   * unverified.
   */
  const UNVERIFIED = new Set([
    "debt-escape:32%/month",
    "education-savings:Ksh 1,500/mo",
    "fire-number:2× more",
    "fuliza-cost:~400%",
    "fuliza-cost:Ksh 3,000",
    "land-purchase:8–12%",
    "money-runway:15 months",
    "salary:≈37%",
    "savings-goal:Ksh 100,000+",
    "sha-health:Ksh 1,500–3,500/mo",
  ]);

  it("records exactly the known-unverified figures, and no more", () => {
    // If this shrinks, delete the entry — the list must never claim debt that
    // has been paid, or it becomes a place figures hide.
    expect(UNVERIFIED.size).toBe(10);
  });

  it("states no JiPange-attributed figure as a literal, on any tool page", () => {
    /* Pair each stat with the source declared just below it. A stat citing an
     * outside body is prose and stays prose — "80%+ of PAYE workers", cited to
     * a KRA report, is not ours to compute and must not be flagged. A stat
     * citing US is an assertion about our own engine, and must come FROM it. */
    const offenders: string[] = [];
    for (const page of pages) {
      const src = readFileSync(page, "utf8");
      for (const m of src.matchAll(/stat:\s*(`[^`]*`|"[^"]*")[\s\S]{0,240}?source:\s*"([^"]*)"/g)) {
        const [, stat, source] = m;
        const ours = /jipange/i.test(source);
        const isLiteral = stat.startsWith('"');
        const hasNumber = /\d/.test(stat);
        const slug = page.split("/app/")[1];
        const key = `${slug.replace("tools/", "").replace("/page.tsx", "")}:${stat.slice(1, -1)}`;
        if (ours && isLiteral && hasNumber && !UNVERIFIED.has(key)) {
          offenders.push(`${slug}: ${stat} — sourced "${source}"`);
        }
      }
    }
    expect(
      offenders,
      "these figures are credited to JiPange but typed by hand. Derive them " +
        "from lib/tool-stats.ts and interpolate, or cite whoever actually " +
        `produced them:\n  ${offenders.join("\n  ")}`
    ).toEqual([]);
  });

  /**
   * The specific stale values must not come back — on the pages they were on.
   *
   * Scoped to those pages rather than swept across all of them, which is a
   * correction to how I first wrote this. A repo-wide scan for "Ksh 72,000"
   * flagged savings-goal, where it is honest arithmetic in an unrelated
   * sentence: Ksh 2,000 a month for three years really is 72,000 flat. The
   * landing-page version of this guard could sweep everything because its
   * values were distinctive — "Ksh 370 billion" occurs nowhere by accident. A
   * round five-figure sum is not distinctive, and an unscoped guard that cries
   * wolf on correct code is worse than none.
   */
  const RETIRED = [
    {
      slug: "tax-shield",
      value: "Ksh 72,000",
      was: "the pension saving at the pre-Finance-Act-2024 cap of 20,000",
    },
    {
      slug: "take-home-pay",
      value: "Ksh 4,500",
      was: "a pension saving that contradicted tax-shield's own output",
    },
  ];

  it.each(RETIRED)("$slug no longer states $value", ({ slug, value, was }) => {
    const page = pages.find((p) => p.includes(`/${slug}/`))!;
    const src = readFileSync(page, "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, " ")
      .replace(/^\s*\/\/.*$/gm, " ");
    expect(src.includes(value), `"${value}" was retired from ${slug} — ${was}`).toBe(false);
  });
});
