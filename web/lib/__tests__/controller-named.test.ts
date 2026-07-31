import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { CONTROLLER } from "../privacy-facts";

/**
 * The privacy notice must name who "we" is.
 *
 * privacy-facts.ts already recorded the gap in its own header — "the
 * controller's registered identity, its ODPC registration status, and the
 * lawful basis relied on are decisions for the operator and its advisers" —
 * and the notice meanwhile said "we" throughout while directing readers to the
 * ODPC. Section 29 of the Data Protection Act, 2019 makes identifying the
 * controller part of the notification duty, and the s.26 rights listed further
 * down are unusable without it: you cannot ask a pronoun for your data.
 *
 * Deliberately NOT asserted: registration number, registered office, ODPC
 * registration status. Those are still being settled and are recorded in
 * CONTROLLER.stillToPublish so their absence stays a decision on the record.
 */
const ROOT = new URL("../../", import.meta.url).pathname;
const PRIVACY = readFileSync(`${ROOT}app/privacy/page.tsx`, "utf8");

/** Comments stripped, so the note explaining the rule cannot satisfy the rule. */
const shipped = PRIVACY.replace(/\{\/\*[\s\S]*?\*\/\}/g, " ").replace(/\/\*[\s\S]*?\*\//g, " ");

describe("the privacy notice identifies its data controller", () => {
  it("has a controller recorded with a usable contact", () => {
    expect(CONTROLLER.name.length).toBeGreaterThan(3);
    expect(CONTROLLER.contact).toMatch(/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i);
  });

  it("renders the controller on the page, not just in the data", () => {
    // A fact nothing renders is a fact nobody reads — the same defect as
    // yieldsAreStale() existing, being unit-tested, and appearing nowhere.
    expect(
      shipped,
      "the notice points readers at the ODPC without saying who they would be complaining about"
    ).toContain("CONTROLLER.name");
    expect(shipped).toContain("CONTROLLER.contact");
  });

  it("keeps the unfinished items visible rather than quietly dropping them", () => {
    /* If this list is emptied, it should be because the facts were published,
     * not because the reminder was tidied away. */
    expect(CONTROLLER.stillToPublish.length).toBeGreaterThan(0);
    expect(CONTROLLER.stillToPublish.join(" ")).toMatch(/registration|office/i);
  });

  it("claims no registration it cannot evidence", () => {
    for (const claim of [
      /ODPC[-\s]registered/i,
      /registered with the Office of the Data Protection/i,
      /registration (?:number|no\.)\s*:?\s*[A-Z0-9]/i,
    ]) {
      expect(
        shipped.match(claim)?.[0],
        "the notice asserts a registration status that has not been established"
      ).toBeUndefined();
    }
  });
});
