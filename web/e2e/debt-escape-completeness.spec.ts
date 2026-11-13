import { test, expect } from "@playwright/test";

test("an invalid entered loan cannot silently disappear from debt payoff", async ({ page }) => {
  await page.goto("/tools/debt-escape");
  const balance = page.getByLabel("Outstanding balance (Ksh)").first();
  await balance.fill("5000");
  await page.getByLabel("Monthly amount you can put toward debt repayment (Ksh)").fill("10000");
  await expect(page.getByText("Debt-free by")).toBeVisible();

  await page.getByLabel("Monthly rate (%)").first().fill("-2");
  await expect(page.getByRole("alert").filter({ hasText: "Check every entered loan" })).toBeVisible();
  await expect(page.getByText("Debt-free by")).toHaveCount(0);
});

test("negative settlement fees cannot be silently discarded", async ({ page }) => {
  await page.goto("/tools/debt-escape");
  await page.getByLabel("Outstanding balance (Ksh)").first().fill("5000");
  await page.getByLabel("Monthly amount you can put toward debt repayment (Ksh)").fill("10000");
  await page.getByLabel(/Fee to close this loan early/).first().fill("-500");
  await expect(page.getByRole("alert").filter({ hasText: "Check every entered loan" })).toBeVisible();
  await expect(page.getByText("Debt-free by")).toHaveCount(0);
});
