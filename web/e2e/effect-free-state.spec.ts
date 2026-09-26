import { test, expect } from "@playwright/test";
import { settled, visibleText } from "./helpers";

/**
 * Two pieces of state that used to be set from a useEffect and now are not.
 *
 * The lint rule that forbids that pattern is an error now, so these pin the
 * behaviour the rewrite had to keep: a strategy never outlives the numbers it
 * was built for, and a dismissed banner stays dismissed for the session.
 */

test("a planner strategy disappears when the numbers it was built for change", async ({ page }) => {
  await page.goto("/planners/emergency");
  await settled(page);
  const amount = page.getByRole("spinbutton").first();
  await amount.fill("40000");
  await expect(amount).toHaveValue("40000");

  await page.getByRole("button", { name: /get my strategy/i }).click();
  const retry = page.getByRole("button", { name: /try a different strategy/i });
  await expect(retry).toBeVisible();

  await page.getByRole("button", { name: "Save this goal to my plan" }).click();
  await expect(visibleText(page, /saved — see it on your pesa picture/i)).toBeVisible();

  await amount.fill("55000");
  await expect(retry).toBeHidden();
  await expect(page.getByRole("button", { name: /get my strategy/i })).toBeVisible();
  await expect(page.getByRole("button", { name: "Save this goal to my plan" })).toBeEnabled();
});

test("the continue banner stays dismissed for the rest of the session", async ({ page }) => {
  await page.goto("/tools");
  await settled(page);
  await page.evaluate(() => {
    localStorage.setItem("jipange_recent_tools", JSON.stringify(["/tools/take-home-pay"]));
    localStorage.setItem("jipange:tool:take-home-pay:gross", JSON.stringify("150000"));
  });

  await page.reload();
  await settled(page);
  const banner = visibleText(page, "Continue where you left off?");
  await expect(banner).toBeVisible();

  await page.getByRole("button", { name: /dismiss/i }).click();
  await expect(banner).toBeHidden();

  await page.reload();
  await settled(page);
  /* An absence cannot be awaited. The banner is a lazily loaded client
   * component, so "count is 0" straight after hydration can be true simply
   * because its chunk has not arrived yet — and it was: against code that
   * ignored the stored flag, this passed one run in two. The visible check
   * above shows the banner mounts well inside this window when it should. */
  await page.waitForTimeout(2500);
  await expect(page.getByText("Continue where you left off?")).toHaveCount(0);
});
