import { test, expect, type Page } from "@playwright/test";
import { ROUTES } from "./helpers";

/**
 * CUMULATIVE LAYOUT SHIFT, MEASURED THE WAY THE BROWSER SCORES IT.
 *
 * CLS is a Core Web Vital, so this belongs with the discoverability work
 * rather than filed as polish — but the reason to guard it here is the
 * reader, not the ranking. A page that shoves its content down as data
 * arrives is one you tap the wrong thing on.
 *
 * This site is the shape most likely to do that: 25 of the 44 routes are
 * calculators whose inputs, results and insight cards are all client
 * rendered. The sister project measured exactly this failure — its one
 * client-rendered tool page grows 2953px to 4504px on hydration and scores
 * 0.3567 against Google's 0.10 — and nothing here had ever looked.
 *
 * MEASUREMENT
 *
 * `layout-shift` entries without `hadRecentInput`, summed over 2.5s from
 * navigation, with `buffered: true` so entries that fired before the observer
 * existed are still counted. The 2.5s window is the point: the shifts this
 * guards against happen AS hydration lands, which a load-only wait would miss
 * entirely — the same mistake that once left the layout sweep reading 272 of
 * 864 elements.
 *
 * Phone width only. Layout shift is worst where the viewport is narrowest and
 * a late-arriving block has nowhere to go but down.
 *
 * PER-ROUTE CEILINGS, NOT EXCLUSIONS
 *
 * Routes that are bad today are recorded in KNOWN with their own ceiling
 * rather than dropped from the list or granted a raised global budget. Both
 * of those lie: dropping a route lets it get worse unnoticed, and raising the
 * shared budget tells every healthy route it may triple.
 *
 * A KNOWN entry also fails if the route is FIXED — scoring within budget
 * demands the entry be removed. A stale allowance is how a budget quietly
 * becomes a floor, which is the same failure mode as the clamp exemption that
 * once made a guard decorative while it reported green.
 */

/** Google's "needs improvement" boundary. Above this is "poor". */
const BUDGET = 0.1;

/**
 * Routes that exceed the budget today, each with its own ceiling.
 *
 * Empty, and measured that way rather than assumed: all 44 routes score
 * 0.0000. That result was suspicious enough to check before trusting — see
 * the self-check test below — and it holds up for a structural reason.
 *
 * This app is a server build, so a calculator's markup is in the initial HTML
 * and hydration attaches to it without moving anything. The sister project
 * ships `output: export`, where a client component renders to nothing on the
 * server and its full height arrives at once; that is why its one such page
 * scores 0.3567 while every page here scores zero. The difference is the
 * rendering mode, not the care taken.
 *
 * So this guard has nothing to report today and is committed anyway. It
 * exists for the first component added with `ssr: false`, a client-only
 * chart, or a late-loading embed — none of which look wrong in review.
 */
const KNOWN: Record<string, number> = {};

/**
 * The measurement, defined once.
 *
 * Both the sweep and the self-check below call this rather than each carrying
 * a copy of the observer. That is the whole point of the self-check: if it
 * measured through its own duplicate, someone could break the sweep's observer
 * — shorten the window, drop `buffered` — and the self-check would keep
 * passing while the sweep quietly measured nothing.
 */
async function measureCLS(page: Page): Promise<number> {
  return page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        let total = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const shift = entry as PerformanceEntry & {
              hadRecentInput: boolean;
              value: number;
            };
            if (!shift.hadRecentInput) total += shift.value;
          }
        }).observe({ type: "layout-shift", buffered: true });
        setTimeout(() => resolve(Math.round(total * 10000) / 10000), 2500);
      })
  );
}

test.describe("layout shift", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(180_000);

  test("no route shifts more than its ceiling while loading", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    const scores: Record<string, number> = {};
    const problems: string[] = [];

    for (const route of ROUTES) {
      await page.goto(route, { waitUntil: "load" });
      const cls = await measureCLS(page);

      scores[route] = cls;
      const ceiling = KNOWN[route] ?? BUDGET;
      if (cls > ceiling) {
        problems.push(
          `${route} CLS ${cls} exceeds ${ceiling}` +
            (route in KNOWN ? " — a known-bad route got worse" : "")
        );
      } else if (route in KNOWN && cls <= BUDGET) {
        problems.push(
          `${route} now scores ${cls}, within ${BUDGET} — remove its entry from KNOWN`
        );
      }
    }

    // Print every score, so a route sitting just under its ceiling is visible
    // in the log rather than only discovered when it crosses.
    const worst = Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
    console.log(
      "worst layout shift:\n" +
        worst
          .map(([r, v]) => `  ${v.toFixed(4).padStart(8)}  ${r}${r in KNOWN ? ` (known bad, ceiling ${KNOWN[r]})` : ""}`)
          .join("\n")
    );

    expect(problems, problems.join("\n")).toEqual([]);
  });

  /**
   * THE SWEEP ABOVE PASSES WITH EVERY ROUTE AT 0.0000, WHICH IS ALSO WHAT A
   * BROKEN MEASUREMENT LOOKS LIKE.
   *
   * A guard that cannot fail is worse than no guard: it reports green over
   * whatever it stopped watching. If the observer were registered too late,
   * the window shortened below hydration, the `hadRecentInput` filter
   * inverted, or the viewport left wide enough to absorb the reflow, every
   * route would still read zero and the sweep would still pass.
   *
   * So the measurement proves itself on every run rather than on the day it
   * was written. This injects the exact shape the sweep exists to catch — a
   * block arriving above the content after load — and requires it to be seen.
   * Both tests are needed: this one alone says the tool works, the sweep alone
   * says the pages are clean, and only together do they say the pages are
   * clean *and we would know if they weren't*.
   *
   * WHAT THIS DOES NOT COVER, STATED RATHER THAN IMPLIED
   *
   * `measureCLS` was broken four ways against this test. It catches a
   * shortened observation window, an inverted `hadRecentInput` filter, and
   * values that never accumulate. It does NOT catch removing `buffered: true`
   * — the injection lands at 600ms, when the observer already exists, so the
   * entry is seen live and the buffer is never exercised.
   *
   * A test for that was written and then deleted rather than shipped:
   * injecting at `DOMContentLoaded` produces no shift at all, because CLS only
   * scores content that has already been painted, and the real gap — after
   * first paint, before `page.evaluate` constructs the observer — is a few
   * racy milliseconds wide. A flaky test there would be worse than this
   * paragraph.
   *
   * `buffered: true` is therefore load-bearing for pre-observer shifts and is
   * not defended by a test. Treat it that way if tempted to tidy it away.
   */
  test("the measurement itself detects a shift", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(() => {
      setTimeout(() => {
        const block = document.createElement("div");
        block.style.height = "400px";
        document.body.insertBefore(block, document.body.firstChild);
      }, 600);
    });
    await page.goto("/tools/salary", { waitUntil: "load" });

    const cls = await measureCLS(page);

    // A 400px block on an 844px viewport is comfortably past the budget; the
    // assertion is that the shift is SEEN, not that it lands on an exact value.
    expect(cls, `injected a 400px shift and measured CLS ${cls}`).toBeGreaterThan(BUDGET);
  });

});
