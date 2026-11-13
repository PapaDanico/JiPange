import { expect, test } from "@playwright/test";

/**
 * Pasting a figure the way Kenyans write it must still work after the field
 * stopped stripping signs: "50,000", "KSh 50,000", "50,000 KES", "50,000/=".
 */
test.describe("NumberField paste formats", () => {
  for (const [pasted, expected] of [
    ["50,000", "50000"],
    ["KSh 50,000", "50000"],
    ["50,000 KES", "50000"],
    ["50,000/=", "50000"],
    ["-5000", "-5000"],
  ] as const) {
    test(`pastes ${JSON.stringify(pasted)} as ${expected}`, async ({ page, context }) => {
      await context.grantPermissions(["clipboard-read", "clipboard-write"]);
      await page.goto("/tools/savings-goal");
      const field = page.locator("#target");
      await field.click();
      await page.evaluate((text) => navigator.clipboard.writeText(text), pasted);
      await page.keyboard.press("Control+V");
      await expect(field).toHaveValue(expected);
    });
  }
});
