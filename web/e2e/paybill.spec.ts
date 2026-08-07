import { test, expect } from "@playwright/test";
import { completeJourneyQuiz, visibleText } from "./helpers";

/**
 * The paybill card, which had no browser coverage at all.
 *
 * It is the one element in this app that moves money: a business number and
 * an account reference beside a button that puts
 * `Paybill: X | Account: Y` on the clipboard. Every other tool can be wrong
 * and cost a reader some accuracy; this one can be wrong and send their rent
 * to a stranger.
 *
 * The unit tests in lib/__tests__/paybills.test.ts prove the registry
 * withholds a past-due number. They cannot prove the COMPONENT asked — a
 * `paybillFor()` whose null branch is never rendered would pass all of them.
 * That gap is the reason this file exists.
 */

test("the plan shows a paybill with a working copy button", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await completeJourneyQuiz(page);
  await page.goto("/plan");

  const copy = page.getByTestId("paybill-copy");
  await expect(copy).toBeVisible();

  // The rendered number must be a real paybill, not an empty interpolation.
  // `Paybill {undefined}` renders as "Paybill" and would pass a bare
  // toBeVisible on the card.
  await expect(visibleText(page, /Paybill\s+\d{5,7}/)).toBeVisible();

  await copy.click();
  const clip = await page.evaluate(() => navigator.clipboard.readText());
  expect(clip, "the copy button must produce the full transaction string").toMatch(
    /^Paybill: \d{5,7} \| Account: .+/
  );

  // The confirmation date is rendered from the registry, not typed. A
  // hardcoded month-and-year here is the defect this replaced.
  await expect(visibleText(page, /Payment details last confirmed \d{4}-\d{2}-\d{2}/)).toBeVisible();
});

/**
 * THE SUPPRESSION BRANCH, DRIVEN IN A REAL BROWSER.
 *
 * The clock is moved rather than the data: `Date` is stubbed forward past
 * every review date before the app boots, so the component takes the same
 * path it will take on the day the record actually expires.
 *
 * Without this the null branch is dead code that no test has executed, and
 * "we withhold stale payment details" is a claim about a function rather than
 * about the product.
 */
test("a past-due paybill is withheld, and the copy button goes with it", async ({ page }) => {
  await completeJourneyQuiz(page);

  await page.addInitScript(() => {
    const FIXED = new Date("2099-01-01T00:00:00Z").getTime();
    const Real = Date;
    class Stub extends Real {
      constructor(...args: unknown[]) {
        // @ts-expect-error - forwarding the real constructor's overloads
        if (args.length) super(...args);
        else super(FIXED);
      }
      static now() {
        return FIXED;
      }
    }
    // @ts-expect-error - replacing the global for this page only
    globalThis.Date = Stub;
  });

  await page.goto("/plan");

  // The number is gone, and so is the one-tap route to sending money to it.
  await expect(page.getByTestId("paybill-copy")).toHaveCount(0);
  await expect(page.getByText(/Paybill\s+\d{5,7}/)).toHaveCount(0);

  // And the user is not simply stranded — they are told where to get it.
  await expect(visibleText(page, /past the date we undertook to re-check/i)).toBeVisible();
});
