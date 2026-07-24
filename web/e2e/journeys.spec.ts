import { test, expect } from "@playwright/test";
import { completeJourneyQuiz, saveEmergencyGoal, visibleText } from "./helpers";

/**
 * Smoke tests for the money paths — the flows where a real user's data is
 * created, displayed, saved, exported, erased, and restored. These are the
 * journeys that must never silently break: the 90-second onboarding check,
 * committing a goal from a planner, and the backup round-trip that makes
 * "your data is yours" literal.
 */

// ─── Onboarding: 90-second check → dashboard → Pesa Picture ──────────────

test("onboarding quiz reaches the dashboard and powers the Pesa Picture", async ({ page }) => {
  await completeJourneyQuiz(page);

  // The dashboard leads with the computed priority-1 headline.
  await expect(visibleText(page, /priority 1/i)).toBeVisible();

  // The same stored answers power the /picture diagnostic. (The persona
  // module always renders; other diagnostic cards depend on the answers.)
  await page.goto("/picture");
  await expect(visibleText(page, "Your Pesa Engine persona")).toBeVisible();
});

// ─── Planner: commit a goal → it appears on the Pesa Picture ─────────────

test("saving a planner goal surfaces it under My goals on /picture", async ({ page }) => {
  await saveEmergencyGoal(page);

  await page.goto("/picture");
  await expect(page.getByRole("heading", { name: "My goals" })).toBeVisible();
  // exact (case-sensitive): the footer's lowercase "Emergency fund" planner
  // link must not satisfy this — only the saved goal card may.
  await expect(page.getByText("Emergency Fund", { exact: true })).toBeVisible();
});

// ─── Backup: export → erase → restore, entirely on-device ────────────────

test("backup round-trip: download, delete everything, restore from file", async ({ page }) => {
  // Create real data through the UI: commit an emergency-fund goal.
  await saveEmergencyGoal(page);

  // Export from the data controls on /picture.
  await page.goto("/picture");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download my data" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^jipange-backup-\d{4}-\d{2}-\d{2}\.json$/);
  const backupPath = await download.path();

  // Erase everything — the delete button is two-tap by design.
  await page.getByRole("button", { name: "Delete everything" }).click();
  await page.getByRole("button", { name: "Tap again to erase everything" }).click();
  await expect(visibleText(page, /deleted \d+ item/i)).toBeVisible();
  // The saved-goal card must be gone (exact match dodges the lowercase
  // footer link; the heading disappearing proves the goals card unmounted).
  await expect(page.getByText("Emergency Fund", { exact: true })).not.toBeVisible();
  await expect(page.getByRole("heading", { name: "My goals" })).not.toBeVisible();

  // Restore from the downloaded file — the goal comes back without a reload.
  await page
    .getByLabel("Choose a JiPange backup file to restore")
    .setInputFiles(backupPath);
  await expect(page.getByText("Emergency Fund", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "My goals" })).toBeVisible();
});
