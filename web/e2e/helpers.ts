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

/**
 * WAIT FOR HYDRATION, NOT JUST FOR LOAD.
 *
 * The sweeps briefly used `load` plus document.fonts.ready, on the argument
 * that what they measure is font metrics rather than network silence. That was
 * right about fonts and wrong about React: `networkidle` had been incidentally
 * waiting for hydration, and dropping it dropped the client-rendered half of
 * every page.
 *
 * Measured in the sister project, whose sweep had the identical wait:
 * /ladder/ has 272 elements at load and 864 once hydrated. Two-thirds of the
 * page was never scanned, and the contrast guard sailed straight past the
 * 3.77:1 button it had been written to catch — while passing clean, finding
 * other real defects, and turning CI red, so every signal except a mutation
 * test said it was healthy.
 *
 * Polling until the element count holds steady is deterministic where a fixed
 * sleep is a guess, and costs a few hundred milliseconds rather than however
 * long the network happens to take.
 *
 * This lives in helpers so both sweeps share one definition. The two repos
 * having drifted copies of the same rule is exactly how one of them ended up
 * silently blind.
 */
export async function settled(page: Page): Promise<void> {
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  let last = -1;
  for (let i = 0; i < 40; i++) {
    const n = await page.evaluate(() => document.querySelectorAll("*").length);
    if (n === last) return;
    last = n;
    await page.waitForTimeout(120);
  }
}

/**
 * Every route the sweeps walk.
 *
 * This list was copy-pasted in two specs before a third needed it. They were
 * byte-identical at the time, which is the state a drifted pair starts from —
 * and `settled` above is in this file precisely because two copies of one rule
 * drifting is how a guard went silently blind once already.
 *
 * A route missing from a copy is not a test failure; it is a route nobody
 * checks, reported as green.
 */
export const ROUTES = [
  "/",
  "/about",
  "/dashboard",
  "/faq",
  "/glossary",
  "/licensing",
  "/money-map",
  "/partners",
  "/picture",
  "/plan",
  "/planners",
  "/planners/education",
  "/planners/hustle",
  "/privacy",
  "/profile",
  "/support",
  "/terms",
  "/tools",
  "/tools/20th-challenge",
  "/tools/budget-split",
  "/tools/chama",
  "/tools/debt-escape",
  "/tools/dhowcsd",
  "/tools/fire-number",
  "/tools/fuliza-cost",
  "/tools/guarantor-shield",
  "/tools/hustle-smoother",
  "/tools/inflation-reality",
  "/tools/investment-returns",
  "/tools/kplc-optimizer",
  "/tools/land-purchase",
  "/tools/loan-repayment",
  "/tools/money-runway",
  "/tools/one-third-rule",
  "/tools/payday-router",
  "/tools/sacco-vs-bank",
  "/tools/salary",
  "/tools/salary-negotiation",
  "/tools/savings-goal",
  "/tools/school-fees-lifetime",
  "/tools/sha-health",
  "/tools/take-home-pay",
  "/tools/tax-shield",
  "/tools/where-to-save",
] as const;
