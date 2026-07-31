import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { PESA_SMART_CHANNEL, PESA_SMART_NAME } from "../channel";

/**
 * Where the WhatsApp channel may be offered, and what it may claim.
 *
 * THE PLACEMENT RULE, AND WHY IT NEEDS ITS OWN TEST
 *
 * mission.ts says the ask never precedes the value, and mission.test.ts
 * enforces it — against MONEY. Its pattern matches the support link, the
 * suggested amount, the pay-what-you-can wording. A "follow us" prompt matches
 * none of them, so the existing guard would let one be dropped onto the
 * landing page, into a modal, in front of a reader who has been given nothing.
 *
 * That is a gap in the guard, not permission. Asking for somebody's attention
 * before helping them is the same move as asking for their money, at a lower
 * price. So the same discipline is written down here for the same reason.
 *
 * WHAT IT MAY CLAIM
 *
 * Not personalisation. Every figure in this product is worked out in the
 * reader's browser and never reaches us — the privacy notice says so, and the
 * whole architecture depends on it. "Get your plan on WhatsApp" is the obvious
 * next feature somebody writes, and it cannot be built without collecting the
 * thing we promise not to collect.
 */
const ROOT = new URL("../../", import.meta.url).pathname;

const walk = (dir: string): string[] => {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".next") continue;
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (/\.(tsx?|mdx?)$/.test(p) && !p.includes("__tests__")) out.push(p);
  }
  return out;
};

/** Strip comments, so the note explaining the rule never trips the rule. */
const rendered = (file: string): string =>
  readFileSync(file, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/^\s*\/\/.*$/gm, " ")
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, " ");

const surfaces = (): string[] =>
  [...walk(join(ROOT, "app")), ...walk(join(ROOT, "components"))].filter((f) =>
    /PESA_SMART_CHANNEL/.test(rendered(f))
  );

describe("the WhatsApp channel is offered on the right surfaces", () => {
  it("scans a real set of files and finds the channel somewhere", () => {
    // Both halves matter. An empty file list passes every check below
    // forever, and a channel nothing links to is not shipped.
    expect(walk(join(ROOT, "app")).length).toBeGreaterThan(20);
    expect(surfaces().length, "nothing links the channel").toBeGreaterThan(0);
  });

  it("appears only after value, or somewhere permanent and quiet", () => {
    /* The same shape as PERMITTED_ASK_SURFACES in mission.ts: the footer,
     * which nobody is steered into, and a place where the product has already
     * produced something. Extending this list is a decision to make
     * deliberately, not by adding a file and re-running the suite. */
    /* Only surfaces that actually carry the link. "ExportCardButton" was on
     * this list and did not link the channel — a pre-authorised surface nobody
     * had reviewed, which is how an allow-list quietly stops being one. Add an
     * entry when the placement is made, not in anticipation of it. */
    const PERMITTED = ["Footer", "JourneyActionPlan", "app/privacy/"];
    for (const f of surfaces()) {
      const rel = f.replace(ROOT, "");
      expect(
        PERMITTED.some((p) => rel.includes(p)),
        `${rel} offers the channel before the reader has been given anything. ` +
          `Permitted: ${PERMITTED.join(", ")}`
      ).toBe(true);
    }
  });

  it("is never put in a modal or interstitial", () => {
    // Beside the work, never over it — the rule the money guard applies to
    // contributions, applied to attention.
    for (const f of surfaces()) {
      const src = rendered(f);
      expect(
        /role=["']dialog["']|fixed inset-0|z-\[?9\d{2}/i.test(src),
        `${f.replace(ROOT, "")} shows the channel in an overlay`
      ).toBe(false);
    }
  });

  it("never claims to send the reader their own numbers", () => {
    const FORBIDDEN = [
      /\b(your|their)\s+(plan|budget|goal|numbers?|results?)\b[^.]{0,70}\bwhatsapp\b/i,
      /\bwhatsapp\b[^.]{0,70}\b(your|their)\s+(plan|budget|goal|numbers?|results?)\b/i,
    ];
    for (const f of surfaces()) {
      const src = rendered(f);
      for (const pattern of FORBIDDEN) {
        expect(
          src.match(pattern)?.[0],
          `${f.replace(ROOT, "")}: everything here is worked out in the browser and never reaches us, so no channel can carry it`
        ).toBeUndefined();
      }
    }
  });

  it("names itself, and is disclosed in the privacy notice", () => {
    expect(PESA_SMART_CHANNEL).toMatch(/^https:\/\/whatsapp\.com\/channel\/[A-Za-z0-9]+$/);
    const privacy = readFileSync(join(ROOT, "app/privacy/page.tsx"), "utf8");
    expect(privacy).toContain(PESA_SMART_NAME);
    expect(
      privacy,
      "the notice should say we cannot see who follows — the reason this route costs the reader nothing"
    ).toMatch(/does not show\s+channel admins/i);
  });
});
