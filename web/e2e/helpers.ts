import { expect, type Locator, type Page } from "@playwright/test";

/**
 * Shared helpers for the e2e suite.
 *
 * visibleText exists because every tool/report page keeps a hidden print
 * letterhead in the DOM that repeats the page title (`hidden print:block`
 * in PrintLetterhead) — a bare getByText(...).first() can resolve to that
 * hidden node whenever a pattern overlaps the title. Routing all text
 * assertions through this helper removes the trap instead of asking each
 * author to reason about letterhead overlap per assertion.
 */
export function visibleText(page: Page, pattern: string | RegExp): Locator {
  return page.getByText(pattern).filter({ visible: true }).first();
}

/** Answers the 5-question journey wizard by tapping the first option of each
 *  question (Q4 is multi-select and needs an explicit Continue). */
export async function completeJourneyQuiz(page: Page) {
  await page.goto("/profile");
  const option = page.locator("button[aria-pressed]").first();
  // Q1–Q3: single-select questions auto-advance on tap.
  for (let i = 0; i < 3; i++) {
    await expect(visibleText(page, `Question ${i + 1} of 5`)).toBeVisible();
    await option.click();
  }
  // Q4: multi-select — pick one, then confirm.
  await expect(visibleText(page, "Question 4 of 5")).toBeVisible();
  await option.click();
  await page.getByRole("button", { name: /continue/i }).click();
  // Q5: final single-select finishes and routes to the dashboard.
  await expect(visibleText(page, "Question 5 of 5")).toBeVisible();
  await option.click();
  await page.waitForURL("**/dashboard");
}

/** Commits an emergency-fund goal through the planner UI — the shared
 *  "create real data" step for the goal and backup journeys. */
export async function saveEmergencyGoal(page: Page) {
  await page.goto("/planners/emergency");
  await page.getByRole("spinbutton").first().fill("40000");
  await page.getByRole("button", { name: "Save this goal to my plan" }).click();
  await expect(visibleText(page, /saved — see it on your pesa picture/i)).toBeVisible();
}
