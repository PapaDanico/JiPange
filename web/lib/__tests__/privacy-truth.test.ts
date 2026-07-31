import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import {
  COLLECTED_BY_HOSTING,
  DEVICE_ONLY,
  DPA_RIGHTS,
  ODPC,
  ONLY_IF_YOU_SIGN_IN,
  PROCESSORS,
  SENT_FOR_THE_AI_PLAN,
} from "@/lib/privacy-facts";
import { profileSchema } from "@/lib/types";

/**
 * Does the privacy notice describe this product, or a nicer one?
 *
 * The notice this replaced said "JiPange does not collect, store, or transmit
 * any personal information… no accounts, no registration, no login… We do not
 * collect your name, email address". At the same time /profile/full asked for a
 * full name, SaveMyPlan asked for an email and sent a magic link, and the
 * policy credited Simple Analytics, which was never installed.
 *
 * Nobody wrote those falsehoods on purpose. They were true once and the product
 * grew past them, which is exactly how a privacy notice fails: silently, in the
 * direction that flatters. Kenya's Data Protection Act, 2019 makes accurate
 * notification a duty (s.29), so these tests read the SOURCE and check the
 * claims against it.
 */

const read = (p: string) => readFileSync(`${process.cwd()}/${p}`, "utf8");
const nativePlan = read("lib/native-plan.ts");
const actionPlanUi = read("components/onboarding/ActionPlan.tsx");
const goalPlannerUi = read("components/planners/GoalPlanner.tsx");
const saveMyPlan = read("components/onboarding/SaveMyPlan.tsx");
const page = read("app/privacy/page.tsx");
/**
 * The page with its block comments removed.
 *
 * The first version of the "no uninstalled analytics" check failed on the
 * page's OWN doc comment, which explains that the previous notice credited
 * Simple Analytics. Recording why something was removed is worth keeping; what
 * must not survive is a credit rendered to the reader. So claims about what the
 * page SAYS are checked against the prose, not the file.
 */
