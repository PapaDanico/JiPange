import { test, expect } from "@playwright/test";

/**
 * A BUTTON ALONE ON ITS LINE MUST FILL THE LINE.
 *
 * The homepage hero's two calls to action were given `w-full sm:w-auto`: full
 * width on a phone, intrinsic width "once they sit in a row". The stacked
 * phone case was the reported defect and it was fixed, and no test was
 * written, because the rule looked like it only had one interesting viewport.
 *
 * It had two. At lg the hero splits into two columns and the left one narrows
 * to ~450px, while the buttons at their intrinsic widths need 266 + 188 + 12 =
 * 466px. `sm:flex-wrap` did what it was asked and wrapped them — back into a
 * stack, 266px above 188px, ragged, at the single most common desktop width.
 * The fix had been applied one breakpoint short of the whole problem.
 *
 * This asserts the rule rather than the breakpoint: whatever the viewport,
 * two CTAs that end up on separate lines must be the same width. That holds
 * the phone case AND the desktop case, and it keeps holding if the copy in
 * either button changes length and shifts where the wrap happens.
 */
const VIEWPORTS = [
  { name: "phone", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
];

for (const vp of VIEWPORTS) {
  test(`hero CTAs are never ragged when stacked (${vp.name})`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto("/");

    const primary = page.getByRole("link", { name: /Start my plan — 90 seconds/ });
    const secondary = page.getByRole("link", { name: /^Explore calculators$/ });
    await expect(primary).toBeVisible();
    await expect(secondary).toBeVisible();

    const a = (await primary.boundingBox())!;
    const b = (await secondary.boundingBox())!;

    // Separate lines, or the same one? Decided by geometry, not by breakpoint.
    const stacked = b.y >= a.y + a.height - 2 || a.y >= b.y + b.height - 2;

    if (stacked) {
      expect(
        Math.abs(a.width - b.width),
        `stacked CTAs differ by ${Math.round(Math.abs(a.width - b.width))}px at ${vp.width}px`,
      ).toBeLessThanOrEqual(1);
    } else {
      // Side by side: intrinsic widths are correct, but they must share a row.
      expect(Math.abs(a.y - b.y)).toBeLessThanOrEqual(2);
    }
  });
}
