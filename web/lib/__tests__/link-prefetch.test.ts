import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { prefetchTarget } from "../prefetch-target";

/**
 * Pages link through components/Link.tsx, which prefetches on intent. A direct
 * next/link import brings viewport prefetch back: 105-163 KB per page view for
 * routes the reader never opened (live, 27 Nov 2026).
 */
const files = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) => {
    if (n === "node_modules" || n.startsWith(".")) return [];
    const p = join(dir, n);
    return statSync(p).isDirectory() ? files(p) : /\.(tsx?|jsx?)$/.test(n) ? [p] : [];
  });

describe("links prefetch on intent", () => {
  it("nothing but the wrapper imports next/link", () => {
    const offenders = ["app", "components", "lib"]
      .flatMap(files)
      .filter((f) => !f.endsWith(join("components", "Link.tsx")) && /from ["']next\/link["']/.test(readFileSync(f, "utf8")));
    expect(offenders).toEqual([]);
  });

  it("the wrapper turns viewport prefetch off and warms on intent", () => {
    const src = readFileSync("components/Link.tsx", "utf8");
    expect(src).toMatch(/prefetch=\{prefetch \?\? false\}/);
    for (const ev of ["onMouseEnter", "onTouchStart", "onFocus"]) expect(src).toContain(ev);
    expect(src).toContain("router.prefetch(");
  });

  it("warms routes only, never files or other sites", () => {
    expect(prefetchTarget("/tools")).toBe("/tools");
    expect(prefetchTarget("/learn#bonds")).toBe("/learn");
    expect(prefetchTarget("/planners?goal=education")).toBe("/planners");
    expect(prefetchTarget("/rates.json")).toBeNull();
    expect(prefetchTarget("https://www.centralbank.go.ke/")).toBeNull();
    expect(prefetchTarget("//evil.example/")).toBeNull();
    expect(prefetchTarget(undefined)).toBeNull();
  });
});
