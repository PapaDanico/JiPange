import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

/**
 * WCAG 2.2 AA, automated, on every route in the sitemap — at phone width,
 * because that is where most readers are and where tables overflow.
 *
 * WHY THIS EXISTS. The first run (September 2026) found the home page's
 * sources footnote at 1.78:1 — the line that says where the statistics come
 * from, which CLAUDE.md says is not optional decoration, rendered so faint it
 * was effectively optional to read. Plus a 3.1:1 "Going deeper" label on five
 * calculators, and two sideways-scrolling tables a keyboard could not reach.
 *
 * WHAT IT IS NOT. axe finds perhaps a third of real accessibility problems:
 * contrast, names, roles, structure. It cannot tell whether a label makes
 * sense or whether a flow is usable with a screen reader. Green here is a
 * floor, not a verdict.
 *
 * Reduced motion is emulated so the landing page's fade-in blocks are
 * visible: at opacity 0 axe skips them, and the reality band's faint source
 * lines went unaudited on exactly that basis.
 */

const TOOLS = [
  "take-home-pay", "savings-goal", "budget-split", "payday-router", "loan-repayment",
  "tax-shield", "investment-returns", "fire-number", "dhowcsd", "money-runway",
  "salary-negotiation", "sacco-vs-bank", "inflation-reality", "kplc-optimizer",
  "fuliza-cost", "one-third-rule", "guarantor-shield", "chama", "hustle-smoother",
  "20th-challenge", "debt-escape", "land-purchase", "salary", "sha-health",
  "school-fees-lifetime", "where-to-save",
];
const ROUTES = [
  "/", "/about", "/partners", "/profile", "/profile/full", "/picture", "/plan", "/dashboard",
  "/money-map", "/planners", "/planners/education", "/planners/home", "/planners/emergency",
  "/planners/business", "/planners/retirement", "/planners/hustle", "/tools",
  ...TOOLS.map((t) => `/tools/${t}`),
  "/terms", "/privacy", "/faq", "/glossary", "/support", "/licensing",
];

const AXE = readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");

test.describe("accessibility (axe, WCAG 2.2 AA)", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  for (const route of ROUTES) {
    test(`${route} has no WCAG A/AA violations axe can detect`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(route, { waitUntil: "networkidle" });
      await page.addScriptTag({ content: AXE });
      const violations = await page.evaluate(async () => {
        // @ts-expect-error — injected above, not typed on window
        const result = await window.axe.run(document, {
          runOnly: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
        });
        return (result.violations as { id: string; nodes: { target: string[]; failureSummary?: string }[] }[]).map(
          (v) =>
            `${v.id}: ` +
            v.nodes
              .slice(0, 3)
              .map((n) => `${n.target.join(" ")} — ${(n.failureSummary ?? "").split("\n")[1]?.trim() ?? ""}`)
              .join(" | ")
        );
      });
      expect(violations, violations.join("\n")).toEqual([]);
    });
  }
});
