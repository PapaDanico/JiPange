import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { inflationBaskets, currentInflation } from "../rates-feed";

/**
 * The caveat that has to survive a schema the snapshot has not caught up with.
 *
 * Mwangaza added the core / non-core split after schema 1 shipped, additively,
 * so the version did not move — which is the published contract working
 * exactly as it promises. The consequence here is that a snapshot synced
 * before that change carries neither field, and this app must handle that as a
 * NORMAL state rather than an error.
 *
 * That is the interesting case, and it is the one live today: at the time of
 * writing the shipped snapshot predates the split, so `inflationBaskets()`
 * returns null and the caveat does not render. The tests below therefore
 * cannot assert on real values — they assert on the CONTRACT, and separately
 * that the UI is wired to show the thing whenever it does arrive.
 */
const ROOT = new URL("../../", import.meta.url).pathname;
const read = (p: string) => readFileSync(`${ROOT}${p}`, "utf8");

describe("the inflation basket split", () => {
  it("is null or complete, never partial", () => {
    /* "Core inflation is 3.2%" without the other number beside it reads as
     * reassurance, and it is the half a reader would most like to believe. */
    const b = inflationBaskets();
    if (b === null) return; // the honest state before the next sync
    for (const v of [b.headline, b.core, b.nonCore]) {
      expect(Number.isFinite(v)).toBe(true);
    }
    expect(b.date).toMatch(/^\d{4}-\d{2}-\d{2}/);
    expect(b.source).toBeTruthy();
  });

  it("agrees with the headline the rest of the app deflates by", () => {
    /* currentInflation() returns a fraction; the baskets are percentages. If
     * these ever disagree, one page is deflating by a different number than
     * the page beside it — the defect this whole session has been deleting. */
    const b = inflationBaskets();
    if (b === null) return;
    expect(b.headline / 100).toBeCloseTo(currentInflation(), 10);
  });

  it("keeps the headline between the two baskets", () => {
    /* It is a weighted average of them, so anything else means one of the
     * three figures is wrong or they are from different months. */
    const b = inflationBaskets();
    if (b === null) return;
    expect(b.headline).toBeGreaterThanOrEqual(Math.min(b.core, b.nonCore));
    expect(b.headline).toBeLessThanOrEqual(Math.max(b.core, b.nonCore));
  });

  it("does not throw when the snapshot predates the fields", () => {
    /* The whole point of an additive field. A consumer that treats a missing
     * optional as an error has turned the publisher's compatibility promise
     * into an outage. */
    expect(() => inflationBaskets()).not.toThrow();
  });

  it("is wired into the retirement tool, ready for when it arrives", () => {
    /* The failure this codebase keeps finding: a derivative computed, tested,
     * and rendered nowhere. Here it is sharper than usual, because the feature
     * is INVISIBLE today — the split is absent, so no amount of clicking
     * through the app would reveal that it was never wired up. Only a source
     * check catches that before the sync makes it live. */
    const ui = read("components/tools/FireNumberCalculator.tsx");
    expect(ui, "the split is never read").toContain("inflationBaskets");
    const body = ui.slice(ui.indexOf("export default function"));
    expect(body, "read but never rendered").toMatch(/baskets\.nonCore/);
    expect(body).toMatch(/baskets\.core/);
    expect(body, "rendered without guarding on absence").toMatch(/\{baskets\s*&&/);
  });

  it("states the relationship without inventing a personal rate", () => {
    /* Estimating a household's own inflation needs spending shares this app
     * does not hold. A fabricated figure would carry false precision and look
     * authoritative, which is worse than the headline it replaced. The copy
     * must describe the direction, not compute a number. */
    const ui = read("components/tools/FireNumberCalculator.tsx");
    expect(ui, "the one-for-one relationship is not explained").toMatch(/one for one/i);
    expect(
      ui,
      "appears to compute the reader's own inflation rate"
    ).not.toMatch(/your inflation is|personalInflation|yourCpi/i);
  });
});
