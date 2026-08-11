import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  STATUTES,
  currentStatutes,
  dueForReview,
  formatMonth,
  statuteLine,
  attributionFor,
} from "../statutes";
import type { StatuteKey } from "../statutes";
import {
  PAYE_BANDS,
  PERSONAL_RELIEF_MONTHLY,
  NSSF_LOWER_LIMIT,
  NSSF_UPPER_LIMIT,
  NSSF_TIER2_MAX,
  SHIF_RATE,
  SHIF_MINIMUM,
  AHL_RATE,
} from "../tax";

/**
 * What makes the registry worth having.
 *
 * A list of Acts with dates attached is a filing cabinet. What turns it into a
 * guarantee is (a) a check that the record still matches the constants it
 * claims to govern, and (b) proof that the staleness gate can actually fire —
 * because a staleness gate is the easiest possible place to write a guard that
 * looks thorough and cannot ever trigger.
 */

const keys = Object.keys(STATUTES) as StatuteKey[];

describe("the statute registry", () => {
  it("has an entry for every instrument the calculators apply", () => {
    // Guards against a refactor that empties the registry and leaves every
    // loop below iterating over nothing, green and meaningless.
    expect(keys).toEqual(expect.arrayContaining(["paye", "nssf", "shif", "housingLevy"]));
  });

  it.each(keys)("%s is fully attributed", (key) => {
    const s = STATUTES[key];
    expect(s.instrument.length, "no instrument named").toBeGreaterThan(8);
    expect(s.governs.length, "no statement of what it governs").toBeGreaterThan(8);
    expect(s.url, "citation URL must be https").toMatch(/^https:\/\/[^\s]+\.[a-z]{2,}/i);
  });

  it.each(keys)("%s has dates that make sense", (key) => {
    const s = STATUTES[key];
    const iso = /^\d{4}-\d{2}-\d{2}$/;
    expect(s.effectiveFrom, `effectiveFrom "${s.effectiveFrom}" is not ISO`).toMatch(iso);
    expect(s.reviewBy, `reviewBy "${s.reviewBy}" is not ISO`).toMatch(iso);
    // A review date at or before the effective date would expire on arrival.
    expect(s.reviewBy > s.effectiveFrom, "reviewBy must be after effectiveFrom").toBe(true);
  });
});

/**
 * THE GUARD MUST BE ABLE TO FIRE.
 *
 * Asserting only that today's output looks right would pass just as well
 * against `dueForReview = () => []`. The clock is wound past every review date
 * and the behaviour checked from the other side.
 */
describe("the staleness gate fires", () => {
  const FAR_FUTURE = "2099-01-01";
  const FAR_PAST = "2000-01-01";

  it("reports every instrument as due once the clock is past all of them", () => {
    expect(dueForReview(FAR_FUTURE)).toHaveLength(keys.length);
    expect(currentStatutes(FAR_FUTURE)).toHaveLength(0);
  });

  it("reports none as due before any of them were even enacted", () => {
    expect(dueForReview(FAR_PAST)).toHaveLength(0);
    expect(currentStatutes(FAR_PAST)).toHaveLength(keys.length);
  });

  it("has nothing past due today", () => {
    /* This test used to assert the OPPOSITE — that PAYE was past due — and
     * said of itself: "when somebody finally reads the Act and sets a new
     * reviewBy, this test goes red and should be deleted along with the stale
     * entry. A test that asserts a defect exists must not outlive the defect."
     *
     * The Finance Act 2026 review has now happened (see the note on the paye
     * entry for what was and was not established), so the assertion is
     * inverted rather than deleted: nothing is past due, and if anything falls
     * past its date this goes red on the day it happens instead of waiting for
     * somebody to notice the banner.
     *
     * The wound-forward cases above are what prove the gate can still fire, so
     * this staying green is not the reason to trust it. */
    const due = dueForReview();
    expect(
      due.map((s) => s.governs),
      `${due.map((s) => s.instrument).join(", ")} passed its review date. ` +
        `Re-read the instrument, confirm or correct lib/tax.ts, THEN set a new ` +
        `reviewBy. Do not just move the date.`
    ).toEqual([]);
  });

  it("moves an instrument out of the caution line on the day it expires", () => {
    // Boundary: reviewBy is inclusive, the day after is not.
    const s = STATUTES.nssf;
    expect(dueForReview(s.reviewBy)).not.toContainEqual(s);
    const dayAfter = new Date(Date.parse(s.reviewBy) + 86_400_000).toISOString().slice(0, 10);
    expect(dueForReview(dayAfter)).toContainEqual(s);
  });
});

