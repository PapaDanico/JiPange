import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/* A next/image with a large intrinsic `width` and no `sizes` makes the browser
 * fetch the widest variant: the print letterhead downloaded the 1,080px logo
 * (78 KB) to draw a 28px mark, on every tool page, though it only shows when
 * printing (found in the 27 Nov 2026 design review). Every such image must say
 * how wide it is drawn. */
const ROOT = join(__dirname, "../..");
const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? (f === "node_modules" || f.startsWith(".") ? [] : walk(p)) : /\.tsx$/.test(f) ? [p] : [];
  });

describe("next/image sizing", () => {
  const files = [...walk(join(ROOT, "app")), ...walk(join(ROOT, "components"))];

  it("scans real files", () => {
    expect(files.length).toBeGreaterThan(50);
  });

  it("gives every large next/image a sizes hint", () => {
    const missing: string[] = [];
    for (const f of files) {
      const src = readFileSync(f, "utf8");
      for (const m of src.matchAll(/<Image\b[\s\S]*?\/>/g)) {
        const tag = m[0];
        const width = Number(/width=\{(\d+)\}/.exec(tag)?.[1] ?? 0);
        if (width >= 200 && !/\bsizes=/.test(tag)) missing.push(`${f.replace(ROOT + "/", "")}: width ${width}`);
      }
    }
    expect(missing).toEqual([]);
  });
});
