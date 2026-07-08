import { test, expect } from "@playwright/test";

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
  await expect(page.getByText(/80%\+/)).toBeVisible();
  const grossInput = page.getByRole("spinbutton").first();
  await grossInput.fill("150000");
  await expect(page.getByText(/net pay/i).first()).toBeVisible();
  await expect(page.getByText(/PAYE/i).first()).toBeVisible();
});

// ─── Savings Goal ──────────────────────────────────────────────────────────

test("savings goal: calculates required monthly deposit", async ({ page }) => {
  await page.goto("/tools/savings-goal");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const inputs = page.getByRole("spinbutton");
  await inputs.nth(0).fill("500000");
  await inputs.nth(1).fill("24");
  await inputs.nth(2).fill("10");
  await expect(page.getByText(/monthly/i).first()).toBeVisible();
});

// ─── Loan Repayment ────────────────────────────────────────────────────────

test("loan repayment: shows monthly instalment", async ({ page }) => {
  await page.goto("/tools/loan-repayment");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const inputs = page.getByRole("spinbutton");
  await inputs.nth(0).fill("200000");
  await inputs.nth(1).fill("12");
  await inputs.nth(2).fill("24");
  await expect(page.getByText(/monthly installment|total repaid/i).first()).toBeVisible();
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
  await expect(page.getByText(/total value|projected/i).first()).toBeVisible();
});

// ─── FIRE Number ───────────────────────────────────────────────────────────

test("fire number: shows retirement number", async ({ page }) => {
  await page.goto("/tools/fire-number");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const inputs = page.getByRole("spinbutton");
  await inputs.nth(0).fill("80000");
  await expect(page.getByText(/FIRE number|retirement/i).first()).toBeVisible();
});

// ─── Money Runway ──────────────────────────────────────────────────────────

test("money runway: shows months of runway", async ({ page }) => {
  await page.goto("/tools/money-runway");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const inputs = page.getByRole("spinbutton");
  await inputs.nth(0).fill("1000000");
  await inputs.nth(1).fill("50000");
  await expect(page.getByText(/years|runway/i).first()).toBeVisible();
});

// ─── Budget Split ──────────────────────────────────────────────────────────

test("budget split: renders split amounts", async ({ page }) => {
  await page.goto("/tools/budget-split");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const inputs = page.getByRole("spinbutton");
  await inputs.nth(0).fill("120000");
  await expect(page.getByText(/household expenses/i)).toBeVisible();
});

// ─── Tax Shield ────────────────────────────────────────────────────────────

test("tax shield: shows relief amounts", async ({ page }) => {
  await page.goto("/tools/tax-shield");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const inputs = page.getByRole("spinbutton");
  await inputs.nth(0).fill("200000");
  await expect(page.getByText(/relief|saving|PAYE/i).first()).toBeVisible();
});

// ─── Salary Negotiation ───────────────────────────────────────────────────

test("salary negotiation: reverse-engineers gross", async ({ page }) => {
  await page.goto("/tools/salary-negotiation");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const inputs = page.getByRole("spinbutton");
  await inputs.nth(0).fill("100000");
  await expect(page.getByText(/gross/i).first()).toBeVisible();
});

// ─── Payday Router ─────────────────────────────────────────────────────────

test("payday router: shows weekly limit", async ({ page }) => {
  await page.goto("/tools/payday-router");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const inputs = page.getByRole("spinbutton");
  await inputs.nth(0).fill("120000");
  await inputs.nth(1).fill("30000");
  await expect(page.getByText(/weekly|week/i).first()).toBeVisible();
});

// ─── Fuliza Cost ───────────────────────────────────────────────────────────

test("fuliza cost: shows true cost", async ({ page }) => {
  await page.goto("/tools/fuliza-cost");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const inputs = page.getByRole("spinbutton");
  await inputs.nth(0).fill("5000");
  await inputs.nth(1).fill("14");
  await expect(page.getByText(/cost|fee|fuliza/i).first()).toBeVisible();
});

// ─── KPLC Optimizer ────────────────────────────────────────────────────────

test("kplc optimizer: shows kWh savings", async ({ page }) => {
  await page.goto("/tools/kplc-optimizer");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const inputs = page.getByRole("spinbutton");
  await inputs.nth(0).fill("3000");
  await expect(page.getByText(/kWh|unit|token/i).first()).toBeVisible();
});

