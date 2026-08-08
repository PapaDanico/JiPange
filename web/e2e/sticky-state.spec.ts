import { test, expect } from "@playwright/test";

/**
 * useStickyState, which persists EVERY calculator's inputs and had no tests.
 *
 * WHY IT WAS UNTESTED, AND WHY THAT REASON WAS WRONG
 *
 * It was written off as needing jsdom, which this repo deliberately avoids.
 * That was never true: the hook's whole surface is localStorage, hydration and
 * cross-tab propagation, and all three are directly observable in the real
 * browser this suite already drives. The constraint was assumed, not checked,
 * and it left the mechanism under every tool unverified.
 *
 * WHY IT IS WORTH MORE THAN A HOOK'S USUAL SHARE OF ATTENTION
 *
 * Two defects found the same day both arrived through this door. The stored
 * value is read with `JSON.parse(raw) as T` — a cast, not a validation — and
 * lib/backup.ts restores ANY jipange-prefixed key from a file the user
 * supplies. So the contents of these keys are, in practice, untrusted input
 * that the type system claims to have checked. A journey answer arriving that
 * way crashed /plan outright.
 *
 * The good news, established by driving it: the hook already degrades
 * correctly on every malformed shape. None of that behaviour was written down
 * or pinned, so nothing would notice if a refactor lost it. That is what these
 * tests are for — they record what it does today, not a wish.
 */

const TOOL = "/tools/savings-goal";
const KEY = "jipange:tool:savings-goal:target";
const FIELD = "#target";

test.describe("useStickyState", () => {
  test("persists a typed value across a reload", async ({ page }) => {
    await page.goto(TOOL);
    await page.locator(FIELD).fill("500000");
    await page.waitForTimeout(400);

    // The premise: it really did reach storage, not just React state.
    const raw = await page.evaluate((k) => localStorage.getItem(k), KEY);
    expect(raw, "nothing was written to localStorage at all").toBe(JSON.stringify("500000"));

    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);
    expect(await page.locator(FIELD).inputValue()).toBe("500000");
  });

  /**
   * The restore path, and the reason these keys are untrusted input.
   *
   * A backup file can carry anything under a jipange: key — written before a
   * field changed shape, or hand-edited. `readAny` catches a JSON parse error
   * and returns null, and `?? defaultValue` covers the rest, so every one of
   * these must land on the default rather than reaching React as an object.
   */
  for (const [label, stored] of [
    ["corrupt JSON", "{not json"],
    ["an object where a string is expected", JSON.stringify({ a: 1 })],
    ["an array", JSON.stringify([1, 2, 3])],
    ["null", JSON.stringify(null)],
  ] as const) {
    test(`degrades to the default on ${label}`, async ({ page }) => {
      await page.goto(TOOL);
      await page.evaluate(([k, v]) => localStorage.setItem(k, v), [KEY, stored] as const);
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.waitForTimeout(500);

      const body = await page.innerText("body");
      expect(body, `${label} took the page to the error boundary`).not.toContain(
        "Something went wrong"
      );
      // The page must still be the calculator, not a blank shell.
      expect(body.length, "the tool rendered nothing").toBeGreaterThan(200);
      expect(
        await page.locator(FIELD).inputValue(),
        `${label} reached the input instead of falling back to the default`
      ).toBe("");
    });
  }

  /**
   * A number is NOT rejected, and that is deliberate to record rather than to
   * fix: `<input>` coerces it to a string and the value is meaningful. Written
   * down so nobody "fixes" it into a blank field on the assumption that only a
   * string is safe.
   */
  test("accepts a number where a string was stored, because the input coerces it", async ({
    page,
  }) => {
    await page.goto(TOOL);
    await page.evaluate(([k, v]) => localStorage.setItem(k, v), [KEY, JSON.stringify(500000)] as const);
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);
    expect(await page.locator(FIELD).inputValue()).toBe("500000");
  });

  /**
   * THE HEADLINE CLAIM OF lib/hooks.ts, AND THE ONE ONLY A BROWSER CAN CHECK.
   *
   * "live updates if the underlying storage changes (e.g. another tab)". Two
   * tabs, one origin, one localStorage: a write in the first must reach the
   * second through the native `storage` event and useSyncExternalStore, with
   * no reload. jsdom fires no such event between documents, which is the other
   * half of why this was never covered.
   */
  test("propagates a change to another tab with no reload", async ({ context }) => {
    const a = await context.newPage();
    const b = await context.newPage();
    await a.goto(TOOL, { waitUntil: "domcontentloaded" });
    await b.goto(TOOL, { waitUntil: "domcontentloaded" });
    await a.waitForTimeout(500);

    // Both start clean, or "they match" proves nothing.
    expect(await a.locator(FIELD).inputValue()).toBe("");
    expect(await b.locator(FIELD).inputValue()).toBe("");

    await a.locator(FIELD).fill("750000");
    await expect(b.locator(FIELD), "the second tab never saw the write").toHaveValue("750000", {
      timeout: 5000,
    });
    await a.close();
    await b.close();
  });

  /**
   * The same-tab path, which the native `storage` event does NOT cover — it
   * fires only in other documents. lib/storage.ts dispatches its own event so
   * a bulk writer can wake subscribers, and lib/backup.ts's restore is exactly
   * that writer. This is the restore-a-snapshot flow, minus the file picker.
   */
  test("picks up a write made outside the component, as backup restore does", async ({ page }) => {
    await page.goto(TOOL, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(400);
    expect(await page.locator(FIELD).inputValue()).toBe("");

    await page.evaluate(
      ([k, v]) => {
        localStorage.setItem(k, v);
        // What notifyStorageChange() dispatches.
        window.dispatchEvent(new Event("jipange:storage-change"));
      },
      [KEY, JSON.stringify("123456")] as const
    );

    await expect(
      page.locator(FIELD),
      "a restored snapshot would not appear until the reader reloaded"
    ).toHaveValue("123456", { timeout: 5000 });
  });
});

