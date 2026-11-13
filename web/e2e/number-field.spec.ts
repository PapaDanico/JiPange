import { test, expect } from "@playwright/test";

/** Common numeric fields must reject absurd values and never reverse a pasted sign. */
test.describe("calculator numeric input safety", () => {
  test("a finite 1e308 warns rather than silently accepting it", async ({ page }) => {
    await page.goto("/tools/savings-goal");
    const field = page.getByLabel("Savings target (Ksh)");
    await field.fill("1e308");
    await field.blur();
    await expect(field).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByText(/That looks too high/)).toBeVisible();
  });

  test("pasting a negative amount never changes it into a positive amount", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/tools/savings-goal");
    const field = page.getByLabel("Savings target (Ksh)");
    await field.fill("");
    await page.evaluate(async () => navigator.clipboard.writeText("-5000"));
    await field.focus();
    await page.keyboard.press("ControlOrMeta+V");
    await expect(field).toHaveValue("-5000");
    await field.blur();
    await expect(field).toHaveAttribute("aria-invalid", "true");
  });
});