// ─── SACCO vs Bank ────────────────────────────────────────────────────────

test("sacco vs bank: shows comparison", async ({ page }) => {
  await page.goto("/tools/sacco-vs-bank");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const inputs = page.getByRole("spinbutton");
  await inputs.nth(0).fill("500000");
  await inputs.nth(1).fill("12");
  await expect(page.getByText(/SACCO/i).first()).toBeVisible();
});

// ─── Guarantor Shield ─────────────────────────────────────────────────────

test("guarantor shield: shows frozen borrowing power", async ({ page }) => {
  await page.goto("/tools/guarantor-shield");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const inputs = page.getByRole("spinbutton");
  await inputs.nth(0).fill("500000");
  await inputs.nth(1).fill("200000");
  await expect(page.getByText(/borrow|frozen|guarantee/i).first()).toBeVisible();
});

// ─── 1/3 Rule Checker ────────────────────────────────────────────────────

test("one-third rule: shows deduction analysis", async ({ page }) => {
  await page.goto("/tools/one-third-rule");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const inputs = page.getByRole("spinbutton");
  await inputs.nth(0).fill("120000");
  await inputs.nth(1).fill("50000");
  await expect(page.getByText(/deduction|one.third|limit/i).first()).toBeVisible();
});

// ─── Inflation Reality ───────────────────────────────────────────────────

test("inflation reality: shows real value erosion", async ({ page }) => {
  await page.goto("/tools/inflation-reality");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const inputs = page.getByRole("spinbutton");
  await inputs.nth(0).fill("100000");
  await inputs.nth(1).fill("5");
  await expect(page.getByText(/real value|inflation|purchasing/i).first()).toBeVisible();
});

// ─── DhowCSD T-Bill Ladder ────────────────────────────────────────────────

test("dhowcsd: shows t-bill ladder allocation", async ({ page }) => {
  await page.goto("/tools/dhowcsd");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const inputs = page.getByRole("spinbutton");
  await inputs.nth(0).fill("1000000");
  await expect(page.getByText(/91|182|364|T-Bill/i).first()).toBeVisible();
});

// ─── Education Savings ────────────────────────────────────────────────────

test("education savings: shows monthly target", async ({ page }) => {
  await page.goto("/tools/education-savings");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByText(/monthly|save|target/i).first()).toBeVisible();
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
  await expect(page.getByText("Your smoothed monthly salary")).toBeVisible();
});

// ─── 20th challenge ───────────────────────────────────────────────────────

test("20th challenge: setup screen loads and accepts a commitment", async ({ page }) => {
  await page.goto("/tools/20th-challenge");
  await expect(page.getByText(/monthly savings commitment/i).first()).toBeVisible();
  await page.fill("#commitment", "5000");
  await expect(page.getByText(/start the challenge/i)).toBeVisible();
});

// ─── ToolEnhancements: related chips ────────────────────────────────────

test("tool enhancements: shows Try next section with chips", async ({ page }) => {
  await page.goto("/tools/take-home-pay");
  await expect(page.getByText(/try next/i)).toBeVisible();
  await expect(page.getByRole("link", { name: "Tax Shield", exact: true })).toBeVisible();
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
  await expect(page.getByText(/recently used/i)).toBeVisible();
  await expect(page.getByRole("link", { name: "Take-Home Pay", exact: true })).toBeVisible();
});

// ─── ToolInsights: both cards rendered ────────────────────────────────────

test("tool insights: loan repayment caution card is visible", async ({ page }) => {
  await page.goto("/tools/loan-repayment");
  await expect(page.getByText(/KSh 1,500/)).toBeVisible();
});

// ─── Navigation ───────────────────────────────────────────────────────────

test("header: logo links back to home", async ({ page }) => {
  await page.goto("/tools/fire-number");
  await page.getByRole("link", { name: /jipange home/i }).click();
  await expect(page).toHaveURL("/");
});

test("header: calculators nav link has aria-current on tools pages", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/tools");
  const header = page.locator("header");
  const calcLink = header.getByRole("link", { name: "Calculators", exact: true });
  await expect(calcLink).toBeVisible();
  await expect(calcLink).toHaveAttribute("aria-current", "page");
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
