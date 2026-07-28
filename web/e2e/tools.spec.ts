import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
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

/**
 * The export button must produce an actual PDF — and exactly one page of it.
 *
 * The assertion is the %PDF- magic bytes and the page structure, not "a
 * download fired with a plausible size" — the sister product held that weaker
 * check green for months while the button emitted a .png, and the user's
 * report ("I still cannot generate PDFs") was accurate the whole time.
 *
 * WHY THIS FLIPPED FROM "MORE THAN ONE PAGE" TO "EXACTLY ONE"
 * ----------------------------------------------------------
 * It used to assert `pages > 1`, guarding a deliberate choice: rather than
 * shrink a long card to an unreadable sliver, the exporter cut it into
 * page-height bands. That was the right call for what it was exporting — a
 * phone-shaped column of cards with no document structure.
 *
 * It also produced a completely blank second page on real exports, because the
 * band cut landed a few pixels into empty space. Two sample PDFs came back
 * that way, and a blank sheet is the first thing a reader notices.
 *
 * The export is now a document rather than a photograph of a card: a fixed A4
 * sheet with a header, the inputs, a grid of results and a methodology
 * footnote, laid out to fit. One page is the contract, so that is what this
 * checks. The old assertion is not weakened here, it is REPLACED — a
 * requirement changed, and the two cannot both be true.
 */
test("take-home pay: the PDF button downloads a real, single-page PDF", async ({ page }) => {
  // A phone viewport on purpose: it is what most readers are on, and it is the
  // case that used to overflow onto a second sheet. If one page holds here, it
  // holds at desktop width too.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/tools/take-home-pay");
  await page.getByRole("spinbutton").first().fill("150000");
  await expect(visibleText(page, "PAYE (before relief)")).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /download pdf/i }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toMatch(/\.pdf$/);
  const path = await download.path();
  const bytes = readFileSync(path);
  expect(bytes.subarray(0, 5).toString("latin1")).toBe("%PDF-");

  const raw = bytes.toString("latin1");
  const pages = (raw.match(/\/Type\s*\/Page[^s]/g) ?? []).length;
  expect(pages, "the export is a one-page document; a second page means content overflowed").toBe(1);

  /* The sheet is A4, in one orientation or the other. Without this, a future
   * change that fitted everything onto one page by emitting a page the shape
   * of the card would satisfy the count above and stop being a document. */
  const box = raw.match(/\/MediaBox\s*\[([^\]]*)\]/);
  expect(box, "no MediaBox — the PDF has no page geometry").toBeTruthy();
  const [, , w, h] = box![1].trim().split(/\s+/).map(Number);
  const a4 = (a: number, b: number) => Math.abs(a - 595.28) < 2 && Math.abs(b - 841.89) < 2;
  expect(
    a4(w, h) || a4(h, w),
    `page is ${Math.round(w)}x${Math.round(h)}pt, which is not A4 in either orientation`
  ).toBe(true);

  /* And it is not a blank sheet. One page containing nothing would pass every
   * assertion above — which is exactly the failure the old two-page export
   * shipped, one page too late. */
  expect(bytes.byteLength, "the PDF is too small to contain a rendered sheet").toBeGreaterThan(20_000);
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

/**
 * Asserts the substance, not the heading.
 *
 * This used to check for the copy "your FIRE number at age" — which a heading
 * alone satisfies, and which went stale the moment the tool stopped quoting a
 * nominal number. The tool now exists to say one thing a reader cannot get
 * from their own budget: what share of the retirement capital is medical
 * cover. So that is what gets checked, along with the figure being stated in
 * today's money rather than inflated into an unactionable nominal headline.
 */
