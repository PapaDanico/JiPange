import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import {
  ASSUMED_SAVINGS_RATE,
  MEDICAL_EVIDENCE,
  REPLACEMENT_BENCHMARKS,
  REPLACEMENT_EVIDENCE,
  asShareOfIncome,
} from "../retirement-evidence";
import { LIVING_REPLACEMENT_AT_RETIREMENT } from "../retirement-kenya";

/**
 * The evidence has to reach a reader, and it has to still be true.
 *
 * TWO SEPARATE FAILURES, BOTH ALREADY SHIPPED ONCE
 *
 * First: this module was imported by NOTHING for a day. Three exports, no
 * consumers, referenced only from comments in two other files. It was written
 * to settle an argument about the replacement rate and could not settle
 * anything, because the only people who could read it were people already
 * reading the source. That is the same defect as `productSurveyIsStale()` —
 * real work, tested, wired to no reader.
 *
 * Second: the app's own row in the benchmark table was the literal 0.19, which
 * was correct only while LIVING_REPLACEMENT_AT_RETIREMENT stayed at 25%. That
 * constant had already moved twice in a day. A benchmark table exists to be
 * trusted at a glance, so one that quietly stops describing the app is worse
 * than none.
 *
 * Both are now checked here rather than by remembering.
 */
describe("the retirement evidence", () => {
  it("states the app's own default rather than a number typed beside it", () => {
    const ours = REPLACEMENT_BENCHMARKS.find((b) => b.label === "This app's default");
    expect(ours, "the app's own row has been renamed or removed").toBeTruthy();
    expect(ours!.shareOfIncome).toBeCloseTo(
      asShareOfIncome(LIVING_REPLACEMENT_AT_RETIREMENT),
      10
    );
    /* And the prose in the same row must move too — a derived number beside a
     * hand-written note is only half the fix. */
    expect(ours!.note).toContain(`${Math.round(LIVING_REPLACEMENT_AT_RETIREMENT * 100)}% of spending`);
  });

  it("converts spending to income by the stated savings rate, not a fudge", () => {
    expect(asShareOfIncome(1)).toBeCloseTo(1 - ASSUMED_SAVINGS_RATE, 10);
    expect(ASSUMED_SAVINGS_RATE).toBeGreaterThan(0);
    expect(ASSUMED_SAVINGS_RATE).toBeLessThan(1);
  });

  it("keeps the app's default below the benchmarks it claims to sit below", () => {
    /* The file's own framing is that this is a deliberate stand BELOW the RBA
     * target and below Kenya's observed rate. If a future edit raises the
     * default past either, that framing becomes false and the honest thing is
     * for this to fail rather than for the page to keep asserting it. */
    const [rba, kenya, ours] = REPLACEMENT_BENCHMARKS;
    expect(rba.shareOfIncome).toBeGreaterThan(kenya.shareOfIncome);
    expect(ours.shareOfIncome).toBeLessThan(kenya.shareOfIncome);
  });

  it("records the evidence that cuts against us, not only the agreeable half", () => {
    /* The file says in its own header that a version containing only the
     * supportive findings would be worse than no file. Pinned, because that is
     * exactly the edit a future reader would be tempted to make. */
    const all = [...REPLACEMENT_EVIDENCE, ...MEDICAL_EVIDENCE];
    expect(all.length).toBeGreaterThan(4);
    for (const e of all) {
      expect(e.claim, "an evidence entry has no claim").toBeTruthy();
      expect(e.source, `"${e.claim}" has no source`).toBeTruthy();
      expect(e.implication, `"${e.claim}" has no implication`).toBeTruthy();
    }
    const contrary = all.filter((e) =>
      /CORRECTS THIS APP|above anything this app|arguing against the regulator|too absolute/i.test(
        `${e.implication}`
      )
    );
    expect(
      contrary.length,
      "every remaining entry agrees with us — the inconvenient findings have been edited out"
    ).toBeGreaterThan(1);
  });

  it("is wired into the component that shows it", () => {
    /* A SOURCE-LEVEL check, and its limits are the point.
     *
     * The first version of this asserted the component merely CONTAINED the
     * string "MEDICAL_EVIDENCE". Mutation-checking it showed that replacing the
     * rendered list with an empty array — leaving the name behind in a type
     * annotation — kept this passing. So it now requires the list to be mapped
     * and each entry's source and claim to be read, which a type annotation
     * cannot satisfy.
     *
     * Even so, this can only prove the code is written, not that a reader sees
     * it. The guard that cannot be fooled is in e2e/tools.spec.ts, which opens
     * the page and the disclosure. This one exists to fail fast and locally. */
    const ui = readFileSync(
      new URL("../../components/tools/FireNumberCalculator.tsx", import.meta.url),
      "utf8"
    );
    const body = ui.slice(ui.indexOf("export default function"));
    expect(
      body,
      "both evidence lists must be mapped into the page, not merely imported"
    ).toMatch(/\[\s*\.\.\.MEDICAL_EVIDENCE\s*,\s*\.\.\.REPLACEMENT_EVIDENCE\s*\][\s\S]{0,40}\.map\(/);
    /* Each entry must show its source. Evidence without attribution is just
     * assertion in a nicer box. */
    expect(body, "entries are rendered without their sources").toMatch(/\{e\.source\}/);
    expect(body, "entries are rendered without their claims").toMatch(/\{e\.claim\}/);
  });

  it("keeps the planner's benchmark prose derived rather than retyped", () => {
    /* This sentence read "50% here is roughly 37% of income" — a worked example
     * for a default that had since moved to 25%, quoting the reader a figure
     * they were not on. It must now come from the constants. */
    const ui = readFileSync(
      new URL("../../components/planners/GoalPlanner.tsx", import.meta.url),
      "utf8"
    );
    expect(ui).toContain("asShareOfIncome(replacement)");
    expect(ui).toContain("REPLACEMENT_BENCHMARKS");
    expect(
      ui,
      "the stale worked example is back — 50% is not the default"
    ).not.toMatch(/50% here is roughly/);
    expect(
      ui,
      "the cross-tool gap is hand-written again; it was 15% in prose and 65% in fact"
    ).not.toMatch(/roughly 15% more/);
  });
});