/**
 * The record must describe the constants that are actually in force.
 *
 * A registry that drifts from lib/tax.ts is worse than none: it puts a
 * citation under a number it does not describe, which is how a wrong figure
 * acquires the authority of an Act of Parliament.
 */
describe("the registry matches the engine it documents", () => {
  it("states the NSSF limits the engine applies", () => {
    expect(STATUTES.nssf.note).toContain(NSSF_LOWER_LIMIT.toLocaleString("en-US"));
    expect(STATUTES.nssf.note).toContain(NSSF_UPPER_LIMIT.toLocaleString("en-US"));
    expect(STATUTES.nssf.note).toContain(NSSF_TIER2_MAX.toLocaleString("en-US"));
  });

  it("states the personal relief the engine applies", () => {
    expect(STATUTES.paye.note).toContain(PERSONAL_RELIEF_MONTHLY.toLocaleString("en-US"));
  });

  it("describes rates the engine actually uses", () => {
    expect(STATUTES.shif.governs).toContain(`${(SHIF_RATE * 100).toFixed(2)}%`);
    expect(STATUTES.shif.governs).toContain(SHIF_MINIMUM.toString());
    expect(STATUTES.housingLevy.governs).toContain(`${(AHL_RATE * 100).toFixed(1)}%`);
  });

  it("covers the full PAYE schedule the engine applies", () => {
    // If a band is ever added or removed, the citation describing "the PAYE
    // bands" is describing something else and should be re-read.
    expect(PAYE_BANDS).toHaveLength(5);
  });
});

/**
 * The disclaimer must not restate any of this as a literal.
 *
 * This is the check that would have caught the original defect. "Rates current
 * as of July 2026" was typed into the component while lib/tax.ts said February
 * 2026, and nothing connected either to the other. Correcting one would have
 * changed nothing the other said, and would have felt like a fix.
 */
