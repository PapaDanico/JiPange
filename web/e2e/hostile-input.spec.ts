import { test, expect } from "@playwright/test";
import { ROUTES, settled } from "./helpers";

/**
 * WHAT EVERY CALCULATOR DOES WITH A NUMBER NOBODY MEANT TO TYPE.
 *
 * tools.spec.ts drives each calculator with sensible figures and asserts the
 * answer. Every input in that suite is a number a person would plausibly mean.
 * Zero is not, and it is one keystroke away: it is what a cleared field holds,
 * and in tools that divide by income, by months, or by a rate, it is the
 * divisor. `0/0` is NaN and `1/0` is Infinity, and both render — "Ksh NaN",
 * "Infinity months" — in the same styled box as a correct answer.
 *
 * THE FIRST VERSION OF THIS FILE WAS DECORATION, AND ONLY A MUTATION SAID SO
 *
 * It filled EVERY field with 0 and scanned for garbage. It passed on all 28
 * routes — and it passed just as happily with `calculateMoneyRunwayMonths`
 * hard-wired to `return NaN`.
 *
 * The reason is that these calculators decline to answer a meaningless
 * question: with every amount at zero the result section does not render at
 * all. Nothing arithmetic was ever reached, and a sweep that never reaches the
 * arithmetic cannot find a fault in it. Filling every field with the hostile
 * value destroys the very state that value is meant to corrupt.
 *
 * So the result is kept ALIVE. Every field is given a workable figure first,
 * the run asserts a result actually appeared, and only then is ONE field
 * zeroed at a time. That is also the realistic shape of the mistake: a
 * filled-in form with one field cleared, not a form of nothing.
 *
 * WHAT COUNTS AS A FAILURE
 *
 * Only text a reader would see: NaN, Infinity, undefined, null, or a negative
 * zero in visible copy. A result that disappears when a field is zeroed is a
 * correct answer, not a defect — this asserts the tools never produce
 * arithmetic garbage, not that they always produce something.
 *
 * WHAT THIS FOUND, AND WHAT IT PROVES — BOTH STATED, BECAUSE THEY DIFFER
 *
 * It found NOTHING: 62 fields zeroed across 25 calculators, all clean. That is
 * a real result and not a formality, because the app turns out to be defended
 * in depth. Four mutations were run against it:
 *
 *   calculateMoneyRunwayMonths -> NaN            NOT caught
 *   ...with the isFinite guard removed too       NOT caught
 *   the isFinite guard removed alone             NOT caught
 *   formatDuration returning a raw NaN           CAUGHT — named route + field
 *
 * The first three were absorbed by the app: `formatDuration` turns any
 * non-finite value into "Forever — your balance keeps growing", and the
 * component declines to compute at all for the inputs that would otherwise
 * reach `ln` of a negative. Those are the guards working, not the sweep
 * failing.
 *
 * But it does mean this sweep does NOT prove those guards are load-bearing.
 * It catches garbage that is REACHABLE BY ZEROING ONE FIELD, which is the
 * realistic mistake, and the fourth mutation shows the detection path works
 * end to end — navigate, seed, zero, read, match, report with a location.
 * It is regression cover for the render layer, not a proof of the arithmetic
 * beneath it. Read it as the first and do not claim the second.
 *
 * Three routes render no result from a uniform seed and are skipped by name in
 * the log rather than silently: 20th-challenge, chama, savings-goal. They take
 * inputs the flat 50000 does not satisfy. Worth revisiting if a defect ever
 * turns up there — a skipped route is a route nobody checks.
 */

const CALCULATORS = ROUTES.filter(
  (r) => r.startsWith("/tools/") || r.startsWith("/planners/")
);

/** A figure every one of these tools can do something with. Fields that ship
 *  with a default keep it — those are rates and horizons, already sane. */
const WORKABLE = "50000";

const GARBAGE = /\bNaN\b|\bInfinity\b|\bundefined\b|\bnull\b|Ksh\s*-0\b/;

test.describe("hostile input", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(900_000);

  test("no calculator renders arithmetic garbage when one field is zeroed", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const problems: string[] = [];
    const inert: string[] = [];
    let exercised = 0;

    for (const route of CALCULATORS) {
      await page.goto(route, { waitUntil: "load" });
      await settled(page);

      const boxes = page.getByRole("spinbutton");
      const count = await boxes.count();
      if (count === 0) continue;

      const bare = await page.evaluate(() => document.body.innerText);

      // Put the form into a workable state: empty fields get a figure, fields
      // that already carry a default keep theirs.
      const seeded: string[] = [];
      for (let i = 0; i < count; i++) {
        const box = boxes.nth(i);
        if (!(await box.isVisible().catch(() => false))) {
          seeded.push("");
          continue;
        }
        const current = await box.inputValue().catch(() => "");
        if (current === "") await box.fill(WORKABLE).catch(() => undefined);
        seeded.push(await box.inputValue().catch(() => ""));
      }
      await page.keyboard.press("Tab");
      await settled(page);

      const computed = await page.evaluate(() => document.body.innerText);
      // A result adds a visible block of text. Without this check the sweep
      // silently degrades back into testing an empty form, which is exactly
      // how the previous version passed while proving nothing.
      if (computed.length <= bare.length + 40) {
        inert.push(route);
        continue;
      }

      // Zero one field at a time, restoring it before the next, so each check
      // has exactly one thing wrong with it.
      for (let i = 0; i < count; i++) {
        const box = boxes.nth(i);
        if (!(await box.isVisible().catch(() => false))) continue;
        if (await box.isDisabled().catch(() => true)) continue;

        await box.fill("0").catch(() => undefined);
        await page.keyboard.press("Tab");
        await settled(page);

        const text = await page.evaluate(() => document.body.innerText);
        const line = text.split("\n").find((l) => GARBAGE.test(l));
        if (line) {
          problems.push(`${route} field ${i} zeroed — "${line.trim().slice(0, 110)}"`);
        }

        await box.fill(seeded[i] || WORKABLE).catch(() => undefined);
        exercised++;
      }
    }

    console.log(
      `hostile input: ${exercised} field(s) zeroed across ` +
        `${CALCULATORS.length - inert.length} calculators` +
        (inert.length ? `; no result rendered on ${inert.length}: ${inert.join(", ")}` : "")
    );

    expect(problems, problems.join("\n")).toEqual([]);
  });
});
