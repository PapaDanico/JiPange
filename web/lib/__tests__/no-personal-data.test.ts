import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { ONLY_IF_YOU_SIGN_IN, PROCESSORS } from "../privacy-facts";

/**
 * This product must hold no personal data on any server it controls.
 *
 * That is a REGULATORY position, not a preference, and it is why it is a test.
 *
 * The Data Protection (Registration of Data Controllers and Data Processors)
 * Regulations, 2021 exempt a controller under Ksh 5 million turnover AND under
 * ten employees — but disapply that exemption for any purpose in the Third
 * Schedule, which includes "provision of financial services". For a purpose on
 * that list, registration is mandatory regardless of size.
 *
 * Whether a personal-finance tool is "provision of financial services" is
 * genuinely arguable. Holding no personal data is not arguable. So the position
 * chosen in July 2026 was to stop being a controller of personal data at all
 * rather than to win the classification argument: the calculators and journey
 * were already device-only, the plan stopped leaving the device earlier that
 * month, and the Supabase sign-in — e-mail, name, age, county, salary,
 * dependants — was removed.
 *
 * The failure mode this guards is not malice. It is somebody six months from
 * now adding "sign in to sync across devices" as an obvious product win,
 * shipping it, and silently moving the company back inside a mandatory
 * registration category. Nothing would break. No page would look wrong. The
 * exposure would just quietly exist again.
 *
 * If you are here because this test failed and you DO intend to collect
 * personal data again: that is a decision for the operator and its advisers,
 * not a test to delete. Registration, a DPO assessment and the privacy notice
 * all have to move on the same commit.
 */
const ROOT = new URL("../../", import.meta.url).pathname;

/** Packages that only exist to talk to a backend that stores people. */
const BACKEND_SDKS = [
  "@supabase/supabase-js",
  "@supabase/ssr",
  "firebase",
  "firebase-admin",
  "@clerk/nextjs",
  "next-auth",
  "@auth/core",
  "@prisma/client",
  "mongodb",
  "@planetscale/database",
];

function sources(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next" || name === "__tests__") continue;
    const path = `${dir}/${name}`;
    if (statSync(path).isDirectory()) sources(path, acc);
    else if (/\.tsx?$/.test(path)) acc.push(path);
  }
  return acc;
}

describe("no personal data reaches any server we control", () => {
  const pkg = JSON.parse(readFileSync(`${ROOT}package.json`, "utf8"));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };

  const files = ["app", "components", "lib"]
    .filter((d) => existsSync(`${ROOT}${d}`))
    .flatMap((d) => sources(`${ROOT}${d}`));

  it("found sources to check, so the guard is not vacuous", () => {
    expect(files.length, "no source files found").toBeGreaterThan(50);
    expect(Object.keys(deps).length, "no dependencies found").toBeGreaterThan(5);
  });

  it("depends on no auth or database SDK", () => {
    /* Checked at the DEPENDENCY level, not just imports. A package that is
     * installed but unused is one import away from being used, and the removal
     * is not real until it leaves package.json. */
    const present = BACKEND_SDKS.filter((sdk) => sdk in deps);
    expect(
      present,
      "an auth/database SDK is installed again — see the header before adding one"
    ).toEqual([]);
  });

  it("has no sign-in, session or auth route left in the source", () => {
    const offenders: string[] = [];
    for (const file of files) {
      const src = readFileSync(file, "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, " ")
        .replace(/\/\/[^\n]*/g, " ")
        .replace(/\{\/\*[\s\S]*?\*\/\}/g, " ");
      for (const pattern of [
        /signInWithOtp|signInWithPassword|signInWithOAuth/,
        /createServerClient|createBrowserClient/,
        /from\s*\(\s*["'](?:profiles|plans|users)["']\s*\)/,
        /@supabase\//,
      ]) {
        if (pattern.test(src)) offenders.push(`${file.slice(ROOT.length)} (${pattern.source.slice(0, 40)})`);
      }
    }
    expect(
      offenders,
      "sign-in or database code is back in the source; comments are stripped before this check, so this is shipped code"
    ).toEqual([]);
  });

  it("leaves no user-facing page still describing the sign-in", () => {
    /* The removal shipped with SEVEN passages still telling readers there was
     * an account: the privacy notice's short version, its section 3, its cookie
     * section, the terms' data and third-party clauses, the about page and a
     * FAQ. Every structural test passed, because they check DATA — the tables
     * and the processor list — and this was PROSE.
     *
     * That is the wrong way round for a privacy notice. Section 29 is about
     * what the reader is told, and the reader reads the sentences. A notice
     * that over-discloses is not harmlessly cautious either: it names a
     * processor that receives nothing and describes collection that does not
     * happen, which is exactly the inaccuracy the original rebuild set out to
     * remove, pointing the other way. */
    const pages = [
      "app/privacy/page.tsx",
      "app/terms/page.tsx",
      "app/about/page.tsx",
      "lib/faqs.ts",
    ];
    const offenders: string[] = [];
    for (const rel of pages) {
      const raw = readFileSync(`${ROOT}${rel}`, "utf8");
      /* Comments stripped: these files explain WHY sign-in went, and that
       * explanation must not be able to trip the check on what they say. */
      const prose = raw
        .replace(/\/\*[\s\S]*?\*\//g, " ")
        .replace(/\{\/\*[\s\S]*?\*\/\}/g, " ")
        .replace(/\/\/[^\n]*/g, " ");
      /* Anchored to PRESENT-TENSE assertions. The first draft flagged the
       * privacy notice's own history — "Until July 2026 there WAS an optional
       * sign-in — an emailed link" — which is the sentence a reader who
       * remembers the old notice needs, and which this file argued for keeping.
       * A guard that forbids explaining a removal pushes the next person to
       * delete the explanation instead of the feature. */
      for (const claim of [
        /\b(?:requires|needs)\s+an\s+email address/i,
        /\b(?:has|have|offers?|provides?|includes?)\s+an?\s+optional sign-in/i,
        /\bif you sign in\b/i,
        /\b(?:uses|sends you)\s+an\s+emailed link/i,
        /\bsign in to (?:save|sync)/i,
      ]) {
        const hit = prose.match(claim);
        if (hit) offenders.push(`${rel}: "${hit[0]}"`);
      }
    }
    expect(
      offenders,
      "these pages still describe a sign-in that no longer exists"
    ).toEqual([]);
  });

  it("keeps the privacy notice agreeing that there is nothing to disclose", () => {
    /* Both directions matter. Code without a disclosure is an undisclosed
     * processing operation; a disclosure without code names a processor that
     * receives nothing. Section 29 is unhappy either way. */
    expect(ONLY_IF_YOU_SIGN_IN, "a sign-in disclosure exists but no sign-in does").toEqual([]);
    expect(
      PROCESSORS.map((p) => p.name).join(" ").toLowerCase(),
      "a database processor is named again"
    ).not.toMatch(/supabase|firebase|clerk|planetscale|mongo/);
  });

  it("catches an auth SDK when one is introduced", () => {
    /* Mutation check in both directions: the list has to actually match a real
     * package name, and not match something innocuous. */
    expect(BACKEND_SDKS).toContain("@supabase/supabase-js");
    expect(BACKEND_SDKS).not.toContain("next");
    expect("@supabase/supabase-js" in deps, "supabase is installed").toBe(false);
    expect("next" in deps, "next should still be a dependency").toBe(true);
  });
});
