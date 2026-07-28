import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  TIERS,
  NEVER_PAID,
  CAPABILITY_TIER,
  PLAN_LIMITS,
  SUPPORT_NARRATIVE,
  tierFor,
  isPaid,
  tierSpec,
  allToolHrefs,
  type Capability,
  type Tier,
} from "../tiers";
import { TOOL_META } from "../tool-meta";

const CAPABILITIES = Object.keys(CAPABILITY_TIER) as Capability[];

describe("the tier taxonomy", () => {
  it("has the four tiers, cheapest first", () => {
    expect(TIERS.map((t) => t.id)).toEqual(["free", "document", "mpango", "institution"]);
  });

  it("prices rise with the tier", () => {
    const priced = TIERS.filter((t) => t.priceKES !== null).map((t) => t.priceKES!);
    expect([...priced].sort((a, b) => a - b)).toEqual(priced);
  });

  it("describes every tier well enough to publish", () => {
    for (const t of TIERS) {
      expect(t.name.length, `${t.id} has no name`).toBeGreaterThan(2);
      expect(t.summary.length, `${t.id} has no summary`).toBeGreaterThan(20);
      expect(t.includes.length, `${t.id} lists nothing`).toBeGreaterThan(2);
    }
  });

  it("keeps the free tier genuinely free", () => {
    expect(tierSpec("free").priceKES).toBe(0);
  });
});

/**
 * The protected list is the load-bearing part of this file.
 *
 * Everything else is a pricing preference. This is the promise, and a promise
 * that lives only in marketing copy is one nobody notices being broken. These
 * assertions are what make the sentence on the support page true.
 */
describe("the tools that may never be sold", () => {
  it("names the five, and they are real tools", () => {
    expect(NEVER_PAID.length).toBe(5);
    for (const href of NEVER_PAID) {
      expect(TOOL_META[href as keyof typeof TOOL_META], `${href} is not a real tool`).toBeTruthy();
    }
  });

  it("returns free for EVERY capability on a protected tool", () => {
    // Not just documents. If a reminder or a household view ever costs money,
    // the promise is broken just as surely.
    for (const href of NEVER_PAID) {
      for (const cap of CAPABILITIES) {
        expect(tierFor(cap, href), `${cap} on ${href} is not free`).toBe("free");
        expect(isPaid(cap, href), `${cap} on ${href} is billable`).toBe(false);
      }
    }
  });

  it("still charges for the same capabilities on unprotected tools", () => {
    // The mutation check. Without this, a `tierFor` that returned "free" for
    // everything would satisfy every assertion above and quietly delete the
    // business model while looking maximally principled.
    expect(tierFor("export-document", "/tools/school-fees-lifetime")).toBe("document");
    expect(isPaid("export-document", "/tools/school-fees-lifetime")).toBe(true);
    expect(tierFor("reminders", "/tools/savings-goal")).toBe("mpango");
  });

  it("protects the tools whose readers are least able to pay", () => {
    // Named individually, so removing one is a deliberate act with a failing
    // test attached rather than a quiet edit to an array.
    expect(NEVER_PAID).toContain("/tools/fuliza-cost");
    expect(NEVER_PAID).toContain("/tools/guarantor-shield");
    expect(NEVER_PAID).toContain("/tools/debt-escape");
    expect(NEVER_PAID).toContain("/tools/one-third-rule");
    expect(NEVER_PAID).toContain("/tools/sha-health");
  });
});

describe("what free always includes", () => {
  it("never charges for the answer itself, on any tool", () => {
    // The line the whole taxonomy rests on. If `compute` is ever billable,
    // this stops being a calculator that sells documents and becomes a
    // platform selling financial advice — which is a licensed activity here.
    for (const href of allToolHrefs()) {
      expect(tierFor("compute", href), `compute is billable on ${href}`).toBe("free");
    }
    expect(CAPABILITY_TIER.compute).toBe("free");
  });

  it("never charges for the shareable image", () => {
    // It is the growth loop. Charging for the thing that spreads the product,
    // in order to fund the product, is a circle that does not close.
    expect(CAPABILITY_TIER["share-image"]).toBe("free");
    for (const href of allToolHrefs()) {
      expect(isPaid("share-image", href)).toBe(false);
    }
  });

  it("allows at least one saved plan without paying", () => {
    expect(PLAN_LIMITS.free).toBeGreaterThanOrEqual(1);
    expect(PLAN_LIMITS.mpango).toBe(Infinity);
  });
});

describe("the categorisation is complete", () => {
  it("covers every tool the app ships", () => {
    // A tool added later with no thought about where it sits would otherwise
    // default silently to whatever CAPABILITY_TIER says, including for tools
    // that belong on the protected list.
    const hrefs = allToolHrefs();
    expect(hrefs.length, "found no tools — this guard would be vacuous").toBeGreaterThan(20);
    for (const href of hrefs) {
      for (const cap of CAPABILITIES) {
        const t = tierFor(cap, href);
        expect(TIERS.map((x) => x.id), `${cap} on ${href} resolved to ${t}`).toContain(t);
      }
    }
  });

  it("assigns every capability to a tier that exists", () => {
    const ids = TIERS.map((t) => t.id) as Tier[];
    for (const cap of CAPABILITIES) {
      expect(ids, `${cap} points at a tier that does not exist`).toContain(CAPABILITY_TIER[cap]);
    }
  });
});

