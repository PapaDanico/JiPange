import { test, expect } from "@playwright/test";

/**
 * THE LAYOUT DEFECTS THAT NO UNIT TEST CAN SEE, ACROSS THE WHOLE SITE.
 *
 * hero-cta.spec.ts exists because a fix shipped for phones and reappeared at
 * 1440px, where the hero's left column narrowed enough to wrap two buttons back
 * into a ragged stack. That test guards one element on one page. The bug was
 * never about that element — it was about a rule ("full width when narrow")
 * that was written against a breakpoint instead of against what the layout
 * actually does — and nothing stopped the same shape appearing on any of the
 * other thirty-odd routes.
 *
 * So this sweeps. Three viewports, the routes a reader actually lands on, and
 * three properties that are only observable once something is rendered:
 *
 *   1. The page does not scroll sideways.
 *   2. No visible text box is cut off by its own overflow.
 *   3. Buttons stacked one per line agree on width.
 *
 * Every one of these is decided by geometry rather than by class names, which
 * is the point: a scan of the source cannot tell you whether 266 + 188 + 12 fits
 * in 450px, and that arithmetic was the entire bug.
 *
 * ON RUNNING THIS AGAINST A REAL BUILD
 *
 * Playwright drives the built app here, and that is not incidental. The same
 * three checks pointed at a dev server reported 130px of horizontal overflow on
 * every route of the sister project — an artifact of unapplied CSS leaving a
 * logo at its natural 512px, with zero overflow in the production build. A
 * layout check that does not run on built output does not find defects, it
 * manufactures them.
 */
const VIEWPORTS = [
  { name: "phone", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
];

const ROUTES = [
  "/",
  "/tools",
  "/tools/salary",
  "/tools/where-to-save",
  "/tools/savings-goal",
  "/planners",
  "/picture",
  "/glossary",
];

type Findings = { overflow: number; clipped: string[]; ragged: string[] };

for (const vp of VIEWPORTS) {
  test(`layout holds at ${vp.name} (${vp.width}px)`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    const problems: string[] = [];

    for (const route of ROUTES) {
      await page.goto(route);
      await page.waitForLoadState("networkidle");

      const found: Findings = await page.evaluate(() => {
        const res: Findings = {
          overflow: document.documentElement.scrollWidth - window.innerWidth,
          clipped: [],
          ragged: [],
        };

        /* Visibly clipped text. Skip-links and other sr-only content are
           collapsed to a 1px box deliberately, so only boxes with a real
           height are interesting. This catches a box whose CONTENT is taller
           than its frame — clamped or not — which is how text silently
           disappears.

           The shortfall must exceed half a line before it counts. A first run
           flagged nine headline figures — "3.23%", "17.7M", "Ksh 6.1T" — every
           one of them `leading-none`, where line-height equals font-size while
           the font's own ascent plus descent does not. scrollHeight reports the
           font's metrics, so a 48px box reports 53px of content and not one
           pixel of ink is missing. That overshoot is always a fraction of a
           line; losing a line of text never is. The auction banner defect in
           the sister repo hid 132px against a 22px line and clears this bar
           six times over. */
        for (const el of document.querySelectorAll("p,h1,h2,h3,li,td,caption,label")) {
          const e = el as HTMLElement;
          if (e.clientHeight < 8) continue;
          const cs = getComputedStyle(e);
          /* Clamped elements are NOT exempt. A `continue` on
             webkitLineClamp !== "none" was here and it reads as obviously
             right — a deliberate clamp on a description is a decision, not a
             bug. In the sister project, where the same check guards an auction
             banner that hid 132px of its identifier under line-clamp:2, that
             exemption skipped the exact defect and the guard went green with
             the bug restored.
             A clamp declares how much is shown. It does not declare that the
             amount hidden is acceptable. The half-line rule below judges that
             for clamped and unclamped text alike. */
          const line = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) || 16;
          if (e.scrollHeight - e.clientHeight > line * 0.5) {
            res.clipped.push(
              `${e.tagName.toLowerCase()} shows ${e.clientHeight}px of ${e.scrollHeight}px: "${(
                e.textContent || ""
              )
                .trim()
                .slice(0, 40)}"`,
            );
          }
        }

        /* Buttons stacked one per line must agree on width. Whether they are
           stacked is read off the boxes, not off a breakpoint, so this keeps
           holding when copy length changes where the wrap falls. */
        for (const wrap of document.querySelectorAll("div,nav,section,form")) {
          const kids = [...wrap.children].filter((c) => {
            if (c.tagName !== "A" && c.tagName !== "BUTTON") return false;
            const r = c.getBoundingClientRect();
            return r.height >= 32 && r.width > 40 && getComputedStyle(c).display !== "none";
          });
          if (kids.length < 2) continue;
          const boxes = kids.map((k) => k.getBoundingClientRect());
          if (!boxes.every((b, i) => i === 0 || b.top >= boxes[i - 1].bottom - 2)) continue;
          const widths = boxes.map((b) => Math.round(b.width));
          const spread = Math.max(...widths) - Math.min(...widths);
          if (spread > 2) {
            res.ragged.push(
              `${widths.join("/")}px — "${(kids[0].textContent || "").trim().slice(0, 24)}"`,
            );
          }
        }
        return res;
      });

      if (found.overflow > 0) problems.push(`${route} scrolls sideways by ${found.overflow}px`);
      for (const c of [...new Set(found.clipped)].slice(0, 2)) problems.push(`${route} ${c}`);
      for (const r of [...new Set(found.ragged)].slice(0, 2)) {
        problems.push(`${route} stacked buttons are ragged: ${r}`);
      }
    }

    expect(problems, `at ${vp.width}px:\n  ${problems.join("\n  ")}`).toEqual([]);
  });
}
