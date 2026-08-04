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
        primary_goal: "grow_wealth",
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
