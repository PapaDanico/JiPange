import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { PLANNER_NAV_ITEMS } from '../planner-nav';
import { TOOL_META } from '../tool-meta';

/**
 * One product, one name.
 *
 * /planners/hustle carried four of them at once. The header dropdown and the
 * share card called it the "Hustle Income Smoother"; the page heading called
 * it the "Cycle Venture Planner"; the footer said "Cycle venture planner"; the
 * home page said "Hustle income" under a briefcase.
 *
 * That is not a cosmetic inconsistency, because "Hustle Income Smoother" is
 * already taken: it is the gig-income calculator at /tools/hustle-smoother,
 * which does something else. It averages a freelancer's last few months into a
 * monthly draw. The planner rings-fences next cycle's seed capital for a
 * poultry or horticulture run. A reader who clicked "Hustle Income Smoother"
 * in the planners menu landed on a different tool than the one they clicked in
 * the calculators menu, under a heading that matched neither.
 *
 * Every copy came from the same cause — each surface retyped the name instead
 * of reading it — so the fix is to read it, and these tests hold that shut.
 */
describe('planner names', () => {
  const read = (p: string) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');

  it('gives no two planners the same name', () => {
    const titles = PLANNER_NAV_ITEMS.map((i) => i.title);
    expect(new Set(titles).size, `duplicate planner titles in ${titles.join(', ')}`).toBe(
      titles.length
    );
  });

  it('does not reuse a calculator name for a planner', () => {
    // The failure that started this: two different products, one name.
    const calculatorNames = new Set(
      Object.values(TOOL_META)
        .filter((m) => m.href.startsWith('/tools/'))
        .map((m) => m.name.toLowerCase())
    );
    for (const item of PLANNER_NAV_ITEMS) {
      expect(
        calculatorNames.has(item.title.toLowerCase()),
        `the planner at ${item.href} is called "${item.title}", which is already a calculator`
      ).toBe(false);
    }
  });

  it('names the cycle planner after what it does, not after the calculator', () => {
    // Asserted on the rendered surfaces, not only on the registry: the registry
    // was one of the four places that disagreed.
    for (const f of [
      'app/planners/hustle/page.tsx',
      'app/planners/hustle/opengraph-image.tsx',
      'app/page.tsx',
      'components/Footer.tsx',
    ]) {
      const src = read(f);
      const near = [...src.matchAll(/\/planners\/hustle/g)].map((m) =>
        src.slice(Math.max(0, m.index! - 220), m.index! + 220)
      );
      expect(near.length, `${f} no longer links to /planners/hustle`).toBeGreaterThan(0);
      for (const window of near) {
        expect(
          window,
          `${f} labels the cycle planner with the gig calculator's name`
        ).not.toMatch(/hustle\s+income/i);
      }
    }
  });

  it('reads the name on the page and the share card rather than retyping it', () => {
    /* A matching literal in two files is two files that can drift, and this
     * route proves it: they were identical once. */
    for (const f of ['app/planners/hustle/page.tsx', 'app/planners/hustle/opengraph-image.tsx']) {
      expect(read(f), `${f} does not source its title from the nav registry`).toMatch(
        /PLANNER_NAV_ITEMS/
      );
    }
  });

  it('cross-links to a planner under the planner\'s own name', () => {
    // TOOL_META listed /planners/education as the "School Fees Smoother".
    for (const item of PLANNER_NAV_ITEMS) {
      const meta = TOOL_META[item.href];
      if (!meta) continue;
      expect(meta.name, `${item.href} is cross-linked under a different name`).toBe(item.title);
      expect(meta.icon).toBe(item.icon);
    }
  });
});
