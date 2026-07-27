import { describe, it, expect } from "vitest";
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * The AI stack is gone. This keeps it gone.
 *
 * Deleting code is only half of a removal; the other half is everything that
 * merely *referenced* it — a dependency nothing imports, a database table
 * nothing can write to, a privileged credential nothing needs. Each of those
 * survives a deletion happily and silently, and each is a claim about the
 * system that is no longer true. That is the defect class this codebase keeps
 * finding, so the removal is pinned the same way the privacy notice is.
 *
 * If the plan should ever go back to a model, this test is the checklist of
 * what has to be restored deliberately rather than by accident.
 */

const ROOT = new URL("../..", import.meta.url).pathname;
const read = (p: string) => readFileSync(join(ROOT, p), "utf8");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (name === "node_modules" || name === ".next") return [];
    if (statSync(full).isDirectory()) return walk(full);
    return /\.tsx?$/.test(full) ? [full] : [];
  });
}

describe("the AI stack stays removed", () => {
  it("ships no Anthropic SDK dependency", () => {
    const pkg = JSON.parse(read("package.json"));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    expect(
      Object.keys(deps).filter((d) => d.includes("anthropic")),
      "an unused SDK is dead weight in every install and bundle"
    ).toEqual([]);
  });

  it("has no API routes for plan generation", () => {
    for (const route of ["app/api/generate-plan", "app/api/goal-strategy"]) {
      expect(existsSync(join(ROOT, route)), `${route} is back`).toBe(false);
    }
  });

  it("never reads a Supabase service-role key", () => {
    // That key bypasses row-level security. Nothing here needs it any more,
    // and code that reads it is how it ends up set in a deployment.
    // Comments stripped first: lib/supabase/server.ts carries a note naming
    // the key it no longer reads, and the first version of this test reported
    // that note as the defect. Recording why something was removed is worth
    // keeping; what must not survive is code that reads it.
    const stripComments = (s: string) =>
      s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
    const offenders = walk(join(ROOT, "lib"))
      .concat(walk(join(ROOT, "app")))
      .filter((f) => !f.includes("__tests__"))
      .filter((f) => /SERVICE_ROLE/.test(stripComments(readFileSync(f, "utf8"))));
    expect(offenders.map((f) => f.replace(ROOT, ""))).toEqual([]);
  });

  it("keeps a migration dropping the ai_calls table", () => {
    // The table logged token spend per request. Nothing can write to it now,
    // and an always-empty table misdescribes the system.
    const sql = read("supabase/migrations/0002_drop_ai_calls.sql");
    expect(sql).toMatch(/drop table if exists public\.ai_calls/i);
  });
});
