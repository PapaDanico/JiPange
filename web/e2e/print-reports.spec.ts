import { test, expect } from "@playwright/test";

/**
 * Each printed SECTION must fit its own page.
 *
 * PictureView puts an explicit `print:break-before-page` between the diagnostic
 * and the numbers, with the reasoning written beside it: "each gets its own
 * clean page instead of straddling the break — solo sections still fit a single
 * page." Two pages is therefore the intended shape of a full report, not a
 * defect, and a test asserting the whole document fits one page would be
 * testing the opposite of the design.
 *
 * Total scrollHeight cannot answer this question at all: it is continuous and
 * knows nothing about forced breaks, so a document with an explicit break is
 * two pages however short it is. What the design actually promises is that no
 * SECTION overflows its own page, and that is what is measured here.
 *
 * This exists because a user's saved PDF showed the numbers section running
 * ragged — a tall half-width card beside an entirely empty column, because
 * `print-grid-2` flows cards two-up and the last of an odd number is stranded.
 * Nothing watched the printed geometry; the suite checked that pages render,
 * that controls are big enough and that nothing scrolls sideways, and all of
 * it passed.
 */
const A4_PX = 1123; // 297mm at 96dpi

const seed = async (page: import("@playwright/test").Page, withAge = true) => {
  await page.goto("/");
  await page.evaluate((age) => {
    localStorage.setItem(
      "jipange:profile",
      JSON.stringify(age ? { grossMonthlySalary: 120000, age: 34 } : { grossMonthlySalary: 120000 })
    );
    localStorage.setItem(
      "jipange:journey",
      JSON.stringify({
        life_stage: "building",
        income_zone: "mid",
        // "grow_wealth" is NOT a PrimaryGoal — the funnel offers five values
        // and that is not one. It sat here since this fixture was written, and
        // it is what crashed /plan when this suite was extended to that route:
        // an unknown goal made DOMAIN_META[undefined].bg throw. The lookup is
        // total now (see JourneyActionPlan), and the fixture is a real value,
        // so these tests exercise the report rather than the fallback.
        primary_goal: "home_deposit",
        liquidity_leak: "active_savings",
        current_vehicle: ["mmf"],
      })
    );
  }, withAge);
};

const inPrint = async (page: import("@playwright/test").Page, route: string) => {
  await page.setViewportSize({ width: 794, height: A4_PX });
  await page.goto(route);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1200);
  await page.emulateMedia({ media: "print" });
  await page.waitForTimeout(300);
};

test("print: no printed section overflows its own page", async ({ page }) => {
  await seed(page);
  await inPrint(page, "/picture");

  /* Section = a block that starts a page, plus whatever precedes the first
   * break. Measured from the rendered boxes rather than assumed. */
  const sections = await page.evaluate((pageHeight) => {
    const breaks = Array.from(document.querySelectorAll<HTMLElement>(".print\\:break-before-page"));
    const doc = document.documentElement.scrollHeight;
    if (!breaks.length) return [{ label: "whole document", height: doc }];
    const out: { label: string; height: number }[] = [];
    let prev = 0;
    breaks.forEach((b, i) => {
      const top = b.getBoundingClientRect().top + window.scrollY;
      out.push({ label: `section ${i + 1}`, height: Math.round(top - prev) });
      prev = top;
    });
    out.push({ label: `section ${breaks.length + 1}`, height: Math.round(doc - prev) });
    return out.filter((s) => s.height > 0).map((s) => ({ ...s, pageHeight }));
  }, A4_PX);

  expect(sections.length, "no sections were measured").toBeGreaterThan(0);
  for (const s of sections) {
    expect(
      s.height,
      `${s.label} prints at ${s.height}px against a ${A4_PX}px page — it will straddle a break`
    ).toBeLessThanOrEqual(A4_PX);
  }
});

test("print: the wealth card spans both columns rather than stranding one", async ({ page }) => {
  /* Asserted on rendered geometry, not on the class name. A class assertion
   * would pass if the print stylesheet stopped defining print-span-2 at all,
   * which is precisely how this would regress. */
  await seed(page);
  await inPrint(page, "/picture");

  const widths = await page.evaluate(() => {
    const grid = document.querySelector(".print-grid-2") as HTMLElement | null;
    const card = document.querySelector(".print-span-2") as HTMLElement | null;
    if (!grid || !card) return null;
    return { grid: grid.getBoundingClientRect().width, card: card.getBoundingClientRect().width };
  });

  expect(widths, "no print grid or no full-width card on the page").not.toBeNull();
  expect(
    widths!.card / widths!.grid,
    `the wealth card is ${((widths!.card / widths!.grid) * 100).toFixed(0)}% of the grid width`
  ).toBeGreaterThan(0.9);
});

