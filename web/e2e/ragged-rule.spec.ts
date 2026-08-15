import { test, expect } from "@playwright/test";

/**
 * THE RAGGED-STACK RULE, PINNED TO CASES INSTEAD OF TO PROSE.
 *
 * The sweeps in layout-regressions.spec.ts run against the real site, so they
 * only exercise whatever shapes the site happens to contain today. That is the
 * right thing for finding defects and the wrong thing for pinning a RULE: when
 * the site has no ragged stack, the sweep passes whether the rule is correct,
 * subtly wrong, or deleted.
 *
 * Both of this rule's two bugs proved that. Each was found by accident on the
 * real site and neither would have been caught by the sweep going green:
 *
 *   - Matching every <a> over 32px counted padded TEXT LINKS as buttons, and
 *     flagged the sister project's footer link column at 149/132/110px. Ragged
 *     left-aligned links are what a list of links is supposed to look like.
 *     This repo had the identical filter and never tripped — its footer links
 *     happen to share a line at the swept widths. Passing by luck, not by rule.
 *
 *   - Filtering the children BEFORE reading row structure invents stacks. A
 *     flush [Download PDF] / [Save image + Print] row was reported as a ragged
 *     358/180 because the unpainted "Print" was dropped first, turning a
 *     two-item row into a phantom lone item.
 *
 * So the rule is stated here as cases, on synthetic markup, where each one is
 * present whether or not the site contains that shape. Changing the rule in
 * one repo now fails here rather than silently diverging from the other — the
 * drift that left this repo's guard blind in the first place.
 *
 * These fixtures deliberately hard-code widths and borders rather than using
 * the app's classes: the point is to pin the CHECK, not the design tokens.
 */

/** The rule under test, kept identical to the sweep's implementation. */
const RULE = `(wrap) => {
  const clear = (v) => !v || /rgba\\(0, 0, 0, 0\\)|transparent/.test(v);
  const siblings = [...wrap.children].filter((c) => {
    const r = c.getBoundingClientRect();
    return r.height >= 8 && getComputedStyle(c).display !== 'none';
  });
  const perRow = new Map();
  for (const c of siblings) {
    const t = Math.round(c.getBoundingClientRect().top);
    perRow.set(t, (perRow.get(t) || 0) + 1);
  }
  const kids = siblings.filter((c) => {
    if (c.tagName !== 'A' && c.tagName !== 'BUTTON') return false;
    const r = c.getBoundingClientRect();
    if (r.height < 32 || r.width <= 40) return false;
    const k = getComputedStyle(c);
    return (!clear(k.backgroundColor)) ||
      (parseFloat(k.borderTopWidth) > 0 && !clear(k.borderTopColor));
  });
  if (kids.length < 2) return null;
  const lone = kids.filter((k) => perRow.get(Math.round(k.getBoundingClientRect().top)) === 1);
  if (lone.length < 2) return null;
  const boxes = lone.map((k) => k.getBoundingClientRect());
  if (!boxes.every((b, i) => i === 0 || b.top >= boxes[i - 1].bottom - 2)) return null;
  const widths = boxes.map((b) => Math.round(b.width));
  const spread = Math.max(...widths) - Math.min(...widths);
  return spread > 2 ? widths.join('/') : null;
}`;

/* box-sizing matters here: with the default content-box, a 1px border on
   each side makes width:160px measure 162px, and the first run of these
   fixtures "failed" purely because I had written the expected numbers as the
   declared widths rather than the rendered ones. The rule was right and the
   cases were wrong — worth pinning so the next reader is not misled the same
   way. */
const PAINTED = "box-sizing:border-box;border:1px solid #333;display:block;height:40px;";
const BARE = "box-sizing:border-box;display:block;height:40px;";

const CASES: { name: string; html: string; expected: string | null }[] = [
  {
    name: "painted chips stacked at different widths — the defect",
    html: `<div id="w"><a href="#" style="${PAINTED}width:160px">A</a>
           <a href="#" style="${PAINTED}width:220px">B</a></div>`,
    expected: "160/220",
  },
  {
    name: "painted chips stacked at equal widths — what `grow` produces",
    html: `<div id="w"><a href="#" style="${PAINTED}width:200px">A</a>
           <a href="#" style="${PAINTED}width:200px">B</a></div>`,
    expected: null,
  },
  {
    name: "BARE text links stacked and ragged — correct typography, not a defect",
    html: `<div id="w"><a href="#" style="${BARE}width:149px">CBK on WhatsApp</a>
           <a href="#" style="${BARE}width:110px">Contact us</a></div>`,
    expected: null,
  },
  {
    name: "an UNPAINTED sibling sharing row two must not create a phantom lone item",
    html: `<div id="w" style="width:360px">
             <a href="#" style="${PAINTED}width:360px;float:left">Download PDF</a>
             <a href="#" style="${PAINTED}width:180px;float:left">Save image</a>
             <a href="#" style="${BARE}width:170px;float:left">Print</a>
           </div>`,
    expected: null,
  },
  {
    name: "a 4px mismatch still counts — small enough to miss by eye, still a wobble",
    html: `<div id="w"><a href="#" style="${PAINTED}width:163px">A</a>
           <a href="#" style="${PAINTED}width:159px">B</a></div>`,
    expected: "163/159",
  },
  {
    name: "a 2px mismatch does not — under the tolerance for rounding",
    html: `<div id="w"><a href="#" style="${PAINTED}width:200px">A</a>
           <a href="#" style="${PAINTED}width:202px">B</a></div>`,
    expected: null,
  },
];

for (const c of CASES) {
  test(`ragged-stack rule: ${c.name}`, async ({ page }) => {
    await page.setContent(`<body style="margin:0">${c.html}</body>`);
    const got = await page.evaluate(
      ([html, rule]) => {
        void html;
        // eslint-disable-next-line no-eval
        const fn = eval(rule) as (w: Element) => string | null;
        return fn(document.getElementById("w")!);
      },
      [c.html, RULE] as const,
    );
    expect(got, `case: ${c.name}`).toBe(c.expected);
  });
}
