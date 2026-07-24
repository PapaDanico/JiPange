import { test, expect, type Page } from "@playwright/test";

/**
 * Smoke tests for the money paths — the flows where a real user's data is
 * created, displayed, saved, exported, erased, and restored. These are the
 * journeys that must never silently break: the 90-second onboarding check,
 * committing a goal from a planner, and the backup round-trip that makes
 * "your data is yours" literal.
 */

/** Answers the 5-question journey wizard by tapping the first option of each
 *  question (Q4 is multi-select and needs an explicit Continue). */
async function completeJourneyQuiz(page: Page) {
  await page.goto("/profile");
  const option = page.locator("button[aria-pressed]").first();
  // Q1–Q3: single-select questions auto-advance on tap.
  for (let i = 0; i < 3; i++) {
    await expect(page.getByText(`Question ${i + 1} of 5`)).toBeVisible();
    await option.click();
  }
  // Q4: multi-select — pick one, then confirm.
  await expect(page.getByText("Question 4 of 5")).toBeVisible();
  await option.click();
  await page.getByRole("button", { name: /continue/i }).click();
  // Q5: final single-select finishes and routes to the dashboard.
  await expect(page.getByText("Question 5 of 5")).toBeVisible();
  await option.click();
  await page.waitForURL("**/dashboard");
}

// ─── Onboarding: 90-second check → dashboard → Pesa Picture ──────────────

test("onboarding quiz reaches the dashboard and powers the Pesa Picture", async ({ page }) => {
  await completeJourneyQuiz(page);

  // The dashboard leads with the computed priority-1 headline.
  await expect(page.getByText(/priority 1/i).first()).toBeVisible();

  // The same stored answers power the /picture diagnostic. (The persona
  // module always renders; other diagnostic cards depend on the answers.)
  await page.goto("/picture");
  await expect(page.getByText("Your Pesa Engine persona")).toBeVisible();
});

// ─── Planner: commit a goal → it appears on the Pesa Picture ─────────────

test("saving a planner goal surfaces it under My goals on /picture", async ({ page }) => {
  await page.goto("/planners/emergency");
  await page.getByRole("spinbutton").first().fill("40000");
  await page.getByRole("button", { name: "Save this goal to my plan" }).click();
  await expect(page.getByText(/saved — see it on your pesa picture/i)).toBeVisible();

  await page.goto("/picture");
  await expect(page.getByRole("heading", { name: "My goals" })).toBeVisible();
  // exact: the footer links a lowercase "Emergency fund" planner entry.
  await expect(page.getByText("Emergency Fund", { exact: true })).toBeVisible();
});

// ─── Backup: export → erase → restore, entirely on-device ────────────────

test("backup round-trip: download, delete everything, restore from file", async ({ page }) => {
  // Create real data through the UI: commit an emergency-fund goal.
  await page.goto("/planners/emergency");
  await page.getByRole("spinbutton").first().fill("40000");
  await page.getByRole("button", { name: "Save this goal to my plan" }).click();
  await expect(page.getByText(/saved — see it on your pesa picture/i)).toBeVisible();

  // Export from the data controls on /picture.
  await page.goto("/picture");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download my data" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^jipange-backup-\d{4}-\d{2}-\d{2}\.json$/);
  const backupPath = await download.path();

  // Erase everything — the delete button is two-tap by design.
  const deleteButton = page.getByRole("button", { name: "Delete everything" });
  await deleteButton.click();
  await page.getByRole("button", { name: "Tap again to erase everything" }).click();
  await expect(page.getByText(/deleted \d+ item/i)).toBeVisible();
  await expect(page.getByText("Emergency Fund", { exact: true })).not.toBeVisible();

  // Restore from the downloaded file — the goal comes back without a reload.
  await page
    .getByLabel("Choose a JiPange backup file to restore")
    .setInputFiles(backupPath);
  await expect(page.getByText("Emergency Fund", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "My goals" })).toBeVisible();
});
