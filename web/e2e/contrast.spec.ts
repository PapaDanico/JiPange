import { test, expect } from "@playwright/test";
import { settled } from "./helpers";

/**
 * WCAG 1.4.3 CONTRAST, MEASURED ON RENDERED TEXT.
 *
 * Twelve AA failures were found and fixed the day this was written, and
 * nothing would have stopped them coming back. That is the same gap that let
 * the ragged-button fix ship without a test and reappear one breakpoint later,
 * so the scan that found them is committed rather than thrown away.
 *
 * WHY THE FAILURES HAPPENED, WHICH IS WHAT THIS GUARDS
 *
 * Four colour tokens — muted, accent-ink, success, faint — were each AA on
 * pure white and under 4.5:1 on --color-canvas, the tint most secondary copy
 * actually sits on. `--color-muted` even carried the comment "AA on
 * white/background". The claim was true about a background the text is rarely
 * on, and a source scan cannot tell the difference. Only rendering can.
 *
 * The other family was token misuse: --color-accent is the FILL gold, and the
 * homepage used it for text where --color-accent-ink, defined in the same file
 * as "readable amber for text on soft tints", was the right one.
 *
 * HOW THE BACKGROUND IS RESOLVED
 *
 * By walking ancestors until something opaque, which is what the eye does.
 * Anything over a background image or gradient is skipped rather than guessed
 * at — a wrong pass and a wrong fail are both worse than silence there.
 *
 * WHAT THIS DELIBERATELY DOES NOT CHECK
 *
 * Hover and focus states, which are not reachable in a static sweep, and
 * disabled controls, which WCAG exempts. Both remain a reader's problem if
 * they regress; this is not a complete accessibility audit and should not be
 * read as one.
 */
const ROUTES = [
  "/",
  "/about",
  "/dashboard",
  "/faq",
  "/glossary",
  "/licensing",
  "/money-map",
  "/partners",
  "/picture",
  "/plan",
  "/planners",
  "/planners/education",
  "/planners/hustle",
  "/privacy",
  "/profile",
  "/support",
  "/terms",
  "/tools",
  "/tools/20th-challenge",
  "/tools/budget-split",
  "/tools/chama",
  "/tools/debt-escape",
  "/tools/dhowcsd",
  "/tools/fire-number",
  "/tools/fuliza-cost",
  "/tools/guarantor-shield",
  "/tools/hustle-smoother",
  "/tools/inflation-reality",
  "/tools/investment-returns",
  "/tools/kplc-optimizer",
  "/tools/land-purchase",
  "/tools/loan-repayment",
  "/tools/money-runway",
  "/tools/one-third-rule",
  "/tools/payday-router",
  "/tools/sacco-vs-bank",
  "/tools/salary",
  "/tools/salary-negotiation",
  "/tools/savings-goal",
  "/tools/school-fees-lifetime",
  "/tools/sha-health",
  "/tools/take-home-pay",
  "/tools/tax-shield",
  "/tools/where-to-save",
];

test("no text falls below its WCAG AA contrast floor", async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  const failures: string[] = [];

  for (const route of ROUTES) {
    await page.goto(route, { waitUntil: "load" });
    await settled(page);

    const found: string[] = await page.evaluate(() => {
      const parse = (c: string) => {
        const m = c.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/);
        return m
          ? { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] }
          : null;
      };
      type C = { r: number; g: number; b: number; a: number };
      const lum = ({ r, g, b }: C) => {
        const f = (v: number) => {
          v /= 255;
          return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
        };
        return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
      };
      const over = (fg: C, bg: C): C => ({
        r: fg.r * fg.a + bg.r * (1 - fg.a),
        g: fg.g * fg.a + bg.g * (1 - fg.a),
        b: fg.b * fg.a + bg.b * (1 - fg.a),
        a: 1,
      });
      const ratio = (a: C, b: C) => {
        const [hi, lo] = [lum(a), lum(b)].sort((m, n) => n - m);
        return (hi + 0.05) / (lo + 0.05);
      };

      const out: string[] = [];
      for (const el of document.querySelectorAll("*")) {
        const e = el as HTMLElement;
        // Only elements that render text of their own.
        if (![...e.childNodes].some((n) => n.nodeType === 3 && n.nodeValue!.trim())) continue;
        const cs = getComputedStyle(e);
        if (cs.display === "none" || cs.visibility === "hidden" || cs.opacity === "0") continue;
        const r = e.getBoundingClientRect();
        // The whole page, not just the first screenful: clipping at the fold
        // hid half the original findings.
        if (r.width < 4 || r.height < 4) continue;
        const fg = parse(cs.color);
        if (!fg || fg.a === 0) continue;

        let bg: C | null = null;
        let node: HTMLElement | null = e;
        let onImage = false;
        while (node) {
          const ncs = getComputedStyle(node);
          if (ncs.backgroundImage && ncs.backgroundImage !== "none") { onImage = true; break; }
          const c = parse(ncs.backgroundColor);
          if (c && c.a === 1) { bg = c; break; }
          if (c && c.a > 0) bg = bg ? over(c, bg) : c;
          node = node.parentElement;
        }
        if (onImage || !bg) continue;
        if (bg.a < 1) bg = over(bg, { r: 255, g: 255, b: 255, a: 1 });

        const eff = fg.a < 1 ? over(fg, bg) : fg;
        const size = parseFloat(cs.fontSize);
        const bold = parseInt(cs.fontWeight, 10) >= 700;
        const need = size >= 24 || (size >= 18.66 && bold) ? 3 : 4.5;
        const got = ratio(eff, bg);
        if (got < need - 0.01) {
          out.push(
            `${Math.round(got * 100) / 100}:1 (needs ${need}) ${Math.round(size)}px${bold ? " bold" : ""} ` +
              `${cs.color} on rgb(${Math.round(bg.r)},${Math.round(bg.g)},${Math.round(bg.b)}) — ` +
              `"${(e.textContent || "").trim().slice(0, 40)}"`,
          );
        }
      }
      return [...new Set(out)];
    });

    for (const f of found.slice(0, 3)) failures.push(`${route}  ${f}`);
  }

  expect(failures, `contrast failures:\n  ${failures.join("\n  ")}`).toEqual([]);
});
