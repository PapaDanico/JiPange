import { test, expect } from "@playwright/test";
test("break-even appears and responds to what you save", async ({ page }) => {
  await page.goto("/tools/fire-number");
  const n = page.getByRole("spinbutton");
  await n.nth(0).fill("80000");
  await n.nth(1).fill("8000");
  // No capital/savings yet: the panel must stay away.
  await expect(page.getByText(/What has to be true/i)).toHaveCount(0);
  await n.nth(2).fill("500000");
  await n.nth(3).fill("20000");
  await expect(page.getByText(/What has to be true/i)).toBeVisible();
  const modest = await page.getByText(/faster than prices rise|without needing any growth|No realistic investment return/i).first().textContent();
  await n.nth(3).fill("200000");
  await expect(page.getByText(/What has to be true/i)).toBeVisible();
  const generous = await page.getByText(/faster than prices rise|without needing any growth|No realistic investment return/i).first().textContent();
  expect(generous, "saving 10x more changed nothing").not.toBe(modest);
});
