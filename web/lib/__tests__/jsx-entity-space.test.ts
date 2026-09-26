import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";

/**
 * The compiler deletes a space that is plainly in the source.
 *
 * JSX text that starts with a space on the same line and contains an HTML
 * entity loses that space in the SWC build. This source:
 *
 *     <strong>section 29</strong> of
 *     Kenya&apos;s <strong>Data Protection Act</strong>
 *
 * shipped to readers as "section 29of Kenya's". A run of text without an
 * entity keeps its space, which is why this looked like isolated typos: ten
 * places across the site, found by a spell-check sweep in September 2026
 * ("monthto", "biggerpot") and, for the ones a dictionary cannot see
 * ("29of", "Over 50%" glued to a status label), by this scan. The PDFs
 * inherit them, because they are rasterised from the same DOM.
 *
 * Trailing spaces survive (checked in the compiled output), so only the
 * leading case is barred. The fix is an explicit {" "}, which no compiler
 * trims.
 */
const root = new URL("../../", import.meta.url).pathname;

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return /node_modules|__tests__|\.next/.test(p) ? [] : walk(p);
    return p.endsWith(".tsx") ? [p] : [];
  });

const files = ["app", "components"].flatMap((d) => walk(join(root, d)));

function offenders(file: string, src = readFileSync(file, "utf8")): string[] {
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const out: string[] = [];
  const visit = (n: ts.Node) => {
    if (n.kind === ts.SyntaxKind.JsxText) {
      const text = n.getFullText(sf);
      if (/^[ \t]+\S/.test(text) && /&[a-zA-Z0-9#]+;/.test(text)) {
        const { line } = sf.getLineAndCharacterOfPosition(n.getStart(sf));
        out.push(`${file.replace(root, "")}:${line + 1} ${JSON.stringify(text.trim().slice(0, 50))}`);
      }
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
  return out;
}

describe("JSX text keeps the space the source shows", () => {
  it("scans a real set of files", () => {
    expect(files.length).toBeGreaterThan(50);
  });

  it("no text run starts with a bare space and contains an HTML entity", () => {
    const found = files.flatMap((f) => offenders(f));
    expect(
      found,
      `These render with their leading space deleted. Put {" "} before the text:\n${found.join("\n")}`
    ).toEqual([]);
  });

  it("would catch the defect it was written for", () => {
    const sample = `export const P = () => <p><strong>section 29</strong> of Kenya&apos;s law</p>;`;
    const fixed = `export const P = () => <p><strong>section 29</strong>{" "}of Kenya&apos;s law</p>;`;
    expect(offenders(join(root, "probe.tsx"), sample)).toHaveLength(1);
    expect(offenders(join(root, "probe.tsx"), fixed)).toEqual([]);
  });
});
