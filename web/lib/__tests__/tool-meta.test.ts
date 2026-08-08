import { describe, expect, it } from "vitest";
import { readdirSync } from "fs";
import { join } from "path";
import { TOOL_META } from "../tool-meta";
import { CALCULATOR_GROUPS } from "../tool-groups";

/**
 * Every calculator that exists must be in TOOL_META, because the homepage
 * counts it.
 *
 * app/page.tsx derives TOOL_COUNT from exactly these keys, after an earlier
 * round where "the page said 'All 18 calculators', lib/tiers.ts said 26, and
 * there were 25 — three numbers for one fact". Deriving the number fixed the
 * three-numbers problem but left one route open: joining the registry was
 * never made COMPULSORY. /tools/where-to-save duly shipped without an entry,
 * and the homepage advertised 25 while 26 existed.
 *
 * A derived count is only as honest as the completeness of what it derives
 * from. This is the test that keeps it complete: a new calculator that skips
 * the registry now fails here instead of quietly making the shop window lie.
 */

const TOOLS_DIR = join(process.cwd(), "app", "tools");

function toolRoutes(): string[] {
  return readdirSync(TOOLS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => `/tools/${entry.name}`);
}

describe("TOOL_META covers every calculator", () => {
  it("has an entry for every page under app/tools", () => {
    const missing = toolRoutes().filter((route) => !TOOL_META[route]);
    expect(
      missing,
      "these calculators exist but are absent from TOOL_META, so the homepage " +
        "undercounts them. Add them to CALCULATOR_GROUPS (they should be listed " +
        "on /tools anyway) or give them a hand-written entry."
    ).toEqual([]);
  });

  /* The premise. If app/tools were empty or unreadable the assertion above
   * would pass against nothing, which is how a guard gets quietly disabled. */
  it("actually found the calculators", () => {
    expect(toolRoutes().length).toBeGreaterThan(20);
  });

  it("does not claim tools that have no page", () => {
    const routes = new Set(toolRoutes());
    const orphans = Object.keys(TOOL_META)
      .filter((href) => href.startsWith("/tools/"))
      .filter((href) => !routes.has(href));
    expect(orphans, "TOOL_META lists these, but no page exists — a dead cross-link").toEqual([]);
  });

  /* The backfill must not clobber a hand-written entry. Those carry `related`,
   * `nextMove` and `primaryFields`; CALCULATOR_GROUPS knows none of them, so an
   * unguarded assignment would silently strip the resume prompt and every
   * cross-link off any tool that appears in both places. */
  it("keeps the richer hand-written entry when a tool is in both", () => {
    const inIndex = new Set(
      CALCULATOR_GROUPS.flatMap((group) => group.calculators.map((c) => c.href))
    );
    const enriched = Object.values(TOOL_META).filter(
      (meta) => inIndex.has(meta.href) && (meta.related.length > 0 || meta.nextMove)
    );
    expect(
      enriched.length,
      "every tool in the index came back bare, so the backfill overwrote the hand-written entries"
    ).toBeGreaterThan(0);
  });
});
