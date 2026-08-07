import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

/**
 * The Content-Security-Policy in netlify.toml.
 *
 * netlify.toml used to say there was not one, reasoning that Next emits inline
 * scripts, a correct policy therefore needs nonces, and a wrong CSP breaks the
 * site in production only. All true — and an argument about ONE directive,
 * applied to the whole header, so the site also went without the directives
 * that need no nonce and break nothing.
 */

const TOML = readFileSync(new URL("../../../netlify.toml", import.meta.url).pathname, "utf8");

const csp = (() => {
  const block = TOML.match(/Content-Security-Policy\s*=\s*"""([\s\S]*?)"""/);
  const line = TOML.match(/Content-Security-Policy\s*=\s*"([^"]+)"/);
  const raw = block ? block[1] : line ? line[1] : "";
  return raw.replace(/\\\s*\n/g, "").replace(/\s+/g, " ").trim();
})();

describe("the Content-Security-Policy", () => {
  it("exists, so the assertions below are not vacuous", () => {
    expect(csp.length).toBeGreaterThan(60);
    expect(csp).toContain("default-src");
  });

  /* Each of these needs no nonce, breaks nothing, and blocks a real attack:
   * a <base> tag repointing every relative URL, a form rewritten to post to
   * another origin, a plugin payload, framing by a stranger. */
  it.each([
    "default-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
  ])("carries %s", (directive) => {
    expect(csp).toContain(directive);
  });

  it("never permits unsafe-eval, anywhere", () => {
    expect(csp).not.toContain("unsafe-eval");
  });

  it("never wildcards a fetch directive", () => {
    expect(csp).not.toMatch(/(?:default|script|connect|object)-src[^;]*\*/);
  });

  /**
   * THE ONE LOOSE DIRECTIVE MUST STAY DOCUMENTED.
   *
   * script-src carries 'unsafe-inline', so the policy does NOT stop injected
   * script. The risk to guard against is not the limit — it is the limit
   * quietly outliving its disclosure, leaving the docs claiming a protection
   * the header does not provide.
   */
  it("discloses that script-src permits inline script", () => {
    expect(csp).toContain("script-src 'self' 'unsafe-inline'");
    const security = readFileSync(
      new URL("../../../SECURITY.md", import.meta.url).pathname,
      "utf8"
    );
    expect(
      security,
      "script-src permits inline script and SECURITY.md no longer says so — " +
        "the header and the disclosure have drifted apart"
    ).toMatch(/unsafe-inline/);
  });

  it("is verified against the running app by CI, not merely reviewed", () => {
    const ci = readFileSync(
      new URL("../../../.github/workflows/webpack.yml", import.meta.url).pathname,
      "utf8"
    );
    expect(ci).toContain("verify:csp");
  });
});
