import { test, expect } from "@playwright/test";

test("savings goal does not calculate on an impossible horizon", async ({ page }) => {
  await page.goto("/tools/savings-goal");
  await page.getByLabel("Savings target (Ksh)").fill("500000");
  await page.getByLabel("Time to reach it (years)").fill("3");
  await expect(page.getByText("Monthly savings needed")).toBeVisible();
  await page.getByLabel("Time to reach it (years)").fill("1000000000000");
  await expect(page.getByText("Monthly savings needed")).toHaveCount(0);
});

test("savings goal rejects invalid return and existing savings rather than computing with defaults", async ({ page }) => {
  await page.goto("/tools/savings-goal");
  await page.getByLabel("Savings target (Ksh)").fill("500000");
  await page.getByLabel("Time to reach it (years)").fill("3");
  await expect(page.getByText("Monthly savings needed")).toBeVisible();
  await page.getByLabel("Expected annual return").fill("200");
  await expect(page.getByText("Monthly savings needed")).toHaveCount(0);
  await page.getByLabel("Expected annual return").fill("10");
  await page.getByLabel("Current savings (Ksh)").fill("-1000");
  await expect(page.getByText("Monthly savings needed")).toHaveCount(0);
});
