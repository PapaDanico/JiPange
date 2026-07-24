import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

// The Claude Code sandbox pre-installs Chromium under /opt/pw-browsers
// instead of Playwright's per-version cache; the unversioned symlink tracks
// whatever build the sandbox image ships, so this keeps working across image
// rotations. CI and dev machines install browsers the normal way
// (`npx playwright install chromium`) and skip this branch entirely.
const sandboxChromium = "/opt/pw-browsers/chromium";

// Tests are independent (fresh browser context + per-context localStorage
// each), so Playwright's default parallelism is safe and roughly halves the
// suite's wall time.
export default defineConfig({
  testDir: "./e2e",
  retries: 1,
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
    // CI builds in its own workflow step first (fail-fast, readable logs),
    // so the webServer only has to boot `next start` — well inside the
    // timeout. Locally the build still runs here for a one-command `npm
    // run e2e`.
    command: process.env.CI ? "npm run start" : "npm run build && npm run start",
    url: "http://localhost:3000",
    // A stray dev server on :3000 must not be silently reused in CI — the
    // suite would validate a dev build (PWA off, different caching) while
    // claiming to test production.
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
