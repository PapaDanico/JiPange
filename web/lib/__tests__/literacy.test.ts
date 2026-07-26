import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { FAQS, FAQ_TOPICS } from "@/lib/faqs";
import { GLOSSARY, GLOSSARY_TOPICS } from "@/lib/glossary";
import { faqPageJsonLd, glossaryJsonLd } from "@/lib/structured-data";

/**
 * The literacy surface, pinned to the product it explains.
 *
 * Explanatory content rots in a way arithmetic does not: a calculator that
 * disagrees with itself fails a test, but an FAQ that points at a tool which
 * has been renamed just quietly sends people to a 404, and a glossary entry
 * describing behaviour the app no longer has is simply wrong at nobody's
 * expense but the reader's. These tests exist because that failure is silent.
 */

describe("every link goes somewhere that exists", () => {
  const routeExists = (path: string) =>
    existsSync(`${process.cwd()}/app${path}/page.tsx`);

  it.each(FAQS.filter((f) => f.toolPath).map((f) => [f.question, f.toolPath!]))(
    "FAQ %# points at a real calculator",
    (_q, path) => {
      expect(routeExists(path), `${path} does not exist`).toBe(true);
    },
  );

  it.each(GLOSSARY.filter((g) => g.toolPath).map((g) => [g.term, g.toolPath!]))(
    "glossary term %s points at a real calculator",
    (_term, path) => {
      expect(routeExists(path), `${path} does not exist`).toBe(true);
    },
  );
});

describe("the content earns its place", () => {
  it("gives every glossary entry a definition AND the mistake it causes", () => {
    // The second half is the whole point. A definition alone is trivia.
    for (const g of GLOSSARY) {
      expect(g.meaning.length, `${g.term} has no real definition`).toBeGreaterThan(40);
      expect(g.whyItMatters.length, `${g.term} does not say why it matters`).toBeGreaterThan(60);
    }
  });

  it("answers every FAQ substantively rather than deferring", () => {
    for (const f of FAQS) {
      expect(f.answer.length, `"${f.question}" is answered too thinly`).toBeGreaterThan(80);
      expect(f.question.endsWith("?"), `"${f.question}" is not a question`).toBe(true);
    }
  });

  it("never claims to be advice", () => {
    const all = [...FAQS.map((f) => f.answer), ...GLOSSARY.map((g) => g.whyItMatters)];
    for (const text of all) {
      expect(text).not.toMatch(/\byou should buy\b|\bwe recommend\b|\bguaranteed returns?\b/i);
    }
  });

  it("files everything under a topic the pages actually render", () => {
    for (const f of FAQS) expect(FAQ_TOPICS).toContain(f.topic);
    for (const g of GLOSSARY) expect(GLOSSARY_TOPICS).toContain(g.topic);
  });

  it("has no duplicate terms or questions", () => {
    expect(new Set(GLOSSARY.map((g) => g.term)).size).toBe(GLOSSARY.length);
    expect(new Set(FAQS.map((f) => f.question)).size).toBe(FAQS.length);
  });
});

describe("it covers the traps this codebase has actually found", () => {
  /**
   * Each of these is a bug that shipped, or a misreading the engines exist to
   * prevent. If the product knows about a trap and the literacy surface does
   * not mention it, the knowledge is locked inside the arithmetic.
   */
  const corpus = [
    ...FAQS.map((f) => `${f.question} ${f.answer}`),
    ...GLOSSARY.map((g) => `${g.term} ${g.meaning} ${g.whyItMatters}`),
  ]
    .join(" ")
    .toLowerCase();

  /*
   * Each pattern matches the EXPLANATION, never the topic word. The first
   * version of this test matched /fuliza/ — which the question text satisfies
   * on its own, so gutting the answer to "it is cheap" left the test green.
   * A test that a subject is mentioned is not a test that it is explained.
   */
  it.each([
    ["a T-bill quote is a discount, not a return", /discount is earned on the smaller|not the return|not a return at all/],
    ["advertised yields are quoted before withholding tax", /before this|gross[ —-]/],
    ["a daily rate annualises brutally", /400%|a year\b.*\bdaily|daily rate is the most effective/],
    ["flat rates cost roughly double reducing balance", /roughly (what )?a? ?22%|nearly double|original amount/],
    ["SHA is a floor rather than a plan", /floor, not a plan/],
    ["private cover has an entry-age deadline", /decline new members|decline NEW members|expires before retirement/i],
    ["a below-inflation return loses purchasing power", /loses purchasing power|balance rises while the value falls|shrinking/],
    ["a higher tax band does not re-tax the whole salary", /only the (shillings|portion) above/],
    ["a chama slot's value is timing, not cash", /interest-free loan/],
    ["medical takes more of the capital than of the budget", /19% of its retirement capital|share of the capital/],
  ])("explains %s somewhere", (_label, pattern) => {
    expect(corpus).toMatch(pattern);
  });
});

describe("the structured data says what the page says", () => {
  /**
   * A search engine quoting an answer the site no longer makes is worse than
   * no rich result at all, so the JSON-LD is built from the same arrays the
   * pages render rather than hand-written beside them.
   */
  it("publishes every FAQ, verbatim", () => {
    const ld = faqPageJsonLd(FAQS) as {
      mainEntity: { name: string; acceptedAnswer: { text: string } }[];
    };
    expect(ld.mainEntity).toHaveLength(FAQS.length);
    for (const f of FAQS) {
      const entry = ld.mainEntity.find((e) => e.name === f.question);
      expect(entry, `${f.question} missing from JSON-LD`).toBeDefined();
      expect(entry!.acceptedAnswer.text).toBe(f.answer);
    }
  });

  it("publishes every glossary term, verbatim", () => {
    const ld = glossaryJsonLd({
      name: "x",
      description: "y",
      path: "/glossary",
      terms: GLOSSARY,
    }) as { hasDefinedTerm: { name: string; description: string }[] };
    expect(ld.hasDefinedTerm).toHaveLength(GLOSSARY.length);
    expect(ld.hasDefinedTerm[0].description).toBe(GLOSSARY[0].meaning);
  });
});

describe("the pages are reachable", () => {
  const footer = readFileSync(`${process.cwd()}/components/Footer.tsx`, "utf8");
  const sitemap = readFileSync(`${process.cwd()}/app/sitemap.ts`, "utf8");

  it.each(["/faq", "/glossary"])("links %s from the footer and the sitemap", (path) => {
    // An unlinked page is a page nobody reads, however good it is.
    expect(footer).toContain(`"${path}"`);
    expect(sitemap).toContain(`"${path}"`);
  });
});
