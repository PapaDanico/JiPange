import { test, expect } from "@playwright/test";

test("loan repayment does not silently treat an invalid rate as zero interest", async ({ page }) => {
  await page.goto("/tools/loan-repayment");
  await page.getByLabel("Loan amount / HELB balance (Ksh)").fill("500000");
  await page.getByLabel("Repayment period (years)").fill("3");
  const rate = page.getByLabel("Annual interest rate");
  await rate.fill("12");
  await expect(page.getByText("Monthly instalment", { exact: true })).toBeVisible();
  await rate.fill("10001");
  await expect(page.getByText("Monthly instalment", { exact: true })).toHaveCount(0);
  await rate.fill("-1");
  await expect(page.getByText("Monthly instalment", { exact: true })).toHaveCount(0);
  await rate.fill("0");
  await expect(page.getByText("Monthly instalment", { exact: true })).toBeVisible();
});
