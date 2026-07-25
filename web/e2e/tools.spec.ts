import { test, expect } from "@playwright/test";
import { visibleText } from "./helpers";

// Text assertions go through visibleText (see helpers.ts) so the hidden
// print letterhead can never satisfy them, and each "shows output" test
// asserts a string that only exists in the computed results — never one the
// page's static heading or intro copy could match.

// ─── Tools index ───────────────────────────────────────────────────────────

test("tools index loads and lists calculators", async ({ page }) => {
  await page.goto("/tools");
  await expect(page.getByRole("heading", { name: /free financial calculators/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Plan for today" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Plan for the future" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Pesa realities" })).toBeVisible();
  await expect(page.getByRole("link", { name: /take-home pay/i }).first()).toBeVisible();
});

// ─── Take-Home Pay ─────────────────────────────────────────────────────────

test("take-home pay: shows net salary for valid input", async ({ page }) => {
  await page.goto("/tools/take-home-pay");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(visibleText(page, /80%\+/)).toBeVisible();
  await page.getByRole("spinbutton").first().fill("150000");
  // Ledger rows only exist once the breakdown computed.
  await expect(visibleText(page, "Less: NSSF Tier 1")).toBeVisible();
  await expect(visibleText(page, "PAYE (before relief)")).toBeVisible();
});

// ─── Savings Goal ──────────────────────────────────────────────────────────

test("savings goal: calculates required monthly deposit", async ({ page }) => {
  await page.goto("/tools/savings-goal");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const inputs = page.getByRole("spinbutton");
  await inputs.nth(0).fill("500000");
  await inputs.nth(1).fill("24");
  await inputs.nth(2).fill("10");
  await expect(visibleText(page, "Monthly savings needed")).toBeVisible();
});

// ─── Loan Repayment ────────────────────────────────────────────────────────

test("loan repayment: shows monthly instalment", async ({ page }) => {
  await page.goto("/tools/loan-repayment");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const inputs = page.getByRole("spinbutton");
  await inputs.nth(0).fill("200000");
  await inputs.nth(1).fill("12");
  await inputs.nth(2).fill("24");
  await expect(visibleText(page, "Monthly installment")).toBeVisible();
});

// ─── Investment Returns ────────────────────────────────────────────────────

test("investment returns: renders projection", async ({ page }) => {
  await page.goto("/tools/investment-returns");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const inputs = page.getByRole("spinbutton");
  await inputs.nth(0).fill("100000");
  await inputs.nth(1).fill("5000");
  await inputs.nth(2).fill("10");
  await inputs.nth(3).fill("10");
  await expect(visibleText(page, "Projected future value")).toBeVisible();
});

// ─── FIRE Number ───────────────────────────────────────────────────────────

test("fire number: shows retirement number", async ({ page }) => {
  await page.goto("/tools/fire-number");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.getByRole("spinbutton").first().fill("80000");
  await expect(visibleText(page, /your fire number at age/i)).toBeVisible();
});

// ─── Money Runway ──────────────────────────────────────────────────────────

test("money runway: shows months of runway", async ({ page }) => {
  await page.goto("/tools/money-runway");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const inputs = page.getByRole("spinbutton");
  await inputs.nth(0).fill("1000000");
  await inputs.nth(1).fill("50000");
  await expect(visibleText(page, "Your money will last")).toBeVisible();
});

// ─── Budget Split ──────────────────────────────────────────────────────────

test("budget split: renders split amounts", async ({ page }) => {
  await page.goto("/tools/budget-split");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.getByRole("spinbutton").first().fill("120000");
  await expect(visibleText(page, "Household expenses (50%)")).toBeVisible();
});

// ─── Tax Shield ────────────────────────────────────────────────────────────

test("tax shield: shows relief amounts", async ({ page }) => {
  await page.goto("/tools/tax-shield");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.getByRole("spinbutton").first().fill("200000");
  await expect(page.getByTestId("tax-leak")).toBeVisible();
  await expect(visibleText(page, /paye recoverable/i)).toBeVisible();
});

// ─── Salary Negotiation ───────────────────────────────────────────────────

test("salary negotiation: reverse-engineers gross", async ({ page }) => {
  await page.goto("/tools/salary-negotiation");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.getByRole("spinbutton").first().fill("100000");
  await expect(visibleText(page, "Negotiate for a gross salary of")).toBeVisible();
});

// ─── Payday Router ─────────────────────────────────────────────────────────

test("payday router: shows weekly limit", async ({ page }) => {
  await page.goto("/tools/payday-router");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const inputs = page.getByRole("spinbutton");
  await inputs.nth(0).fill("120000");
  await inputs.nth(1).fill("30000");
  await expect(page.getByTestId("weekly-limit")).toBeVisible();
});

// ─── Fuliza Cost ───────────────────────────────────────────────────────────

test("fuliza cost: shows true cost", async ({ page }) => {
  await page.goto("/tools/fuliza-cost");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const inputs = page.getByRole("spinbutton");
  await inputs.nth(0).fill("5000");
  await inputs.nth(1).fill("14");
  await expect(visibleText(page, "Total cost of borrowing")).toBeVisible();
});

// ─── KPLC Optimizer ────────────────────────────────────────────────────────

test("kplc optimizer: shows kWh savings", async ({ page }) => {
  await page.goto("/tools/kplc-optimizer");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.getByRole("spinbutton").first().fill("3000");
  await expect(page.getByTestId("kplc-extra")).toContainText("kWh");
});

// ─── SACCO vs Bank ────────────────────────────────────────────────────────

test("sacco vs bank: shows comparison", async ({ page }) => {
  await page.goto("/tools/sacco-vs-bank");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const inputs = page.getByRole("spinbutton");
  await inputs.nth(0).fill("500000");
  await inputs.nth(1).fill("12");
  // Per-product comparison rows only exist once results computed.
  await expect(visibleText(page, "Total repaid:")).toBeVisible();
  await expect(visibleText(page, /% APR/)).toBeVisible();
});

// ─── Guarantor Shield ─────────────────────────────────────────────────────

test("guarantor shield: shows frozen borrowing power", async ({ page }) => {
  await page.goto("/tools/guarantor-shield");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const inputs = page.getByRole("spinbutton");
  await inputs.nth(0).fill("500000");
  await inputs.nth(1).fill("200000");
  await expect(visibleText(page, "Frozen borrowing capacity")).toBeVisible();
});

// ─── 1/3 Rule Checker ────────────────────────────────────────────────────

test("one-third rule: shows deduction analysis", async ({ page }) => {
  await page.goto("/tools/one-third-rule");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const inputs = page.getByRole("spinbutton");
  await inputs.nth(0).fill("120000");
  await inputs.nth(1).fill("50000");
  await expect(
    visibleText(page, /deductions are within the legal limit|deductions may exceed the legal limit/i)
  ).toBeVisible();
});

// ─── Inflation Reality ───────────────────────────────────────────────────

test("inflation reality: shows real value erosion", async ({ page }) => {
  await page.goto("/tools/inflation-reality");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const inputs = page.getByRole("spinbutton");
  await inputs.nth(0).fill("100000");
  await inputs.nth(1).fill("5");
  await expect(visibleText(page, "Your salary will feel like")).toBeVisible();
});

// ─── DhowCSD T-Bill Ladder ────────────────────────────────────────────────

test("dhowcsd: shows t-bill ladder allocation", async ({ page }) => {
  await page.goto("/tools/dhowcsd");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.getByRole("spinbutton").first().fill("1000000");
  await expect(visibleText(page, /blended ladder yield/i)).toBeVisible();
});

// ─── Education Savings ────────────────────────────────────────────────────

test("education savings: shows monthly target", async ({ page }) => {
  await page.goto("/tools/education-savings");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.getByRole("spinbutton").first().fill("30000");
  await expect(visibleText(page, /monthly savings for|combined monthly savings/i)).toBeVisible();
});

// ─── Hustle Smoother ──────────────────────────────────────────────────────

test("hustle smoother: shows smoothed salary for variable income", async ({ page }) => {
  await page.goto("/tools/hustle-smoother");
  await page.fill("#income-0", "40000");
  await page.fill("#income-1", "25000");
  await page.fill("#income-2", "55000");
  await page.fill("#income-3", "30000");
  await page.fill("#income-4", "60000");
  await page.fill("#income-5", "20000");
  await expect(visibleText(page, "Your smoothed monthly salary")).toBeVisible();
});

// ─── 20th challenge ───────────────────────────────────────────────────────

test("20th challenge: setup screen loads and accepts a commitment", async ({ page }) => {
  await page.goto("/tools/20th-challenge");
  await expect(visibleText(page, /monthly savings commitment/i)).toBeVisible();
  await page.fill("#commitment", "5000");
  await expect(visibleText(page, /start the challenge/i)).toBeVisible();
});

// ─── Affiliate links / product links ─────────────────────────────────────

test("affiliate links: savings goal shows MMF product cards", async ({ page }) => {
  await page.goto("/tools/savings-goal");
  const inputs = page.getByRole("spinbutton");
  await inputs.nth(0).fill("500000");
  await inputs.nth(1).fill("24");
  await inputs.nth(2).fill("10");
  await expect(visibleText(page, /top mmfs for this goal/i)).toBeVisible();
  await expect(visibleText(page, /CIC MMF|Britam MMF/i)).toBeVisible();
});

test("affiliate links: /go/cic-mmf redirects externally", async ({ page }) => {
  const response = await page.request.get("/go/cic-mmf", { maxRedirects: 0 });
  expect([301, 302, 307, 308]).toContain(response.status());
});

test("affiliate links: /go/unknown-slug redirects to /tools", async ({ page }) => {
  await page.goto("/go/this-slug-does-not-exist");
  await expect(page).toHaveURL("/tools");
});

// ─── ToolEnhancements: related chips ────────────────────────────────────

test("tool enhancements: shows Try next section with chips", async ({ page }) => {
  await page.goto("/tools/take-home-pay");
  await expect(visibleText(page, /try next/i)).toBeVisible();
  await expect(page.getByRole("link", { name: "Salary & Pay Hub", exact: true }).first()).toBeVisible();
});

test("tool enhancements: share button is present", async ({ page }) => {
  await page.goto("/tools/savings-goal");
  await expect(page.getByRole("button", { name: /share/i })).toBeVisible();
});

// ─── RecentToolsBar: localStorage-driven ─────────────────────────────────

test("recent tools bar: appears after visiting a tool", async ({ page }) => {
  await page.goto("/tools");
  await page.evaluate(() => {
    localStorage.setItem(
      "jipange_recent_tools",
      JSON.stringify(["/tools/take-home-pay", "/tools/savings-goal"])
    );
  });
  await page.reload();
  await expect(visibleText(page, /recently used/i)).toBeVisible();
  await expect(page.getByRole("link", { name: "Take-Home Pay", exact: true })).toBeVisible();
});

// ─── ToolInsights: both cards rendered ────────────────────────────────────

test("tool insights: loan repayment caution card is visible", async ({ page }) => {
  await page.goto("/tools/loan-repayment");
  await expect(visibleText(page, /KSh 1,500/)).toBeVisible();
});

// ─── Navigation ───────────────────────────────────────────────────────────

test("header: logo links back to home", async ({ page }) => {
  await page.goto("/tools/fire-number");
  await page.getByRole("link", { name: /jipange home/i }).click();
  await expect(page).toHaveURL("/");
});

test("header: calculators dropdown is styled active on tools pages", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/tools");
  const header = page.locator("header");
  const calcTrigger = header.getByRole("button", { name: "Calculators", exact: true });
  await expect(calcTrigger).toBeVisible();
  await expect(calcTrigger).toHaveClass(/text-primary/);
});

test("header: calculators dropdown opens and jumps straight to a tool", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  const header = page.locator("header");
  await header.getByRole("button", { name: "Calculators", exact: true }).click();
  const link = page.getByRole("link", { name: /savings goal calculator/i });
  await expect(link).toBeVisible();
  await link.click();
  await expect(page).toHaveURL("/tools/savings-goal");
});

test("header: planners dropdown opens and jumps straight to a goal", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  const header = page.locator("header");
  await header.getByRole("button", { name: "Planners", exact: true }).click();
  const link = page.getByRole("link", { name: /emergency fund planner/i });
  await expect(link).toBeVisible();
  await link.click();
  await expect(page).toHaveURL("/planners/emergency");
});

test("header: dropdown closes on outside click and on Escape", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  const header = page.locator("header");
  const trigger = header.getByRole("button", { name: "Calculators", exact: true });

  await trigger.click();
  await expect(page.getByRole("link", { name: /savings goal calculator/i })).toBeVisible();
  await page.mouse.click(10, 400);
  await expect(page.getByRole("link", { name: /savings goal calculator/i })).not.toBeVisible();

  await trigger.click();
  await expect(page.getByRole("link", { name: /savings goal calculator/i })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("link", { name: /savings goal calculator/i })).not.toBeVisible();
  await expect(trigger).toBeFocused();
});

test("all tools breadcrumb back link goes to /tools", async ({ page }) => {
  await page.goto("/tools/budget-split");
  await page.getByRole("link", { name: "← All calculators", exact: true }).click();
  await expect(page).toHaveURL("/tools");
});

// ─── Landing page ─────────────────────────────────────────────────────────

test("landing page: loads and has CTA", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: /start my plan/i }).first()).toBeVisible();
});