/**
 * The copy must agree with the rules.
 *
 * This project keeps finding the same defect in a new costume: a number typed
 * into prose beside a constant that says something else. A pricing page is the
 * worst possible place for it, because the reader is being asked to hand over
 * money on the strength of the sentence.
 */
describe("the narrative matches the configuration", () => {
  it("promises exactly as many protected tools as are protected", () => {
    const said = SUPPORT_NARRATIVE.protectedHeading.match(/\b(five|four|three|six|seven)\b/i);
    expect(said, "the heading no longer states a count").toBeTruthy();
    const words: Record<string, number> = { three: 3, four: 4, five: 5, six: 6, seven: 7 };
    expect(words[said![1].toLowerCase()]).toBe(NEVER_PAID.length);
  });

  it("says the tools are free without hedging it", () => {
    expect(SUPPORT_NARRATIVE.lead).toMatch(/free/i);
    expect(SUPPORT_NARRATIVE.lead).toMatch(/not a trial/i);
  });

  it("still states the no-commission position", () => {
    // The product directory asserts the same thing in code. If one changes and
    // the other does not, the reader is being told two different things.
    expect(SUPPORT_NARRATIVE.closing).toMatch(/no commission/i);
  });

  it("quotes no price as a literal in the prose", () => {
    // Prices live in TIERS. A figure typed into a sentence is one a price
    // change cannot reach — which is how "Ksh 370 billion" survived here for
    // as long as it did.
    const prose = [
      SUPPORT_NARRATIVE.lead,
      ...SUPPORT_NARRATIVE.body,
      SUPPORT_NARRATIVE.protectedLead,
      SUPPORT_NARRATIVE.closing,
    ].join(" ");
    expect(prose, "a shilling figure is written into the narrative").not.toMatch(/Ksh\s*[\d,]+/);
  });
});

/**
 * Nothing is gated yet, and that should be visible.
 *
 * This module is a declaration. Until a payment rail exists and a decision has
 * been taken, no component may withhold anything on the strength of it — a
 * half-wired paywall that blocks a reader while the payment path is still
 * theoretical is the worst of both.
 */
describe("the architecture is not yet enforcing anything", () => {
  const appDir = join(new URL("../../", import.meta.url).pathname, "app");
  const componentsDir = join(new URL("../../", import.meta.url).pathname, "components");

  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) return walk(p);
      return /\.tsx?$/.test(name) ? [p] : [];
    });

  it("has no component withholding a capability behind isPaid", () => {
    const files = [...walk(appDir), ...walk(componentsDir)];
    expect(files.length).toBeGreaterThan(10);
    const gating = files.filter((f) => {
      const src = readFileSync(f, "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, " ")
        .replace(/^\s*\/\/.*$/gm, " ");
      // Reading the tier to LABEL something is fine. Branching on isPaid to
      // hide it is the thing that must wait for a decision.
      return /if\s*\(\s*isPaid\(/.test(src) || /isPaid\([^)]*\)\s*\?/.test(src);
    });
    expect(
      gating,
      "a component is gating on isPaid, but no payment path exists yet:\n" + gating.join("\n")
    ).toEqual([]);
  });
});

/**
 * The cross-links have to point somewhere, and not at themselves.
 *
 * A self-reference is what a careless find-and-replace leaves behind: retiring
 * /tools/education-savings meant repointing every mention of it, and one of
 * those mentions was inside school-fees-lifetime's own `related` list — which
 * turned into a card inviting the reader to visit the page they are already
 * on. Nothing crashes, no test noticed, and it looks exactly like a link.
 */
describe("tool cross-links", () => {
  it("never lists a tool as related to itself", () => {
    const offenders = Object.entries(TOOL_META)
      .filter(([href, meta]) => (meta.related ?? []).includes(href as never))
      .map(([href]) => href);
    expect(offenders, `these link to themselves:\n${offenders.join("\n")}`).toEqual([]);
  });

  it("points every related link and next move at something that exists", () => {
    const known = new Set(Object.keys(TOOL_META));
    const dangling: string[] = [];
    for (const [href, meta] of Object.entries(TOOL_META)) {
      for (const r of meta.related ?? []) {
        // Planners live outside TOOL_META; they are checked by the route tests.
        if (!known.has(r) && !r.startsWith("/planners")) dangling.push(`${href} -> ${r}`);
      }
      const next = meta.nextMove?.href;
      if (next && !known.has(next) && !next.startsWith("/planners")) {
        dangling.push(`${href} -> ${next} (nextMove)`);
      }
    }
    expect(dangling, `broken cross-links:\n${dangling.join("\n")}`).toEqual([]);
  });
});
