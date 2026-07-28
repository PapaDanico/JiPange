import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { PURPOSE, COMMITMENTS, ASK_AFTER_VALUE, PERMITTED_ASK_SURFACES } from "../mission";
import { NEVER_PAID, tierFor, allToolHrefs } from "../tiers";
import { PRODUCT_LINKS } from "../affiliate-links";

const ROOT = new URL("../../", import.meta.url).pathname;
const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : /\.tsx?$/.test(n) ? [p] : [];
  });
const rendered = (p: string) =>
  readFileSync(p, "utf8").replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");

/**
 * Asking THIS PRODUCT'S reader for money — not the word "contribution".
 *
 * The first version of this matched /contribut/ and reported the SHA tool,
 * which discusses statutory health CONTRIBUTIONS, and the savings-goal tool,
 * which has a `totalContributedKES`. Both are the domain vocabulary of a
 * Kenyan personal finance app; a scan that treats them as a defect is a scan
 * somebody will disable.
 *
 * So this matches the specific artefacts of an ask: a link to the support
 * page, or one of the pricing identifiers being read. Those cannot appear by
 * accident and cannot mean anything else.
 */
const ASKS_FOR_MONEY =
  /href=["']\/support["']|SUPPORT_NARRATIVE|SUGGESTED_DOCUMENT_KES|PAY_WHAT_YOU_CAN|pay what you can/i;

describe("the mission is stated once", () => {
  it("has a purpose short enough to be remembered", () => {
    expect(PURPOSE.length).toBeGreaterThan(40);
    expect(PURPOSE.length).toBeLessThan(220);
  });

  it("names where each commitment is enforced", () => {
    expect(COMMITMENTS.length).toBeGreaterThanOrEqual(5);
    for (const c of COMMITMENTS) {
      expect(c.promise.length, `${c.id} has no promise`).toBeGreaterThan(30);
      // A commitment with no named enforcement point is a slogan.
      expect(c.enforcedBy, `${c.id} names no enforcement`).toMatch(/lib\/|components\//);
    }
  });
});

/**
 * The promises, checked against the code that is supposed to keep them.
 *
 * This is the whole point of the module. Anyone can write "the tools are
 * free" on a page; these assertions fail if it stops being true.
 */
describe("the product does what the mission says", () => {
  it("keeps every answer free — 'answers-are-free'", () => {
    for (const href of allToolHrefs()) {
      expect(tierFor("compute", href)).toBe("free");
    }
  });

  it("keeps the protected tools protected — 'protected-tools'", () => {
    expect(NEVER_PAID.length).toBeGreaterThan(0);
    for (const href of NEVER_PAID) {
      expect(tierFor("export-document", href)).toBe("free");
    }
  });

  it("takes no commission — 'no-commission'", () => {
    // The same fact the product directory asserts. If the two ever disagree,
    // one page is telling the reader something the other contradicts.
    expect(PRODUCT_LINKS.filter((p) => p.isAffiliate)).toEqual([]);
  });
});

/**
 * THE ASK NEVER PRECEDES THE VALUE.
 *
 * The rule that separates a product which asks from one which nags. It matters
 * more than the revenue: the whole proposition is that the reader is being
 * helped rather than harvested, and a paywall shaped like a helpful suggestion
 * undoes that in a single impression.
 */
describe("money is never asked for before something has been given", () => {
  const files = [...walk(join(ROOT, "app")), ...walk(join(ROOT, "components"))];

  it("scans a real set of files", () => {
    expect(files.length).toBeGreaterThan(20);
  });

  it("has no modal, overlay or interstitial mentioning a contribution", () => {
    const offenders = files.filter((f) => {
      const src = rendered(f);
      const mentionsMoney = ASKS_FOR_MONEY.test(src);
      if (!mentionsMoney) return false;
      // The shapes that put an ask in front of a reader who did not go looking.
      return /role=["']dialog["']|fixed inset-0|z-\[?9\d{2}|backdrop-blur.*fixed/i.test(src);
    });
    expect(
      offenders,
      "a contribution is being shown in an overlay. It may sit BESIDE a result, never over it:\n" +
        offenders.join("\n")
    ).toEqual([]);
  });

  it("mentions contributions only on permitted surfaces", () => {
    expect(ASK_AFTER_VALUE).toBe(true);
    const asking = files.filter((f) => ASKS_FOR_MONEY.test(rendered(f)));
    for (const f of asking) {
      const rel = f.replace(ROOT, "");
      const permitted =
        rel.includes("app/support/") ||
        rel.includes("app/privacy/") || // a disclosure, not a solicitation
        // Addressed to institutions, not readers: it explains who pays so that
        // the reader does not have to. Not an ask in the sense this guards.
        rel.includes("app/licensing/") ||
        rel.includes("Footer") ||
        rel.includes("ExportCardButton") ||
        rel.includes("ContributionNote");
      expect(
        permitted,
        `${rel} mentions a contribution but is not one of: ${PERMITTED_ASK_SURFACES.join(", ")}`
      ).toBe(true);
    }
  });

  it("puts nothing about money on a calculator page itself", () => {
    // A tool page is where somebody is mid-problem. It is the one place an ask
    // is guaranteed to interrupt rather than follow.
    const toolPages = walk(join(ROOT, "app/tools")).filter((f) => f.endsWith("page.tsx"));
    expect(toolPages.length).toBeGreaterThan(20);
    const offenders = toolPages.filter((f) => ASKS_FOR_MONEY.test(rendered(f)));
    expect(offenders, `these tool pages ask for money:\n${offenders.join("\n")}`).toEqual([]);
  });
});
