import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { TOOL_META } from "../../tool-meta";

/**
 * Drift guard for the OG share cards. Each tool's card title is a colocated
 * copy of the page's display title (the ToolLayout H1) — this test makes a
 * rename that touches one but not the other a failing build instead of a
 * silently stale share card. It also enforces emoji-free card titles: the
 * satori renderer only embeds Source Serif 4, so emoji render as tofu.
 */

const TOOLS_DIR = join(process.cwd(), "app/tools");

// Anything outside the basic latin/punctuation range the card font covers.
const NON_LATIN = /[^\x20-\x7E’—–·áéíóúÁÉÍÓÚ]/u;

function cardTitle(dir: string): string | null {
  const file = join(dir, "opengraph-image.tsx");
  if (!existsSync(file)) return null;
  const match = readFileSync(file, "utf8").match(/const title = "((?:[^"\\]|\\.)*)"/);
  return match ? match[1].replace(/\\(.)/g, "$1") : null;
}

function pageDisplayTitle(dir: string): string | null {
  const file = join(dir, "page.tsx");
  if (!existsSync(file)) return null;
  const match = readFileSync(file, "utf8").match(/title="([^"]+)"/);
  return match ? match[1] : null;
}

/** The page H1 may carry a decorative emoji prefix; the card must not. */
function stripEmoji(title: string): string {
  return title
    .split("")
    .filter((ch) => !NON_LATIN.test(ch) || /[’—–·]/.test(ch))
    .join("")
    .trim();
}

const toolDirs = readdirSync(TOOLS_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => join(TOOLS_DIR, entry.name))
  .filter((dir) => existsSync(join(dir, "opengraph-image.tsx")));

describe("OG card titles", () => {
  /**
   * Counted against the registry rather than against a number typed here.
   *
   * This asserted ">= 25" and went red when /tools/education-savings was
   * deliberately retired — the guard could not tell a removal from a scan that
   * had stopped finding anything, which is the only failure it exists to
   * catch. A hardcoded floor also drifts upward silently every time a tool is
   * added and nobody updates it.
   *
   * Reading TOOL_META gives it a real referent: every tool the app registers
   * with an OG image must have a card, and a scan that finds nothing still
   * fails because the registry is never empty. Tools without an
   * opengraph-image.tsx are excluded rather than demanded, which is the
   * existing behaviour of the filter above.
   */
  it("covers every registered tool that ships an OG image", () => {
    const registered = Object.keys(TOOL_META).filter((h) => h.startsWith("/tools/"));
    expect(registered.length, "the tool registry is empty").toBeGreaterThan(15);
    const withCards = registered.filter((h) =>
      existsSync(join(TOOLS_DIR, h.replace("/tools/", ""), "opengraph-image.tsx"))
    );
    expect(toolDirs.length).toBe(withCards.length);
  });

  it.each(toolDirs.map((dir) => [dir.split("/").pop(), dir]))(
    "%s: card title matches the page display title and is emoji-free",
    (_name, dir) => {
      const card = cardTitle(dir as string);
      const page = pageDisplayTitle(dir as string);
      expect(card).toBeTruthy();
      expect(page).toBeTruthy();
      expect(card).toBe(stripEmoji(page as string));
      expect(NON_LATIN.test(card as string)).toBe(false);
    }
  );
});
