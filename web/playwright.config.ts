import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

// The Claude Code sandbox pre-installs Chromium at a fixed path instead of
// Playwright's per-version cache; CI and dev machines install browsers the
// normal way (`npx playwright install chromium`), so only use the fixed
// path when it actually exists.
const sandboxChromium = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: 1,
  workers: 1,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    launchOptions: existsSync(sandboxChromium)
      ? { executablePath: sandboxChromium }
      : {},
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run build && npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120000,
  },
});
