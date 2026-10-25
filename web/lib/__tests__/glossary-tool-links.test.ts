import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { CALCULATOR_GROUPS } from "@/lib/tool-groups";

/* Every glossary link names the tool it opens, so 23 links do not all read
 * "Work it out with your own numbers". A toolPath the name map does not know
 * would fall back to a generic label and bring the repetition back. */
describe("glossary tool links", () => {
  it("every toolPath in the glossary data has a name", () => {
    const src = readFileSync("app/glossary/page.tsx", "utf8");
    const known = new Set([
      ...CALCULATOR_GROUPS.flatMap((g) => g.calculators.map((c) => c.href.replace(/\/$/, ""))),
      ...[...src.matchAll(/\["(\/[^"]+)", "/g)].map((m) => m[1]),
    ]);
    const paths = new Set<string>();
    for (const f of ["lib/glossary.ts"]) {
      for (const m of readFileSync(f, "utf8").matchAll(/toolPath:\s*"([^"]+)"/g)) paths.add(m[1].split(/[?#]/)[0].replace(/\/$/, ""));
    }
    expect(paths.size).toBeGreaterThan(0);
    expect([...paths].filter((p) => !known.has(p))).toEqual([]);
  });
});
