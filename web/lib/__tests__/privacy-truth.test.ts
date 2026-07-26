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
const claude = read("lib/claude.ts");
const sync = read("lib/supabase/sync.ts");
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
   * The teeth. If anyone puts the name back into the AI prompt, the notice
   * saying it is excluded becomes a lie — and this fails first.
   */
  it("does not send the reader's name to the AI, as section 2 of the notice claims", () => {
    expect(claude).not.toMatch(/Name:\s*\$\{profile\.fullName\}/);
    expect(claude).not.toMatch(/\$\{profile\.fullName\}/);
    const aiDisclosure = SENT_FOR_THE_AI_PLAN.map((d) => d.what).join(" ").toLowerCase();
    expect(aiDisclosure).not.toContain("name");
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

  it("admits the sign-in exists, because the product offers one", () => {
    // SaveMyPlan sends a magic link. A notice claiming "no login" is false.
    expect(saveMyPlan).toMatch(/signInWithOtp/);
    const signIn = ONLY_IF_YOU_SIGN_IN.map((d) => `${d.what} ${d.purpose}`).join(" ").toLowerCase();
    expect(signIn).toMatch(/email/);
    expect(pageProse).not.toMatch(/no accounts, no registration, no login/i);
    expect(pageProse).not.toMatch(/does not collect, store, or transmit any personal/i);
  });

  it("discloses everything the Supabase sync writes", () => {
    // Read the actual upsert, not a memory of it.
    const upserted = [...sync.matchAll(/^\s{4}(\w+):/gm)].map((m) => m[1]);
    expect(upserted.length).toBeGreaterThan(3);
    const signIn = ONLY_IF_YOU_SIGN_IN.map((d) => d.what).join(" ").toLowerCase();
    for (const field of ["full_name", "age", "county", "gross_monthly_salary", "dependants"]) {
      if (!upserted.includes(field)) continue;
      const word = field.replace("full_name", "name").replace("gross_monthly_salary", "salary");
      expect(signIn, `Supabase stores ${field} but the notice does not say so`).toMatch(
        new RegExp(word.split("_")[0]),
      );
    }
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
    for (const name of ["Netlify", "Anthropic", "Supabase"]) {
      expect(PROCESSORS.map((p) => p.name)).toContain(name);
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