test("print: no NaN or undefined reaches the paper", async ({ page }) => {
  /* The report printed "Assumes a 20% savings rate at 10% annual return over
   * NaN years" with "Ksh 0" for both trajectories, because lib/storage.ts reads
   * the profile with `JSON.parse(raw) as T` — a cast, not a validation — and a
   * profile carrying no age flowed straight into the projection.
   *
   * Seeded with a DELIBERATELY partial profile, because that is the case that
   * produced it. A complete profile passes this while the defect stands. */
  await seed(page, false);
  await inPrint(page, "/picture");

  const text = await page.innerText("body");
  expect(text, "the printed report shows NaN").not.toMatch(/\bNaN\b/);
  expect(text, "the printed report shows undefined").not.toMatch(/\bundefined\b/);
  // And it must still be a useful document rather than a blank page: one
  // missing input should cost one card, not the whole report.
  expect(text.trim().length, "the report blanked itself instead").toBeGreaterThan(200);
  expect(text, "the take-home figure was lost with the card").toMatch(/take-home/i);
});

/**
 * A REPORT HAS NO CONTROLS — AND THE STYLESHEET ONLY HALF-DELIVERS THAT.
 *
 * globals.css hides `footer, nav, header, button, input, select, textarea` in
 * print, with a comment claiming it "catches every calculator's bespoke toggles
 * and range sliders without per-file work". Anchors are not in that list, so
 * every Link-based control printed as dead text on the paper.
 *
 * Three were reaching real PDFs, found by rendering them and reading the text
 * back rather than by inspecting classes:
 *
 *   /picture   "+ Add a goal"
 *   /picture   "See the full cash flow & liquidity map →"
 *   /plan      "Update my numbers to change the plan"
 *
 * The existing print suite could not have caught them: it measures section
 * geometry, column spans and NaN, and a dead control is correctly sized,
 * correctly placed and perfectly numeric.
 *
 * This asserts the PROPERTY rather than those three strings, so the next Link
 * added to a printable page fails here instead of in somebody's saved PDF. A
 * link wrapping CONTENT is fine — the goal rows are anchors and should print,
 * because their text is the report. What must not print is a control whose
 * whole purpose is to be clicked.
 */
const CONTROL_TEXT =
  /^(\+|see the|go to|open the|update my|start|take the|back to|add a|view |download|print|save )/i;

for (const route of ["/picture", "/plan", "/money-map"]) {
  test(`print: no navigation control reaches the paper on ${route}`, async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem(
        "jipange:profile",
        /* A COMPLETE profile. The first version seeded only salary/age/
         * dependants and /plan rendered 137 characters — the vacuity guard
         * below caught it rather than reporting a clean pass on an empty
         * page, which is the whole reason that guard is there. */
        JSON.stringify({
          fullName: "Test User",
          age: 35,
          county: "Nairobi",
          grossMonthlySalary: 150000,
          dependants: 2,
          chamaMember: true,
        })
      );
      localStorage.setItem(
        "jipange:calculations",
        JSON.stringify({
          netMonthly: 100000,
          budgetSplit: { needs: 50000, socialObligations: 15000, wants: 15000, savings: 20000 },
          savingsCapacity: 20000,
          savingsRate: 0.2,
        })
      );
      localStorage.setItem(
        "jipange:goals",
        JSON.stringify([
          {
            goalType: "home",
            emoji: "🏠",
            title: "Home deposit",
            requiredMonthly: 6000,
            years: 5,
            amountToday: 1000000,
            nominalTarget: 1300000,
            savedAt: "2026-08-07T00:00:00.000Z",
          },
        ])
      );
      localStorage.setItem(
        "jipange:journey",
        JSON.stringify({
          life_stage: "building",
          income_zone: "mid",
          // "grow_wealth" is NOT a PrimaryGoal — the funnel offers five values
        // and that is not one. It sat here since this fixture was written, and
        // it is what crashed /plan when this suite was extended to that route:
        // an unknown goal made DOMAIN_META[undefined].bg throw. The lookup is
        // total now (see JourneyActionPlan), and the fixture is a real value,
        // so these tests exercise the report rather than the fallback.
        primary_goal: "home_deposit",
          liquidity_leak: "active_savings",
          current_vehicle: ["mmf"],
        })
      );
    });
    await inPrint(page, route);

    /* Measured on COMPUTED VISIBILITY under print media, not on class names. A
     * class assertion would pass if the print stylesheet stopped defining
     * print:hidden at all, which is exactly how this regresses. */
    const printed = await page.evaluate(() =>
      Array.from(document.querySelectorAll("a"))
        .filter((a) => {
          const s = getComputedStyle(a);
          return s.display !== "none" && s.visibility !== "hidden" && a.offsetParent !== null;
        })
        .map((a) => (a.textContent || "").replace(/\s+/g, " ").trim())
        .filter(Boolean)
    );

    // The page must actually have rendered, or this passes vacuously.
    const body = await page.innerText("body");
    expect(body.trim().length, `${route} printed nothing`).toBeGreaterThan(200);

    const controls = printed.filter((t) => CONTROL_TEXT.test(t));
    expect(
      controls,
      `${route} prints navigation controls as dead text. The print stylesheet ` +
        `hides button/input/select but NOT anchors — add print:hidden to the Link.`
    ).toEqual([]);
  });
}

