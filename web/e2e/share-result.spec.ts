import { test, expect } from "@playwright/test";

/**
 * The share button, driven rather than asserted about.
 *
 * The unit tests cover what `canShareFile` decides. They cannot cover the two
 * things that actually break this feature in the wild:
 *
 *  1. the button appearing on a device that cannot share files, where pressing
 *     it throws — so absence is the assertion, not a disabled attribute; and
 *  2. the button appearing but producing nothing, because the capability probe
 *     said yes and the canvas path then failed.
 *
 * Web Share is not available in headless Chromium, which is convenient: it
 * gives the unsupported case for free, and the supported case is reached by
 * installing a `navigator.share` that records what it was handed.
 */

const TOOL = "/tools/salary";

/** A calculator page with results on screen, which is when export appears. */
async function openResults(page: import("@playwright/test").Page) {
  await page.goto(TOOL);
  const gross = page.getByLabel(/gross|basic/i).first();
  await gross.waitFor({ state: "visible", timeout: 15000 });
  await gross.fill("150000");
  await page.waitForTimeout(800);
}

test("no share button on a device that cannot share files", async ({ page }) => {
  await openResults(page);
  // Headless Chromium has no navigator.share. The honest rendering of "not on
  // this device" is nothing at all — a disabled button still advertises it.
  await expect(page.getByRole("button", { name: /share result/i })).toHaveCount(0);
  // ...and the two paths that DO work are still offered.
  await expect(page.getByRole("button", { name: /save image/i })).toBeVisible();
});

test("the share button appears and hands over a real PNG when the device can", async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __shared?: { name: string; type: string; size: number }[] };
    w.__shared = [];
    Object.defineProperty(navigator, "canShare", {
      configurable: true,
      value: (d: ShareData) => Array.isArray(d?.files) && d.files.length > 0,
    });
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: async (d: ShareData) => {
        for (const f of d.files ?? []) w.__shared!.push({ name: f.name, type: f.type, size: f.size });
      },
    });
  });

  await openResults(page);

  const share = page.getByRole("button", { name: /share result/i });
  await expect(share).toBeVisible();
  await share.click();

  await expect
    .poll(async () => page.evaluate(() => (window as unknown as { __shared: unknown[] }).__shared.length), {
      timeout: 30000,
    })
    .toBe(1);

  const shared = await page.evaluate(
    () => (window as unknown as { __shared: { name: string; type: string; size: number }[] }).__shared[0],
  );
  expect(shared.type).toBe("image/png");
  expect(shared.name).toMatch(/\.png$/);
  // A PNG of a rendered card is tens of kilobytes. A few hundred bytes means
  // the canvas came back blank — the failure this whole path exists to avoid,
  // and one that a "did it throw?" check would sail straight past.
  expect(shared.size).toBeGreaterThan(5000);

  // Nothing went wrong, so nothing should be shouting about it.
  //
  // Asserted on the TEXT, not on the presence of a role="alert" node: the page
  // already carries an empty live region, so `toHaveCount(0)` failed here
  // against working code. An assertion that cannot pass is as useless as one
  // that cannot fail.
  await expect(page.getByText(/could not|did not open/i)).toHaveCount(0);
});

test("dismissing the share sheet says nothing at all", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "canShare", { configurable: true, value: () => true });
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: async () => {
        throw new DOMException("Share canceled", "AbortError");
      },
    });
  });

  await openResults(page);
  await page.getByRole("button", { name: /share result/i }).click();
  await page.waitForTimeout(2500);

  // Changing your mind is not an error. Showing one here would train readers
  // to ignore the messages that do matter.
  // The page has an always-present empty live region, so this asks whether any
  // error TEXT was rendered rather than whether an alert node exists.
  await expect(page.getByText(/could not|did not open/i)).toHaveCount(0);
  const shouting = (await page.getByRole("alert").allInnerTexts()).filter((t) => t.trim());
  expect(shouting).toEqual([]);
});
