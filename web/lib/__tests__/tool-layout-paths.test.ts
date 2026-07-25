import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

/**
 * Guards the SEO structured-data rollout: TypeScript already makes
 * ToolLayout's `path` prop required, so a missing prop fails the build —
 * but a *wrong* path (copy-pasted from a neighboring tool) would compile
 * fine and just point that tool's JSON-LD/breadcrumb at someone else's
 * URL. This checks every tool directory's own page.tsx passes its own
 * directory name back as `path`.
 */

const TOOLS_DIR = join(process.cwd(), "app/tools");

const toolDirs = readdirSync(TOOLS_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .filter((name) => existsSync(join(TOOLS_DIR, name, "page.tsx")));

describe("ToolLayout path props", () => {
  it("covers every tool directory", () => {
    expect(toolDirs.length).toBeGreaterThanOrEqual(25);
  });

  it.each(toolDirs)("%s: page.tsx passes its own directory as path", (slug) => {
    const src = readFileSync(join(TOOLS_DIR, slug, "page.tsx"), "utf8");
    const match = src.match(/path="([^"]+)"/);
    expect(match).toBeTruthy();
    expect(match?.[1]).toBe(`/tools/${slug}`);
  });
});
