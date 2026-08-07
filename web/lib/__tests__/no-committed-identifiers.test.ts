import { describe, it, expect } from "vitest";
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * No personal data in anything this repository tracks.
 *
 * NOT to be confused with no-personal-data.test.ts, which sits beside this
 * file and does a different job. That one is a REGULATORY guard: it fails if a
 * backend SDK reappears, holding the product to the Data Protection
 * Regulations 2021 position that it stores no personal data on any server it
 * controls. This one is a LEAK guard: it scans what git tracks for identifiers
 * that should never have been committed at all.
 *
 * The distinction matters enough to spell out, because the names are close and
 * conflating them has already cost something: this file was first written
 * straight over no-personal-data.test.ts, on the mistaken belief that this
 * repository had no such guard. Six regulatory assertions were destroyed and
 * the suite stayed green, because the replacement passed. Only an unexplained
 * drop of six in the total count surfaced it.
 *
 * Ported from Mwangaza Yield, which has had this guard since a DhowCSD export
 * trailer carried its owner's full name, email address, phone number, CDS
 * number and KRA PIN into a PUBLIC repository for three days.
 *
 * The port is not speculative housekeeping. On 2026-08-07 a SECURITY.md was
 * added to both repositories with a personal Gmail address as the disclosure
 * contact. Mwangaza's copy of this test failed the build and the address was
 * corrected. This repository — equally public — had no such guard, so the same
 * mistake in the same edit sat here silently and would have merged. It was
 * only caught because the sister repository shouted.
 *
 * That asymmetry is the argument for this file. A scanner like this is
 * repo-agnostic, and this project takes salary, debt and savings figures from
 * people on the promise that nothing about their money leaves their device.
 * A personal identifier committed here would contradict the product's central
 * claim, not merely leak a byte.
 *
 * WHY IT SCANS TRACKED FILES RATHER THAN A DIRECTORY
 * --------------------------------------------------
 * `.gitignore` protects the files somebody already thought about. This catches
 * the ones nobody did — a fixture pasted into a test, a debug dump left under
 * public/, a screenshot's alt text. If git tracks it, it can reach GitHub, so
 * git's own file list is the right thing to walk.
 */

/** Shapes that identify a person, not a product. */
const PATTERNS: { label: string; re: RegExp }[] = [
  // A Kenyan KRA PIN: letter, nine digits, letter.
  { label: "KRA PIN", re: /\b[A-Z]\d{9}[A-Z]\b/ },
  // A CDS/CUI number as DhowCSD writes it.
  { label: "CDS/CUI number", re: /\bN\d{8}\b/ },
  /* Any real-looking email address. The domain part allows MULTIPLE labels:
   * a single-label pattern truncates "someone@treasury.go.ke" to
   * "someone@treasury.go", which then fails to match its own allowlist entry
   * and reports a benign address as a leak for ever. A guard that cries wolf
   * gets switched off. */
  {
    label: "email address",
    re: /\b[\w.+-]+@(?![\w-]*example\.)[\w-]+(?:\.[\w-]+)*\.[a-z]{2,}\b/i,
  },
];

/**
 * Known-good values, allowlisted INDIVIDUALLY rather than by file.
 *
 * Pardoning a whole file is how a guard quietly stops guarding: the fixture
 * that legitimately contains a fake PIN is also the file most likely to
 * receive a real one by copy-paste. So each benign value is named, and
 * anything else of the same shape fails wherever it appears — including inside
 * this very file.
 *
 * Every entry below is an organisational contact meant to be public. None is
 * a person.
 */
const KNOWN_GOOD = new Set([
  // This product's own published address — privacy-facts.ts publishes it and
  // shop-window.test.ts already pins it.
  "hello@jipangefinance.org",
  // The sister product's address, named in partnership material.
  "info@mwangazadigital.org",
  "sample@example.com",
  // A placeholder in the partnership deck's test, marked in that file as
  // "[placeholder — confirm address]". Not yet a real mailbox, and named here
  // so that if it becomes one it is a deliberate act rather than a silent one.
  "partners@jipangefinance.org",
  /* The WRONG domain, quoted on purpose. shop-window.test.ts exists because
   * Terms and About once published hello@jipangefinance.app while the site is
   * .org; that test names the mistaken address in order to assert it appears
   * nowhere real. Allowlisting the value rather than pardoning the file keeps
   * the guard live over the rest of it. */
  "hello@jipangefinance.app",
  /* npm's deprecation notice for glob, which quotes the maintainer's contact:
   * "Support ... may be purchased ... by contacting i@izs.me". It arrives
   * transitively in package-lock.json and is the only address in the lockfile.
   *
   * Named as a value rather than exempting package-lock.json, per the rule
   * above: a lockfile is exactly the sort of large machine-written file where
   * a blanket exemption would hide the next thing. If more registry addresses
   * appear they will fail here and be judged one at a time. */
  "i@izs.me",
]);

/** Only this file, which must quote the patterns in order to define them. */
const ALLOWED = new Set(["web/lib/__tests__/no-committed-identifiers.test.ts"]);

/** Vendored and generated paths where a byte pattern would be meaningless. */
const SKIP_RE = /(^|\/)(node_modules|\.next|out|dist|coverage|test-results)\//;
const BINARY_RE = /\.(png|jpg|jpeg|webp|ico|svg|pdf|woff2?|ttf|zip|gz)$/i;

describe("nothing personal reaches the repository", () => {
  // Two levels up from web/lib/__tests__ is web/; three is the repo root.
  const root = join(__dirname, "..", "..", "..");
  const tracked = execSync("git ls-files", { cwd: root, encoding: "utf8" })
    .split("\n")
    .filter(Boolean)
    .filter((f) => !SKIP_RE.test(f) && !BINARY_RE.test(f) && !ALLOWED.has(f));

  it("walks a real, non-empty file list", () => {
    // A scan of nothing passes silently, which is precisely the failure mode
    // this whole file exists to prevent.
    expect(
      tracked.length,
      "git ls-files returned nothing — the scan is vacuous",
    ).toBeGreaterThan(100);
  });

  it("contains no personal identifiers in any tracked file", () => {
    const hits: string[] = [];
    for (const file of tracked) {
      let text: string;
      try {
        text = readFileSync(join(root, file), "utf8");
      } catch {
        continue; // unreadable or vanished; not this test's business
      }
      for (const { label, re } of PATTERNS) {
        const global = new RegExp(
          re.source,
          re.flags.includes("g") ? re.flags : `${re.flags}g`,
        );
        for (const m of text.matchAll(global)) {
          const value = m[0].trim();
          if (KNOWN_GOOD.has(value)) continue;
          hits.push(`${file}: ${label} — ${JSON.stringify(value.slice(0, 48))}`);
        }
      }
    }
    expect(
      hits,
      `personal data found in tracked files:\n${hits.join("\n")}`,
    ).toEqual([]);
  });
});
