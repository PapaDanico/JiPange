import { test, expect } from "@playwright/test";

/**
 * The shared link opens the SENDER'S scenario, and the recipient can change it.
 *
 * Every calculator already shared its result to WhatsApp, with a bare link on
 * the end — so the recipient read the sender's answer and landed on an EMPTY
 * calculator, unable to ask the only question that matters to them ("what if
 * it were seven years?") without re-entering inputs they never saw.
 *
 * The unit tests cover the parsing. They cannot cover the thing that actually
 * has to work: that the value survives the trip through useStickyState and
 * into a controlled input, and then STAYS EDITABLE. That interaction is the
 * whole feature and it only exists in a browser.
 */

const TOOL = "/tools/savings-goal";

test("a shared link fills the recipient's calculator in", async ({ page }) => {
  await page.goto(`${TOOL}?target=750000&years=7&currentSavings=50000&annualReturn=9`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(700);

  await expect(page.locator("#target")).toHaveValue("750000");
  await expect(page.locator("#years")).toHaveValue("7");
  await expect(page.locator("#currentSavings")).toHaveValue("50000");
  await expect(page.locator("#annualReturn")).toHaveValue("9");

  // And it actually computed something from them, rather than just painting
  // the fields — a filled form with no answer is not the sender's scenario.
  const body = await page.innerText("body");
  expect(body).toMatch(/Ksh\s[\d,]+/);
});

/**
 * THE POINT OF SENDING IT. lib/hooks.ts warns that a continuously-mirrored
 * value "would fight the user's own edits by continuously re-reading", which
 * is why the seed is a one-time mount effect. If that ever became a derived
 * value, the recipient would type and watch the sender's number reappear.
 */
test("the recipient can change a seeded number and it stays changed", async ({ page }) => {
  await page.goto(`${TOOL}?target=750000&years=7`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(700);
  await expect(page.locator("#years")).toHaveValue("7");

  await page.locator("#years").fill("12");
  await page.waitForTimeout(600);
  await expect(page.locator("#years"), "the seeded value fought the edit").toHaveValue("12");

  // And it persists, so the scenario survives a reload once the query is gone.
  await page.goto(TOOL);
  await page.waitForTimeout(600);
  await expect(page.locator("#years")).toHaveValue("12");
});

/**
 * A link is trivially editable by anyone who receives it, so the params are
 * hostile input. `Number("1e400")` is Infinity — truthy, greater than zero,
 * and exactly what the guards replaced across this codebase let through.
 */
test("a tampered link cannot put junk into the engine", async ({ page }) => {
  await page.goto(`${TOOL}?target=1e400&years=-5&currentSavings=abc&annualReturn=9`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(700);

  const body = await page.innerText("body");
  expect(body, "the tampered link took the page down").not.toContain("Something went wrong");
  expect(body).not.toMatch(/\bNaN\b/);
  expect(body).not.toMatch(/\bInfinity\b/);

  // The junk was dropped; the one good field still came through.
  await expect(page.locator("#target")).toHaveValue("");
  await expect(page.locator("#years")).toHaveValue("");
  await expect(page.locator("#annualReturn")).toHaveValue("9");
});

test("an ordinary visit is untouched by any of this", async ({ page }) => {
  await page.goto(TOOL);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(600);
  await expect(page.locator("#target")).toHaveValue("");
  await expect(page.locator("#annualReturn")).toHaveValue("10"); // its own default
});