test("fire number: prices retirement in today's money and surfaces the medical share", async ({
  page,
}) => {
  await page.goto("/tools/fire-number");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  const inputs = page.getByRole("spinbutton");
  await inputs.nth(0).fill("80000"); // living costs
  await inputs.nth(1).fill("8000"); // medical cover

  await expect(visibleText(page, /in today's shillings/i)).toBeVisible();
  await expect(visibleText(page, /of your retirement/i)).toBeVisible();
  await expect(
    visibleText(page, /exists for nothing but medical cover/i)
  ).toBeVisible();
  // The return assumption must always be shown with its evidence, never bare.
  await expect(visibleText(page, /after inflation and tax/i)).toBeVisible();
});

test("fire number: says plainly that a plan with no medical cover is incomplete", async ({
  page,
}) => {
  await page.goto("/tools/fire-number");
  await page.getByRole("spinbutton").nth(0).fill("80000");
  // Medical deliberately left empty.
  await expect(visibleText(page, /SHA is a floor, not a plan/i)).toBeVisible();
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

test("payday router: answers the overspent case instead of going blank", async ({ page }) => {
  // Found by driving the tool, not by reading it: with outflows above salary
  // the page rendered its inputs and nothing else. The user in the worst
  // position got the least information.
  await page.goto("/tools/payday-router");
  const inputs = page.getByRole("spinbutton");
  await inputs.nth(0).fill("60000");
  await inputs.nth(1).fill("70000");
  await expect(page.getByTestId("weekly-limit")).toHaveCount(0);
  const shortfall = page.getByTestId("router-shortfall");
  await expect(shortfall).toBeVisible();
  await expect(shortfall).toContainText("Ksh 10,000");
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

// ─── KPLC Token Band Checker ───────────────────────────────────────────────

/**
 * The old test asserted that a "savings" figure appeared, which is exactly the
 * assertion that kept a false claim green: the tool told people two purchases
 * beat one, the number rendered, and the test was satisfied. KPLC counts units
 * across the whole calendar month, so that saving was always zero.
 *
 * This drives the real question instead — what a reader's own receipt implies
 * about the band their month lands in.
 */
test("kplc band checker: derives the true unit rate and the month's band", async ({ page }) => {
  await page.goto("/tools/kplc-optimizer");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  const inputs = page.getByRole("spinbutton");
  await inputs.nth(0).fill("2000"); // monthly budget
  await inputs.nth(1).fill("1000"); // last purchase
  await inputs.nth(2).fill("50"); // units received → Ksh 20/unit

  const card = page.getByTestId("kplc-band");
  await expect(card).toBeVisible();
  await expect(card).toContainText("Ksh 20");
  // 2000 / 20 = 100 units, the DC2 ceiling.
  await expect(page.getByTestId("kplc-units")).toContainText("100.0");
  await expect(card).toContainText("DC2");
});

test("kplc band checker: no longer claims splitting a purchase saves anything", async ({
  page,
}) => {
  await page.goto("/tools/kplc-optimizer");
  const body = page.locator("body");
  // The full sentence across the <em> boundary, because the space after
  // </em> was silently dropped at render ("does not help.KPLC counts").
  // Asserting either half alone passes straight over the seam.
  await expect(body).toContainText("does not help. KPLC counts units");
  // Scoped to the claim, not the word: the site describes its calculators as
  // free throughout, so a bare /free/i match fails on the nav and proves
  // nothing about this tool.
  for (const claim of [/for free/i, /free units/i, /extra units/i, /gaining you an extra/i]) {
    await expect(body).not.toContainText(claim);
  }
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
  // The figure is the assertion; the currency prefix is not. This pinned
  // "KSh 1,500" and broke the moment the app settled on one spelling of the
  // shilling — a test failing over a label it was not written to check. The
  // spelling is enforced on its own, in lib/__tests__/currency-label.test.ts.
  await expect(visibleText(page, /1,500/)).toBeVisible();
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

// ─── Mobile ergonomics ────────────────────────────────────────────────────

/**
 * Controls a thumb can actually hit, on the screen most readers are using.
 *
 * A sweep of all 36 routes at 390px found 36 of them carrying sub-40px
 * controls: the "← All calculators" back link on every calculator page at
 * 14px, the related-tool chips at 30px, preset chips at 30px, the segmented
 * tabs at 30px, and ten sliders with an 8px hit area. None of it was visible
 * in a screenshot or caught by a unit test — everything rendered correctly and
 * was simply too small to press.
 *
 * Two things this test does NOT flag, both deliberate and both learned by
 * getting them wrong first:
 *   - the skip link, which is 1px until focused, on purpose;
 *   - controls that expand their hit area with a ::before overlay, an idiom
 *     already used here (`before:-inset-4` on the info icons). The element box
 *     stays small while the TARGET is comfortably large, and measuring only
 *     getBoundingClientRect reports a defect where someone already did the
 *     right thing.
 */
const ERGONOMIC_ROUTES = ["/tools/take-home-pay", "/tools/savings-goal", "/tools/salary", "/tools"];

for (const route of ERGONOMIC_ROUTES) {
  test(`mobile: ${route} has no sub-40px controls and no sideways scroll`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(route);
    await page.waitForTimeout(600);

    const report = await page.evaluate(() => {
      const overflow =
        document.documentElement.scrollWidth - document.documentElement.clientWidth;
      const small: string[] = [];
      for (const el of Array.from(
        document.querySelectorAll<HTMLElement>("button, a, select, input, [role=button]"),
      )) {
        const box0 = el.getBoundingClientRect();
        if (box0.width === 0 || box0.height === 0) continue;
        if (getComputedStyle(el).visibility === "hidden") continue;
        if (el.closest("nav") || el.closest("footer")) continue;
        if (/\bsr-only\b/.test(el.className || "")) continue;
        const parent = el.parentElement;
        if (el.tagName === "A" && parent && /^(P|LI|SPAN)$/.test(parent.tagName)) continue;

        const box = (el.closest("label") ?? el).getBoundingClientRect();
        const before = getComputedStyle(el, "::before");
        let reach = 0;
        if (before?.content && before.content !== "none") {
          const top = parseFloat(before.top);
          if (!Number.isNaN(top) && top < 0) reach = Math.abs(top) * 2;
        }
        if (box.height + reach < 40) {
          small.push(`${el.tagName} "${(el.textContent ?? "").trim().slice(0, 30)}" ${Math.round(box.height)}px`);
        }
      }
      return { overflow, small: Array.from(new Set(small)) };
    });

    expect(report.overflow, "the page must never scroll sideways at 390px").toBeLessThanOrEqual(1);
    expect(report.small, `controls too small to press:\n${report.small.join("\n")}`).toEqual([]);
  });
}
