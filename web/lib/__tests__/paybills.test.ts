import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { PAYBILLS, isStale, paybillFor } from "../paybills";
import type { PaybillKey } from "../paybills";

/**
 * These are the numbers that move money. The tests are correspondingly mean.
 */

const keys = Object.keys(PAYBILLS) as PaybillKey[];

describe("the paybill registry", () => {
  it("covers every vehicle the action plan offers", () => {
    // Guards against a refactor that empties the registry and leaves every
    // loop below iterating over nothing, green and meaningless.
    expect(keys.sort()).toEqual(["ifb", "mmf", "sacco"]);
  });

  it.each(keys)("%s is complete", (key) => {
    const p = PAYBILLS[key];
    expect(p.provider.length).toBeGreaterThan(3);
    // A Kenyan paybill is 5-7 digits. Anything else is a typo or a placeholder,
    // and a placeholder that reaches the clipboard is the failure mode.
    expect(p.paybill, `"${p.paybill}" is not a plausible paybill`).toMatch(/^\d{5,7}$/);
    expect(p.account.length, "no account guidance").toBeGreaterThan(4);
    // routeIn is what the user gets when the number is suppressed. If it is
    // vague the suppression branch is useless and they are simply stuck.
    expect(p.routeIn.length, "no route in for the suppressed case").toBeGreaterThan(10);
  });

  it.each(keys)("%s has dates that make sense", (key) => {
    const p = PAYBILLS[key];
    const iso = /^\d{4}-\d{2}-\d{2}$/;
    expect(p.verifiedOn).toMatch(iso);
    expect(p.reviewBy).toMatch(iso);
    expect(p.reviewBy > p.verifiedOn, "reviewBy must be after verifiedOn").toBe(true);
  });
});

/**
 * THE SUPPRESSION MUST ACTUALLY SUPPRESS.
 *
 * Asserting that today's output looks right would pass just as well against
 * `isStale = () => false`. The clock is wound to both sides.
 */
describe("the staleness gate fires", () => {
  const FAR_FUTURE = "2099-01-01";
  const FAR_PAST = "2000-01-01";

  it.each(keys)("%s is withheld once past its review date", (key) => {
    expect(isStale(key, FAR_FUTURE)).toBe(true);
    expect(
      paybillFor(key, FAR_FUTURE),
      "a past-due paybill was still returned — it would render beside a copy button"
    ).toBeNull();
  });

  it.each(keys)("%s is shown while still in date", (key) => {
    expect(isStale(key, FAR_PAST)).toBe(false);
    expect(paybillFor(key, FAR_PAST)).toEqual(PAYBILLS[key]);
  });

  it.each(keys)("%s flips on the day after its review date, not before", (key) => {
    const p = PAYBILLS[key];
    expect(isStale(key, p.reviewBy), "reviewBy itself is still in date").toBe(false);
    const dayAfter = new Date(Date.parse(p.reviewBy) + 86_400_000).toISOString().slice(0, 10);
    expect(isStale(key, dayAfter)).toBe(true);
  });

  it("shows all three today — so a green suite here means something", () => {
    /* If every paybill were already past due, the suppression tests above
     * would pass trivially and the component would be rendering the fallback
     * everywhere without anyone noticing the shortcut had gone. */
    for (const key of keys) expect(paybillFor(key)).not.toBeNull();
  });
});

/**
 * NO PAYMENT NUMBER MAY BE TYPED ANYWHERE ELSE.
 *
 * This is not hypothetical. Britam's `500005` was in TWO files:
 *
 *   components/journey/JourneyActionPlan.tsx   paybill: "500005"
 *   lib/affiliate-links.ts                     "...contribute via Paybill 500005"
 *
 * Two copies of an account number, in different modules, with nothing
 * connecting them. Correcting one would have left the other sending money to
 * the old account, and the correction would have looked done — which is
 * exactly the defect lib/sources.ts was built to remove, in the one field
 * where the cost is not a wrong impression but a wrong transfer.
 */
describe("no file restates a paybill as a literal", () => {
  const roots = ["../../components", "../../app", "../../lib"];

  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const p = join(dir, name);
      if (name === "__tests__" || name === "node_modules") return [];
      if (statSync(p).isDirectory()) return walk(p);
      return /\.tsx?$/.test(name) ? [p] : [];
    });

  const files = roots
    .flatMap((r) => walk(new URL(r, import.meta.url).pathname))
    // The registry is where they are supposed to live.
    .filter((f) => !f.endsWith("lib/paybills.ts"));

  it("scans a real set of files", () => {
    expect(files.length, "found nothing — the scan below is vacuous").toBeGreaterThan(20);
  });

  /**
   * Comments are stripped: a comment cannot move money, and the note in
   * affiliate-links.ts recording why a number was removed would otherwise
   * report itself forever. A guard that fails on its own documentation is a
   * guard that gets deleted.
   */
  const rendered = (path: string) =>
    readFileSync(path, "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, " ")
      .replace(/^\s*\/\/.*$/gm, " ");

  it.each(keys)("%s's number appears only via the registry", (key) => {
    const n = PAYBILLS[key].paybill;
    const re = new RegExp(`(?<![\\d])${n}(?![\\d])`);
    const offenders = files.filter((f) => re.test(rendered(f)));
    expect(
      offenders,
      `paybill ${n} (${PAYBILLS[key].provider}) is typed literally in these ` +
        `files. Import it from @/lib/paybills so a correction reaches every ` +
        `place it is shown:\n${offenders.join("\n")}`
    ).toEqual([]);
  });
});
