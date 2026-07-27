import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { SOURCES, figure, cite, fulizaPerUserKsh, mmfShareOfDepositsPct } from "../sources";
import type { SourceKey } from "../sources";
import {
  FINACCESS_LITERACY_PASS_PCT,
  FINACCESS_LITERACY_FAIL_PCT,
  RBA_INCOME_MEETS_NEEDS_PCT,
  RBA_INCOME_FALLS_SHORT_PCT,
  BANK_DEPOSITS_TRILLION_KSH,
  MMF_AUM_BILLION_KSH,
  BANK_SAVINGS_EARNING_BELOW_INFLATION_TRILLION,
} from "../kenya-stats";

/**
 * The gate that makes the registry worth having.
 *
 * A file of numbers with sources attached is a filing cabinet. What turns it
 * into a guarantee is a test that fails when a figure goes stale, when a
 * citation is unfollowable, or when a number is typed into a page instead of
 * read from here — because those are the three ways this went wrong the first
 * time, and every one of them looked fine from the outside.
 */

const keys = Object.keys(SOURCES) as SourceKey[];

/**
 * "Today" comes from the clock, deliberately.
 *
 * A frozen date would make the staleness check pass forever, which is exactly
 * the failure it exists to catch — a check that cannot fail is not a check.
 * The cost is that this suite will one day go red without anyone touching the
 * code. That is the feature. Somebody then re-reads a publication.
 */
const today = new Date().toISOString().slice(0, 10);

describe("the source registry", () => {
  it("has entries", () => {
    // Guards against a refactor that empties the registry and leaves every
    // loop below iterating over nothing, green and meaningless.
    expect(keys.length).toBeGreaterThanOrEqual(9);
  });

  it.each(keys)("%s is fully attributed", (key) => {
    const s = SOURCES[key];
    expect(s.publisher.length, "no publisher").toBeGreaterThan(2);
    expect(s.title.length, "no publication title").toBeGreaterThan(4);
    expect(s.url, "citation URL must be https").toMatch(/^https:\/\/[^\s]+\.[a-z]{2,}/i);
    expect(s.unit.length, "no unit — a bare number is not a fact").toBeGreaterThan(4);
    expect(Number.isFinite(s.value)).toBe(true);
  });

  it.each(keys)("%s has dates that make sense", (key) => {
    const s = SOURCES[key];
    const iso = /^\d{4}-\d{2}-\d{2}$/;
    expect(s.asOf, `asOf "${s.asOf}" is not an ISO date`).toMatch(iso);
    expect(s.reviewBy, `reviewBy "${s.reviewBy}" is not an ISO date`).toMatch(iso);
    // A review date at or before the data date would expire on arrival.
    expect(s.reviewBy > s.asOf, "reviewBy must be after asOf").toBe(true);
  });

  /**
   * The gate itself.
   *
   * When this fails the fix is NOT to push the date out. It is to open the
   * URL in the record, read the current figure, and either confirm the value
   * or change it — and only then set a new review date from the publisher's
   * cadence. Moving the date alone converts a warning into a lie.
   */
  it.each(keys)("%s has not passed its review date", (key) => {
    const s = SOURCES[key];
    expect(
      s.reviewBy >= today,
      `${key} was due for review on ${s.reviewBy} (today is ${today}). ` +
        `Re-read ${s.url} — ${s.publisher}, ${s.title} — confirm or correct the ` +
        `value, THEN set a new reviewBy. Do not just move the date.`
    ).toBe(true);
  });

  it("builds a citation from the record rather than from a string somewhere", () => {
    expect(cite("mmfAumBillionKsh")).toContain("Capital Markets Authority");
    expect(cite("mmfAumBillionKsh")).toContain("Quarterly Report");
  });
});

describe("derived figures are derived, not restated", () => {
  it("keeps the literacy pass and fail rates summing to 100", () => {
    // These were two typed constants. One could be corrected without the other.
    expect(FINACCESS_LITERACY_PASS_PCT + FINACCESS_LITERACY_FAIL_PCT).toBeCloseTo(100, 6);
  });

  it("keeps the pensioner adequacy split summing to 100", () => {
    expect(RBA_INCOME_MEETS_NEEDS_PCT + RBA_INCOME_FALLS_SHORT_PCT).toBeCloseTo(100, 6);
  });

  it("computes the MMF share from the two figures it claims to compare", () => {
    const expected = (MMF_AUM_BILLION_KSH / 1000 / BANK_DEPOSITS_TRILLION_KSH) * 100;
    expect(mmfShareOfDepositsPct()).toBeCloseTo(expected, 9);
    // Sanity, in case a units slip turns billions into trillions: the whole
    // argument on the landing page is that this share is small.
    expect(mmfShareOfDepositsPct()).toBeGreaterThan(1);
    expect(mmfShareOfDepositsPct()).toBeLessThan(25);
  });

  it("leaves the below-inflation remainder equal to deposits minus MMFs", () => {
    expect(BANK_SAVINGS_EARNING_BELOW_INFLATION_TRILLION).toBeCloseTo(
      BANK_DEPOSITS_TRILLION_KSH - MMF_AUM_BILLION_KSH / 1000,
      1
    );
  });

  it("states Fuliza per borrower, at a magnitude a year of borrowing could reach", () => {
    const perUser = fulizaPerUserKsh();
    expect(perUser).toBeCloseTo(
      (figure("fulizaVolumeTrillionKsh") * 1e12) / (figure("fulizaUsersMillions") * 1e6),
      6
    );
    /* The figure this replaced was Ksh 254 — a per-TRANSACTION average
     * presented beside annual totals it had no arithmetic relationship to.
     * This asserts the new number is of annual size, so a future edit that
     * quietly reintroduces a per-tap figure here fails rather than reads
     * plausibly. */
    expect(perUser).toBeGreaterThan(10_000);
  });
});