const pageProse = page.replace(/\/\*[\s\S]*?\*\//g, "");

describe("the claims that were false are now checked against the code", () => {
  /**
   * The teeth, upgraded. The old test proved the AI prompt excluded the
   * reader's name; the plan is now generated on the device and the notice says
   * the figures go NOWHERE. So the check is stronger: the plan path must make
   * no network call at all. If anyone wires a fetch back into it, the notice
   * becomes a lie — and this fails first.
   */
  it("the plan is computed on-device: no network call anywhere in the path, as section 2 claims", () => {
    for (const [name, src] of [
      ["lib/native-plan.ts", nativePlan],
      ["components/onboarding/ActionPlan.tsx", actionPlanUi],
    ] as const) {
      expect(src, `${name} must not fetch — the notice says nothing leaves the device`).not.toMatch(
        /fetch\s*\(|XMLHttpRequest|axios/
      );
    }
    // GoalPlanner keeps unrelated code; only the strategy must not travel.
    expect(goalPlannerUi).not.toMatch(/api\/goal-strategy|api\/generate-plan/);
    expect(nativePlan).not.toMatch(/fullName/);
    const aiDisclosure = SENT_FOR_THE_AI_PLAN.map((d) => d.destination).join(" ").toLowerCase();
    expect(aiDisclosure).toContain("nowhere");
  });

  it("discloses every profile field the form actually collects", () => {
    // Whatever the schema accepts is what a reader hands over. Each field must
    // appear in one of the disclosure groups, or the notice is incomplete.
    const fields = Object.keys(profileSchema.shape);
    const disclosed = [...DEVICE_ONLY, ...SENT_FOR_THE_AI_PLAN, ...ONLY_IF_YOU_SIGN_IN]
      .map((d) => `${d.what} ${d.purpose}`)
      .join(" ")
      .toLowerCase();
    const words: Record<string, RegExp> = {
      fullName: /name/,
      age: /age/,
      county: /county/,
      grossMonthlySalary: /salary/,
      dependants: /dependant/,
      chamaMember: /chama/,
    };
    for (const f of fields) {
      expect(words[f], `no disclosure pattern for new profile field "${f}"`).toBeDefined();
      expect(disclosed, `profile field "${f}" is collected but not disclosed`).toMatch(words[f]);
    }
  });

  it("offers no sign-in at all, which is what makes the notice true", () => {
    /* This assertion is INVERTED from what it used to be. It once required the
     * notice to ADMIT a sign-in, because SaveMyPlan sent a magic link and a
     * notice claiming "no login" would have been false.
     *
     * The sign-in was removed in July 2026: the Registration Regulations 2021
     * disapply the small-operator exemption for Third Schedule purposes, which
     * include "provision of financial services", and the surest answer to an
     * arguable classification is to hold no personal data at all.
     *
     * So the honest claim flipped, and the guard flips with it. What must not
     * happen is the claim flipping while the code stays — which is the exact
     * failure this whole file was written to catch, in the other direction. */
    expect(saveMyPlan, "SaveMyPlan sends a magic link again").not.toMatch(/signInWithOtp/);
    expect(
      ONLY_IF_YOU_SIGN_IN,
      "a sign-in disclosure exists again; if sign-in came back, so must the code review"
    ).toEqual([]);
    expect(
      PROCESSORS.map((p) => p.name).join(" "),
      "Supabase is a named processor again"
    ).not.toMatch(/supabase/i);
  });

  it("names no analytics provider that is not installed", () => {
    // The old notice credited Simple Analytics. Nothing loads it.
    expect(pageProse).not.toMatch(/Simple Analytics/i);
    const appDir = read("app/layout.tsx");
    expect(appDir).not.toMatch(/simpleanalytics|plausible|google-analytics|gtag/i);
  });
});

describe("it meets the shape section 29 asks for", () => {
  it("states a purpose, a destination and a retention for every item", () => {
    const all = [...DEVICE_ONLY, ...SENT_FOR_THE_AI_PLAN, ...ONLY_IF_YOU_SIGN_IN, ...COLLECTED_BY_HOSTING];
    expect(all.length).toBeGreaterThan(4);
    for (const d of all) {
      expect(d.purpose.length, `${d.what} has no stated purpose`).toBeGreaterThan(15);
      expect(d.destination.length, `${d.what} has no stated destination`).toBeGreaterThan(10);
      expect(d.retention.length, `${d.what} has no stated retention`).toBeGreaterThan(10);
    }
  });

  it("names every third party that can receive data, and where it is", () => {
    // Anthropic left this list when the plan moved on-device, and Supabase left
    // it in July 2026 when the sign-in went: a processor that processes nothing
    // must not be named, for the same s.29 reason a missing one must be.
    expect(PROCESSORS.map((p) => p.name)).toContain("Netlify");
    for (const gone of ["Anthropic", "Supabase"]) {
      expect(
        PROCESSORS.map((p) => p.name),
        `${gone} is named as a processor but receives nothing`
      ).not.toContain(gone);
    }
    // Cross-border transfer is a distinct duty; each must say where it sits.
    for (const p of PROCESSORS) expect(p.where).toBeTruthy();
    expect(page).toMatch(/outside Kenya/);
  });

  it("carries all five rights from section 26", () => {
    const rights = DPA_RIGHTS.map((r) => r.right.toLowerCase()).join(" ");
    for (const r of ["informed", "access", "object", "correction", "deletion"]) {
      expect(rights, `section 26 right "${r}" is missing`).toContain(r);
    }
    for (const r of DPA_RIGHTS) expect(r.whatItMeans.length).toBeGreaterThan(30);
  });

  it("gives the reader the regulator's complaint route", () => {
    expect(ODPC.url).toMatch(/odpc\.go\.ke/);
    expect(page).toContain("ODPC");
    expect(page).toMatch(/complaint/i);
  });

  it("cites the Act rather than gesturing at it", () => {
    expect(page).toMatch(/Data Protection Act, 2019/);
    expect(page).toMatch(/section 29/i);
    expect(page).toMatch(/[Ss]ection 26/);
    expect(page).toMatch(/25\(c\)/); // minimisation, cited where the name was dropped
  });
});

describe("the terms of use do not contradict the privacy notice", () => {
  const terms = read("app/terms/page.tsx").replace(/\/\*[\s\S]*?\*\//g, "");
  const affiliates = read("lib/affiliate-links.ts");

  /**
   * The terms claimed "these links may be affiliate referral links: JiPange may
   * earn a small commission", while every entry in the product directory is
   * isAffiliate: false and both the privacy notice and the FAQ say no such
   * arrangement exists. Three surfaces, two different answers, on a question a
   * reader is entitled to a straight answer about.
   */
  it("describes the affiliate position the product data actually holds", () => {
    const anyAffiliate = /isAffiliate:\s*true/.test(affiliates);
    if (anyAffiliate) {
      expect(terms, "an affiliate link exists but the terms deny it").toMatch(/affiliate/i);
    } else {
      expect(terms).toMatch(/no affiliate arrangement|hold no affiliate/i);
      expect(terms).not.toMatch(/may earn a small commission/i);
    }
  });

  it("does not repeat the retired 'collects no personal data' claim", () => {
    expect(terms).not.toMatch(/does not collect personal data/i);
    expect(terms).not.toMatch(/never sent to our servers/i);
  });

  it("names the same processors the privacy notice names", () => {
    for (const p of PROCESSORS) {
      expect(terms, `${p.name} is a processor but the terms omit it`).toContain(p.name);
    }
  });
});
