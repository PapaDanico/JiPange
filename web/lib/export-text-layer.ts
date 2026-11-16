/**
 * An invisible text layer for the exported PDFs.
 *
 * The sheets are rasterised, so a PDF was a photograph of its figures: no
 * search, no selection, no copy into a spreadsheet, nothing for a screen
 * reader (the 16 Nov audit found 0 extractable characters in all 18). The
 * sister product's reports already carry an invisible layer; this is the same
 * idea for the sheet, measured from the sheet itself so it follows whatever
 * orientation, scale and column flow the layout chose.
 */

export interface TextRun {
  text: string;
  /** CSS px from the sheet's top-left, left edge. */
  x: number;
  /** CSS px from the sheet's top-left, bottom of the text box. */
  y: number;
  /** CSS px, estimated from the drawn height so CSS transforms are honoured. */
  size: number;
}

const MAP: Record<string, string> = {
  "–": "-", "—": "-", "−": "-", "‑": "-",
  "‘": "'", "’": "'", "“": '"', "”": '"',
  "…": "...", "×": "x", "÷": "/", "•": "*", "·": "-",
  "→": "->", "←": "<-", "✓": "", "✔": "", "▲": "", "⚠": "",
  " ": " ", " ": " ", " ": " ",
};

/** The standard PDF fonts cannot draw most of Unicode; map what we can, drop the rest. */
export function toPdfText(s: string): string {
  let out = "";
  for (const ch of s) {
    if (ch in MAP) out += MAP[ch];
    else if (ch.charCodeAt(0) <= 0xff) out += ch;
  }
  return out.replace(/\s+/g, " ").trim();
}

/** Every visible run of text under `root`, positioned relative to `root`. */
export function collectTextRuns(root: HTMLElement, pageW: number, pageH: number): TextRun[] {
  const origin = root.getBoundingClientRect();
  const runs: TextRun[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const raw = node.nodeValue ?? "";
    if (!raw.trim()) continue;
    const parent = node.parentElement;
    if (!parent || parent.closest("[aria-hidden='true'], script, style")) continue;
    const cs = getComputedStyle(parent);
    if (cs.visibility === "hidden" || cs.display === "none" || cs.opacity === "0") continue;

    range.selectNodeContents(node);
    const rects = Array.from(range.getClientRects()).filter((r) => r.width > 0 && r.height > 0);
    if (!rects.length) continue;
    const words = toPdfText(cs.textTransform === "uppercase" ? raw.toUpperCase() : raw).split(" ").filter(Boolean);
    if (!words.length) continue;

    const place = (text: string, r: DOMRect) => {
      const x = r.left - origin.left;
      const y = r.bottom - origin.top;
      // The sheet clips what falls outside the page; so must the layer.
      if (x < -1 || y < 0 || x > pageW || y - r.height > pageH) return;
      runs.push({ text: `${text} `, x, y, size: Math.max(4, r.height / 1.25) });
    };
    if (rects.length === 1) {
      place(words.join(" "), rects[0]);
      continue;
    }
    // Wrapped: share the words across the line boxes by width. Approximate, and
    // good enough for search and selection, which is what the layer is for.
    const total = rects.reduce((sum, r) => sum + r.width, 0);
    let cursor = 0;
    rects.forEach((r, i) => {
      const share = i === rects.length - 1 ? words.length - cursor : Math.max(1, Math.round((r.width / total) * words.length));
      const slice = words.slice(cursor, cursor + share).join(" ");
      cursor += share;
      if (slice) place(slice, r);
    });
  }
  return runs;
}