describe("the disclaimer states nothing it has not read from the registry", () => {
  const src = readFileSync(
    new URL("../../components/tools/CalculatorDisclaimer.tsx", import.meta.url).pathname,
    "utf8"
  );

  it("renders from the registry", () => {
    expect(src).toContain("@/lib/statutes");
    expect(src).toContain("statuteLine");
    expect(src).toContain("dueForReview");
  });

  it("hardcodes no month-and-year currency claim", () => {
    // The exact shape of the defect: a month name beside a year, in JSX.
    const stripped = src.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");
    const literal = stripped.match(
      /(January|February|March|April|May|June|July|August|September|October|November|December)\s+20\d\d/
    );
    expect(
      literal,
      `the disclaimer hardcodes "${literal?.[0]}". Dates belong in lib/statutes.ts, ` +
        `where a test can tell when they expire.`
    ).toBeNull();
  });

  it("names no Act in prose that the registry does not carry", () => {
    const stripped = src.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");
    // The four Acts were previously spelled out in the JSX string.
    for (const act of ["Finance Act", "NSSF Act", "Social Health Insurance Act", "Affordable Housing Act"]) {
      expect(stripped, `"${act}" is typed into the component`).not.toContain(act);
    }
  });

  /**
   * AND NOWHERE ELSE EITHER.
   *
   * The first version of this suite scanned CalculatorDisclaimer.tsx alone,
   * on the assumption that the currency claim lived in the shared component.
   * It did not live there only. Three more were rendering at the same time:
   *
   *   TakeHomePayCalculator  "rates current as of July 2026"  (the PRINT copy)
   *   SalaryPlannerHub       "Rates effective February 2026: NSSF Year 4..."
   *   app/page.tsx           "Rates current July 2026."
   *
   * Fixing the shared component and calling it done would have left the
   * printed page — the copy that outlives the session — still asserting a date
   * nobody had checked. Reading one match and generalising is the error mode
   * this project keeps repeating; a single-file scan is how it gets encoded
   * into a test and stops being visible.
   */
  it("no component or page claims rate currency in prose", () => {
    const roots = ["../../components", "../../app"];
    const walk = (dir: string): string[] =>
      readdirSync(dir).flatMap((name) => {
        const p = join(dir, name);
        if (statSync(p).isDirectory()) return walk(p);
        return /\.tsx?$/.test(name) ? [p] : [];
      });
    const files = roots.flatMap((r) => walk(new URL(r, import.meta.url).pathname));

    expect(files.length, "found no files — this scan would be vacuous").toBeGreaterThan(20);

    // Comments are stripped: this file's own explanation of the defect quotes
    // it, and a guard that fails on its own documentation gets deleted.
    const claim =
      /rates?\s+(current|effective)[^.<>{}]{0,30}(January|February|March|April|May|June|July|August|September|October|November|December)\s+20\d\d/i;

    const offenders = files.filter((f) =>
      claim.test(
        readFileSync(f, "utf8")
          .replace(/\/\*[\s\S]*?\*\//g, " ")
          .replace(/^\s*\/\/.*$/gm, " ")
      )
    );
    expect(
      offenders,
      "these files state a rate currency date in prose. It belongs in " +
        "lib/statutes.ts, where a test can tell when it expires:\n" +
        offenders.join("\n")
    ).toEqual([]);
  });

  it("assembles a citation line that actually names the instruments", () => {
    const line = statuteLine();
    expect(line).toContain("NSSF Act, 2013");
    expect(line).toContain("Affordable Housing Act, 2024");
  });
});

describe("month formatting", () => {
  it("reads as a person would say it", () => {
    expect(formatMonth("2024-10-01")).toBe("October 2024");
    expect(formatMonth("2023-07-01")).toBe("July 2023");
  });
});

/**
 * AND NO PAGE NAMES THE ACT ITSELF, EITHER.
 *
 * The scan above catches prose that dates the RATES. It did not catch prose
 * that names the INSTRUMENT, and two pages did exactly that:
 *
 *   app/tools/salary/page.tsx   "Finance Act 2025/26 bands, NSSF Year 4"
 *   app/about/page.tsx          "KRA PAYE bands and personal reliefs
 *                                (Finance Act 2025/26)"
 *
 * Both were wrong twice. The five-band schedule dates to the Finance Act 2023,
 * not 2025; and by August 2026 the Finance Act 2026 had been in force for a
 * month, so a reader could not distinguish "still correct" from "never
 * updated". What made it survive is that the arithmetic never was wrong — the
 * 2026 Act moved neither the bands nor the relief — so no figure was ever off
 * by a shilling and nothing pointed at the label.
 *
 * A hand-typed Act name is a claim about the law with nothing connecting it to
 * the constants it describes, which is the premise of this whole registry.
 * attributionFor() renders it from the records instead.
 */
describe("no page names a Finance Act by hand", () => {
  it("every Act attribution comes from the registry", () => {
    const roots = ["../../components", "../../app"];
    const walk = (dir: string): string[] =>
      readdirSync(dir).flatMap((name) => {
        const p = join(dir, name);
        if (statSync(p).isDirectory()) return walk(p);
        return /\.tsx?$/.test(name) ? [p] : [];
      });
    const files = roots.flatMap((r) => walk(new URL(r, import.meta.url).pathname));
    expect(files.length, "found no files — this scan would be vacuous").toBeGreaterThan(20);

    /* A YEARED Finance Act reference in rendered copy. Deliberately NOT a ban
     * on the phrase: the relief tooltips say "raised from Ksh 25,000 by the
     * Finance Act 2025", which is a historical fact about a specific change
     * and stays true however the law moves. What is banned is naming an Act as
     * the CURRENT authority for a rate — "Finance Act 2025/26 bands" — because
     * that claim expires and nothing here would notice.
     *
     * Comments are stripped, or this block's own quotation of the defect would
     * fail the guard it documents. */
    const offenders = files.filter((f) => {
      const src = readFileSync(f, "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, " ")
        .replace(/^\s*\/\/.*$/gm, " ");
      return /Finance Act\s+20\d\d\s*\/\s*\d\d/.test(src);
    });

    expect(
      offenders.map((f) => f.replace(/.*\/(app|components)\//, "$1/")),
      "these name a Finance Act year as the current authority for a rate. " +
        "That claim expires silently — the arithmetic stays right while the " +
        "label goes stale. Use attributionFor() from @/lib/statutes."
    ).toEqual([]);
  });

  it("attributionFor names the instrument and its real start date", () => {
    expect(attributionFor("paye")).toContain("Income Tax Act");
    // July 2023, not 2025 — the mistake the two pages made.
    expect(attributionFor("paye")).toContain("July 2023");
    expect(attributionFor("paye")).not.toContain("2025");
    expect(attributionFor("nssf")).toContain("February 2026");
  });
});

/**
 * A review date must arrive BEFORE the change it exists to catch.
 *
 * NSSF's reviewBy read 2027-03-31 with the comment "stable until then plus two
 * months of grace". The grace pointed the wrong way, and the two data types it
 * conflates fail differently:
 *
 *   A CPI print two months old is OLD BUT TRUE. Grace after the fact is free.
 *   An NSSF limit two months past a step is FALSE. On 1 February 2027 the Year
 *   4 ceiling of Ksh 108,000 stops being the law, and a guard that waits until
 *   31 March lets the site quote a wrong deduction for February and March with
 *   nothing flagged at all.
 *
 * And it does not stay contained. NSSF is deducted BEFORE PAYE, so a wrong
 * upper limit moves taxable income, moves PAYE, and moves the take-home figure
 * that is the whole reason somebody opened the calculator.
 *
 * The step date is not a guess: Year 3 took effect 1 February 2025 and Year 4
 * on 1 February 2026, both recorded in lib/tax.ts.
 */
describe("statutes that step on a known date", () => {
  it("prompts a review before NSSF's annual 1 February step, never after", () => {
    const nssf = STATUTES.nssf;
    const [effYear] = nssf.effectiveFrom.split("-").map(Number);

    // The step lands on 1 February of the year after the current phase began.
    const nextStep = `${effYear + 1}-02-01`;

    expect(
      nssf.reviewBy < nextStep,
      `NSSF reviewBy is ${nssf.reviewBy}, on or after the ${nextStep} step. ` +
        `A review that fires after the limits change lets the calculator quote ` +
        `a superseded ceiling — and NSSF sits upstream of PAYE, so the error ` +
        `reaches take-home pay.`
    ).toBe(true);
  });

  /* The premise, and the thing that makes the assertion above mean something:
   * NSSF really does step on 1 February, and the codebase says so in the place
   * the figures actually live. If effectiveFrom ever stops being a February
   * date, the nextStep arithmetic above is describing a cadence that no longer
   * exists and the whole check quietly becomes decoration. */
  it("is keyed to a February step date, which is what makes that check valid", () => {
    expect(STATUTES.nssf.effectiveFrom.slice(5, 7)).toBe("02");
    expect(STATUTES.nssf.effectiveFrom).toBe("2026-02-01");
  });

  /* Not the same rule for everything. SHIF and the housing levy are set by
   * regulation with no fixed cadence, so there is no step date to precede —
   * an annual re-read is the discipline instead, and demanding a February
   * deadline of them would be inventing a schedule the law does not have. */
  it("does not impose a step deadline on statutes that have no step", () => {
    expect(STATUTES.shif.effectiveFrom).toBe("2024-10-01");
    expect(STATUTES.housingLevy.effectiveFrom).toBe("2024-03-19");
  });
});

/**
 * A citation must name the instrument a reader would have to go and read.
 *
 * The PAYE attribution used to render "Income Tax Act (Cap 470), PAYE bands as
 * amended". Amended by WHAT was left for the reader to discover — a poor thing
 * to ask of somebody who came to check whether we are telling the truth, and
 * the whole premise of this product is that its figures are checkable.
 *
 * It is the Finance Act, 2023, amending the Third Schedule: assented 26 June
 * 2023, effective 1 July 2023, introducing the 32.5% and 35% bands. That is
 * enough for a reader to find the primary source themselves.
 */
describe("attribution names a findable instrument", () => {
  it("says which Act amended the PAYE bands, not merely that one did", () => {
    const paye = attributionFor("paye");
    expect(paye).toContain("Finance Act, 2023");
    expect(
      paye,
      'a citation reading only "as amended" sends the reader looking for an ' +
        "instrument we already know the name of"
    ).not.toMatch(/bands as amended/);
  });

  it("still carries the schedule that was actually amended", () => {
    expect(attributionFor("paye")).toContain("Third Schedule");
  });
});
