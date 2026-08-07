import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The security headers in netlify.toml, and one that must stay gone.
 *
 * X-XSS-Protection was removed deliberately, and the reasoning is subtle
 * enough that somebody will re-add it in good faith — it looks like a security
 * header, a scanner will list its absence, and "1; mode=block" reads as
 * strictly protective.
 *
 * It is not. It enables a legacy browser XSS auditor that no current browser
 * ships: Chrome removed it, Edge followed, Firefox never implemented it. On
 * every browser a reader actually uses it does nothing at all.
 *
 * And historically it did worse than nothing. The auditor guessed which parts
 * of a response were reflected input and neutralised them, and that guess was
 * itself exploitable — it could be induced to suppress legitimate script or to
 * leak cross-origin information. That is why it was removed from browsers
 * rather than fixed. Sending it advertises a protection that does not exist.
 *
 * SECURITY.md states the header is absent. This is what keeps that true.
 */

// netlify.toml sits at the repository root, two levels above web/lib.
const TOML = readFileSync(
  join(__dirname, "..", "..", "..", "netlify.toml"),
  "utf8",
);

describe("netlify.toml security headers", () => {
  it("is the real file, not an empty read", () => {
    // Without this, every assertion below passes against an empty string.
    expect(TOML.length).toBeGreaterThan(500);
    expect(TOML).toContain("[[headers]]");
  });

  it("does not send X-XSS-Protection", () => {
    // Matches the header name anywhere OUTSIDE a comment line, so the
    // explanation in the file does not trip its own check.
    const active = TOML.split("\n")
      .filter((line) => !line.trim().startsWith("#"))
      .join("\n");
    expect(active).not.toMatch(/X-XSS-Protection/i);
  });

  it("keeps the headers that do something", () => {
    for (const header of [
      "X-Frame-Options",
      "X-Content-Type-Options",
      "Referrer-Policy",
      "Permissions-Policy",
    ]) {
      expect(TOML, `${header} went missing`).toContain(header);
    }
  });

  it("explains the removal where somebody re-adding it would look", () => {
    // A bare absence is indistinguishable from an oversight, and an oversight
    // invites the "fix" this test exists to prevent.
    expect(TOML).toMatch(/X-XSS-Protection IS DELIBERATELY ABSENT/i);
  });
});