/**
 * TWO PAGINATION DEFECTS, BOTH DIAGNOSED BY MEASUREMENT AFTER GUESSES FAILED.
 *
 * The /money-map PDF printed with page 1 two-thirds empty and the colophon
 * struck THROUGH a card on page 2. Two separate causes:
 *
 *   1. The liquidity section computed `break-inside: avoid` — from
 *      `.rounded-2xl` and `.space-y-6 > *`, both right for the compact cards
 *      they were written for. At 704px against a 1123px page with the
 *      cash-flow card already taking ~440px, it fitted nowhere, so Chrome
 *      moved it whole.
 *
 *   2. `body` is `flex flex-col` for the sticky footer, which makes
 *      `body::after` a FLEX ITEM rather than a block in normal flow. It was
 *      laid out where the paginator then printed other content over it.
 *
 * Neither was found by reading the CSS. Putting break-inside on the inner
 * <ul> changed nothing, and neither did unsetting display:flex on the page
 * wrappers; both were reverted. Reading the COMPUTED style up the ancestor
 * chain named the section and the body directly.
 *
 * These assert the computed properties, so removing either rule fails here
 * rather than in somebody's saved PDF.
 */
test("print: the body is a block, so the colophon lands after the content", async ({ page }) => {
  await inPrint(page, "/money-map");
  const display = await page.evaluate(() => getComputedStyle(document.body).display);
  expect(
    display,
    "body is a flex container in print, so body::after is a flex item and the " +
      "colophon prints over the content instead of after it"
  ).toBe("block");
});

test("print: a card taller than the page is allowed to split", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.setItem(
      "jipange:calculations",
      JSON.stringify({
        netMonthly: 100000,
        budgetSplit: { needs: 50000, socialObligations: 15000, wants: 15000, savings: 20000 },
        savingsCapacity: 20000,
        savingsRate: 0.2,
      })
    );
    localStorage.setItem(
      "jipange:goals",
      JSON.stringify([
        {
          goalType: "home",
          emoji: "🏠",
          title: "Home deposit",
          requiredMonthly: 6000,
          years: 5,
          amountToday: 1000000,
          nominalTarget: 1300000,
          savedAt: "2026-08-07T00:00:00.000Z",
        },
      ])
    );
  });
  await inPrint(page, "/money-map");

  const measured = await page.evaluate(() => {
    const section = document.querySelector<HTMLElement>("section.print-flow");
    if (!section) return null;
    const item = section.querySelector<HTMLElement>(".print-keep");
    return {
      sectionBreak: getComputedStyle(section).breakInside,
      itemBreak: item ? getComputedStyle(item).breakInside : null,
      sectionHeight: Math.round(section.getBoundingClientRect().height),
    };
  });

  expect(measured, "no print-flow section on /money-map").not.toBeNull();
  // The premise: this really is a card that cannot fit beside its sibling.
  expect(
    measured!.sectionHeight,
    "the section is short enough to fit anyway — this test no longer proves anything"
  ).toBeGreaterThan(400);
  expect(measured!.sectionBreak, "the long card still refuses to split").toBe("auto");
  expect(
    measured!.itemBreak,
    "a horizon may now split across sheets, separating a yield from its vehicle"
  ).toBe("avoid");
});
