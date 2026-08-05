import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

/**
 * Two tools must not both settle "money market fund or Treasury bill?".
 *
 * /tools/dhowcsd already answers it with `verdictFor`, and does so
 * AMOUNT-AWARELY: below the DhowCSD minimum a bill is not an option at any
 * yield, which no rate table can express. /tools/where-to-save surveys what the
 * options pay and why a SACCO is not among them.
 *
 * Those are different questions, and the difference is invisible to a reader
 * unless the survey hands off. If the survey ever starts rendering a verdict
 * too, a reader gets two answers with no way to tell which is load-bearing —
 * and the one built from a rate alone is the weaker of them.
 */
/* Comments are stripped before matching, for the same reason brand-claims.ts
 * strips them: the file explains at length WHY it does not print a winner, and
 * a scan that flags the explanation teaches people to delete the explanation.
 * The first version of this test failed on its own rationale. */
const shipped = (src: string): string =>
  src
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/^\s*\/\/.*$/gm, " ")
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, " ");

const survey = shipped(readFileSync("components/tools/WhereToSave.tsx", "utf8"));
const surveyPage = readFileSync("app/tools/where-to-save/page.tsx", "utf8");
const ladder = shipped(readFileSync("components/tools/DhowcsdLadderCalculator.tsx", "utf8"));

describe("the survey does not restate the ladder's verdict", () => {
  it("reads both files", () => {
    expect(survey.length).toBeGreaterThan(500);
    expect(ladder.length).toBeGreaterThan(500);
  });

  it("only the ladder calls the verdict function", () => {
    expect(ladder).toMatch(/verdictFor\(/);
    expect(survey).not.toMatch(/verdictFor\(/);
  });

  it("the survey hands off to the tool that does answer it", () => {
    expect(surveyPage).toMatch(/href: "\/tools\/dhowcsd"/);
  });

  it("the survey never declares a winner between the fund and a bill", () => {
    // It may say they are level; it may not pick one. "level" is a refusal to
    // rank, which is the honest output when the gap is inside the margin.
    expect(survey).not.toMatch(/beats|better than|winner|best option/i);
  });
});
