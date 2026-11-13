import { test, expect } from "@playwright/test";

test("school-fee planning rejects invalid existing savings", async ({ page }) => {
  await page.goto("/tools/school-fees-lifetime");
  const fee = page.getByPlaceholder("Your school's annual fee, e.g. 333500");
  await fee.fill("150000");
  const savings = page.getByLabel("Already saved toward school fees (Ksh)");
  await savings.fill("-1000");
  await expect(page.getByText(/Total fees to the end of school/)).toHaveCount(0);
  await savings.fill("0");
  await expect(page.getByText(/Total fees to the end of school/)).toBeVisible();
});

test("school-fee planning rejects invalid university costs", async ({ page }) => {
  await page.goto("/tools/school-fees-lifetime");
  await page.getByPlaceholder("Your school's annual fee, e.g. 333500").fill("150000");
  await page.getByLabel("Add four years of university after Grade 12").check();
  const university = page.getByLabel("University cost per year, at today's prices");
  await university.fill("-5000");
  await expect(page.getByText(/Total fees to the end of school/)).toHaveCount(0);
});
