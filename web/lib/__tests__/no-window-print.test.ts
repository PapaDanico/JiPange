import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

/**
 * Nothing may call window.print().
 *
 * CLAUDE.md states the rule and the reason: window.print() is absent on iOS
 * when the app runs from the home screen, and dropped silently by several
 * Android WebViews. It does not throw and it does not warn — the reader taps
 * "Print / Save as PDF" and nothing whatsoever happens, which reads as a
 * broken app rather than an unsupported browser. Three call sites had drifted
 * back in: the take-home-pay calculator, the sidebar of all 26 tools via
 * ToolEnhancements, and the PrintButton used by /plan, /picture and
 * /money-map. Every one of them now exports through ExportCardButton, which
 * builds the file in the page and downloads it.
 *
 * This is a source scan rather than a runtime assertion because the fault is
 * per-device: the call succeeds on the desktop any test would run on, so the
 * only thing that can catch a reintroduction is the text of the code. It
 * follows the same pattern as the tenor-prose guard in tenor-weights.test.ts,
 * for the same reason — the property is "this must not appear", and the only
 * place to check that is the file.
 *
 * NOT banned: the print STYLESHEET. `@media print` in globals.css and
 * PrintLetterhead typeset a proper letterheaded report for a reader who
 * prints from the browser's own menu, and that path works everywhere. The
 * button was the broken part, not the styling.
 */

/** Strip comments so the rule's own explanations do not trip it. */
function code(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

function offendingLines(source: string): number[] {
  const hits: number[] = [];
  const stripped = code(source).split("\n");
  for (const [i, line] of stripped.entries()) {
    if (/window\s*\.\s*print\s*\(/.test(line)) hits.push(i + 1);
  }
  return hits;
}

function scan(root: string): string[] {
  const offenders: string[] = [];
  const walk = (d: string) => {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.tsx?$/.test(entry.name)) {
        for (const line of offendingLines(readFileSync(full, "utf8"))) {
          offenders.push(`${path.relative(root, full)}:${line}`);
        }
      }
    }
  };
  walk(root);
  return offenders;
}

describe("window.print() is never called", () => {
  const web = path.join(__dirname, "..", "..");

  it("not from any component", () => {
    const offenders = scan(path.join(web, "components"));
    expect(
      offenders,
      `window.print() does nothing on iOS home-screen apps and in several ` +
        `Android WebViews — export via ExportCardButton (or ExportableSection ` +
        `on a server-rendered page) instead: ${offenders.join(", ")}`,
    ).toEqual([]);
  });

  it("not from any route", () => {
    const offenders = scan(path.join(web, "app"));
    expect(
      offenders,
      `window.print() does nothing on iOS home-screen apps and in several ` +
        `Android WebViews — export via ExportCardButton (or ExportableSection ` +
        `on a server-rendered page) instead: ${offenders.join(", ")}`,
    ).toEqual([]);
  });

  /* The scanner has to be sharper than a substring search, or it goes red on
     the comments that explain the rule and someone deletes the guard instead
     of the call. These pin both halves. */
  it("catches a real call, however it is spelled", () => {
    expect(offendingLines("onClick={() => window.print()}")).toEqual([1]);
    expect(offendingLines("  window . print ( ) ;")).toEqual([1]);
  });

  it("ignores a call named in a comment", () => {
    expect(offendingLines("// never window.print()")).toEqual([]);
    expect(offendingLines("/* window.print() is absent on iOS */")).toEqual([]);
    expect(offendingLines("/*\n * window.print()\n */")).toEqual([]);
  });
});