/**
 * No figure from the registry may be retyped into a page.
 *
 * This is the check that would have caught the original defect. The constants
 * were right-ish and the copy was wrong, and nothing connected them: app/page.tsx
 * printed "Ksh 370 billion (7%)" and "Ksh 254" as literal text while importing
 * neither constant. Correcting kenya-stats.ts would have changed nothing a
 * visitor saw, and would have felt like a fix.
 */
describe("no page restates a registry figure as a literal", () => {
  const appDir = join(new URL("../../", import.meta.url).pathname, "app");

  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) return walk(p);
      return /\.tsx?$/.test(name) ? [p] : [];
    });

  const files = walk(appDir);

  /**
   * Source with comments removed.
   *
   * A comment cannot reach a visitor, and the comments that explain a retired
   * figure necessarily quote it — the note in app/page.tsx recording that the
   * page once said "Ksh 370 billion" would otherwise report itself forever.
   * A guard that fails on its own documentation is a guard that gets deleted.
   * What renders is what is scanned.
   */
  const rendered = (path: string) =>
    readFileSync(path, "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, " ")
      .replace(/^\s*\/\/.*$/gm, " ");

  it("scans a real set of pages", () => {
    expect(files.length, "found no app files — the scan below is vacuous").toBeGreaterThan(5);
  });

  /**
   * The other half, and the half that actually caught something.
   *
   * Checking that the CURRENT value is never typed out cannot find a SUPERSEDED
   * one — and superseded is the dangerous kind, because it is already on the
   * page and already looks settled. When these figures were corrected, two
   * further restatements of "Ksh 5 trillion / Ksh 370 billion" were still sitting
   * further down the same file, and the current-value scan walked straight past
   * them: it was looking for 6.52 and 442.2, which were nowhere yet.
   *
   * So each figure this project has stopped believing is named here, with what
   * it was wrong about. The list only grows.
   */
  const RETIRED: { value: string; was: string }[] = [
    { value: "Ksh 5 trillion", was: "bank deposits; CBK's figure is 6.52tn" },
    { value: "Ksh 370 billion", was: "MMF AUM; the CMA's Q1 2026 figure is 442.2bn" },
    { value: "Ksh 254", was: "a per-transaction Fuliza ticket that no source we hold supports" },
    { value: "Ksh 4.6T", was: "the below-inflation remainder, computed from the two wrong figures" },
    { value: "65% are dissatisfied", was: "a paraphrase; the RBA measured 32.2% adequacy" },
    { value: "compound interest, and risk", was: "FinAccess asked about interest rates" },
  ];

  it.each(RETIRED)("no page still says $value", ({ value, was }) => {
    const offenders = files.filter((f) => rendered(f).includes(value));
    expect(
      offenders,
      `"${value}" was retired — ${was}. It is still on these pages:\n${offenders.join("\n")}`
      // The test file itself is not scanned; only app/.
    ).toEqual([]);
  });

  it.each(keys)("%s appears only via the registry", (key) => {
    const v = SOURCES[key].value;
    /* Match the value as a standalone number: not inside a longer number, not
     * part of an identifier, and not a version or a date fragment. Bare
     * integers under 100 are skipped — "81" and "26.5" collide with too much
     * ordinary markup (colours, widths, class names) to be worth the false
     * positives, and those are exactly the figures already interpolated. */
    if (Number.isInteger(v) && Math.abs(v) < 100) return;
    const re = new RegExp(`(?<![\\d.])${String(v).replace(".", "\\.")}(?![\\d.])`);
    const offenders = files.filter((f) => re.test(rendered(f)));
    expect(
      offenders,
      `${key} (${v}) is typed literally in these files. Import it from ` +
        `@/lib/kenya-stats and interpolate it, so a correction reaches the page:\n` +
        offenders.join("\n")
    ).toEqual([]);
  });
});