/**
 * A DEFAULT THAT IS NOT THE EMPTY STRING, WHICH THE TESTS ABOVE CANNOT USE.
 *
 * The degradation cases above assert the field ends up empty — and that is
 * true whether `?? defaultValue` is there or not, because the savings-goal
 * default IS "" and `readAny` returns null, which React renders as "" anyway.
 * Removing the fallback left all eight of them green. A test that survives the
 * mutation it exists to catch is decoration.
 *
 * The chama member count defaults to "12", so the two outcomes are visibly
 * different: with the fallback the reader sees 12, without it an empty field
 * where a required number belongs. This is the case that actually
 * discriminates, and it is the reason the file has a second tool in it.
 */
test.describe("useStickyState, where the default is not empty", () => {
  const CHAMA = "/tools/chama";
  const CHAMA_KEY = "jipange:tool:chama:members";

  test("the default is what shows before anything is stored", async ({ page }) => {
    await page.goto(CHAMA, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);
    // The premise. If this default ever changes, the assertions below move.
    expect(await page.locator("#members").inputValue()).toBe("12");
  });

  for (const [label, stored] of [
    ["corrupt JSON", "{not json"],
    ["an object", JSON.stringify({ a: 1 })],
    ["null", JSON.stringify(null)],
  ] as const) {
    test(`falls back to the default, not to blank, on ${label}`, async ({ page }) => {
      await page.goto(CHAMA, { waitUntil: "domcontentloaded" });
      await page.evaluate(([k, v]) => localStorage.setItem(k, v), [CHAMA_KEY, stored] as const);
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.waitForTimeout(500);

      expect(await page.innerText("body")).not.toContain("Something went wrong");
      expect(
        await page.locator("#members").inputValue(),
        `${label} produced a blank field — the '?? defaultValue' fallback is gone, ` +
          `and a required input now starts empty instead of at its default`
      ).toBe("12");
    });
  }
});
