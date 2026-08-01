import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * The caveat only appears once the feed carries the core / non-core split, so
 * this test is meaningless against a snapshot that predates it. It skips
 * rather than passing quietly — a green test that asserted nothing would be
 * indistinguishable from a working feature, which is the failure this suite
 * keeps finding.
 */
test("retirement plan warns whose inflation the headline is", async ({ page }) => {
  const snap = JSON.parse(
    readFileSync(path.join(process.cwd(), "lib/rates-snapshot.json"), "utf8")
  ) as { macro: { inflationCore?: unknown } };
  test.skip(
    !snap.macro.inflationCore,
    "snapshot predates the inflation split — nothing to assert yet"
  );

  await page.goto("/tools/fire-number");
  const n = page.getByRole("spinbutton");
  await n.nth(0).fill("80000");
  await n.nth(1).fill("8000");
  await n.nth(2).fill("500000");
  await n.nth(3).fill("20000");

  await expect(page.getByText(/What has to be true/i)).toBeVisible();
  await expect(page.getByText(/food and energy rose/i)).toBeVisible();
  await expect(page.getByText(/one for one/i)).toBeVisible();
});
