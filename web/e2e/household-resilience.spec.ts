import { test, expect } from "@playwright/test";

test("household resilience shows income shock and scheduled fee shortfall", async ({ page }) => {
  await page.goto("/tools/household-resilience");
  await page.getByLabel("Accessible liquid savings (Ksh)").fill("420000");
  await page.getByLabel("Monthly take-home income (Ksh)").fill("200000");
  await page.getByLabel("Monthly essential spending, excluding loan payments (Ksh)").fill("140000");
  await page.getByLabel("Monthly debt repayments (Ksh)").fill("20000");
  await page.getByLabel("Income reduction to simulate").fill("30");
  await page.getByLabel("One upcoming school-fee or other bill (Ksh)").fill("350000");
  await page.getByLabel("Month the upcoming bill falls due (1–12)").fill("1");
  await expect(page.getByText("Your 12-month cash-flow stress test")).toBeVisible();
  await expect(page.getByText("2.63 months")).toBeVisible();
  await expect(page.getByText("Month 4")).toBeVisible();
  await expect(page.getByRole("button", { name: "Download PDF" })).toBeVisible();
});

test("invalid shock hides projections", async ({ page }) => {
  await page.goto("/tools/household-resilience");
  await page.getByLabel("Accessible liquid savings (Ksh)").fill("100000");
  await page.getByLabel("Monthly take-home income (Ksh)").fill("50000");
  await page.getByLabel("Monthly essential spending, excluding loan payments (Ksh)").fill("30000");
  await expect(page.getByText("Your 12-month cash-flow stress test")).toBeVisible();
  await page.getByLabel("Income reduction to simulate").fill("150");
  await expect(page.getByText("Your 12-month cash-flow stress test")).toHaveCount(0);
});
