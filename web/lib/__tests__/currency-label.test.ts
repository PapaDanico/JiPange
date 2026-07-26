import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { formatKES } from "../budget";

/**
 * One currency label in front of the reader: Ksh.
 *
 * Three spellings were live on a single screen of /tools/salary — "Ksh 100,000"
 * in prose, "Ksh 9,000+" in a headline, "(KES)" on the field label, and "KSh"
 * as the input prefix. Source counts were 127 KES, 72 KSh and 23 Ksh, against a
 * formatKES that renders Ksh for every computed figure.
 *
 * Nobody chose that. It is the drift this codebase keeps producing: a
 * convention set in one place and re-typed by hand somewhere else, with nothing
 * holding the two together. The rule is therefore enforced against the
 * formatter's own output rather than a string picked here.
 */

const ROOT = new URL("../..", import.meta.url).pathname;
const DIRS = ["app", "components", "lib"];

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (name === "node_modules" || name === "__tests__") return [];
    if (statSync(full).isDirectory()) return walk(full);
    return /\.tsx?$/.test(full) && !/\.test\.tsx?$/.test(full) ? [full] : [];
  });
}

describe("currency labels", () => {
  it("formatKES renders Ksh, which is what everything else must match", () => {
    expect(formatKES(1_200_000)).toContain("Ksh");
    expect(formatKES(1_200_000)).not.toContain("KES");
    expect(formatKES(1_200_000)).not.toContain("KSh");
  });

  it("no user-facing label writes KES or KSh", () => {
    const offenders: string[] = [];
    for (const dir of DIRS) {
      for (const file of walk(join(ROOT, dir))) {
        readFileSync(file, "utf8").split("\n").forEach((line, i) => {
          // Comments are not read by anyone using the app, and this file's own
          // note quotes the bug.
          if (/^\s*(\/\/|\*|\/\*)/.test(line)) return;
          // Legitimate: "en-KE" is a locale, `currency`/`priceCurrency` take the
          // ISO code and are what MAKE Intl print "Ksh", and identifiers such as
          // formatKES or minKes are never displayed.
          if (/"en-KE"|currency:\s*["']KES["']|priceCurrency/.test(line)) return;
          // Strip trailing comments too — `const MAX = 1e11; // 100B KES` is a
          // note to a developer, not a label, and the leading-marker check
          // above cannot see it.
          const stripped = line
            .replace(/\/\/.*$/, "")
            .replace(/\b(formatKES|minKes|amountKES|\w+Kes)\b/g, "");
          if (/\bKES\b|\bKSh\b/.test(stripped)) {
            offenders.push(`${file.replace(ROOT, "")}:${i + 1}  ${line.trim().slice(0, 88)}`);
          }
        });
      }
    }
    expect(
      offenders,
      `write these as "Ksh", the same as formatKES:\n${offenders.join("\n")}`,
    ).toEqual([]);
  });
});
