import { expect, test } from "@playwright/test";

/* Njia's course cards link here with a sourced tuition figure. The planner
 * must open with it filled in and say where it came from; a bad figure must
 * fill nothing. */
test("a fee from Njia fills the Education Planner and is labelled", async ({ page }) => {
  await page.goto("/planners/education?amount=160200&years=1&from=njia");
  await expect(page.locator("#child-0-amount")).toHaveValue(/160,?200/);
  await expect(page.locator("#child-0-years")).toHaveValue("1");
  await expect(page.getByText(/carried over from/i)).toBeVisible();
  await expect(page.getByText(/check it against the institution/i)).toBeVisible();
});

test("a malformed fee fills nothing and claims no source", async ({ page }) => {
  await page.goto("/planners/education?amount=abc&from=njia");
  await expect(page.locator("#child-0-amount")).toHaveValue("");
  await expect(page.getByText(/carried over from/i)).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Njia" })).toBeVisible();
});
