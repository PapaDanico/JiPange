import { describe, expect, it } from "vitest";
import { buildShareLink, readShareParams, shareableUrl } from "../share-link";

/**
 * A URL is the most obviously untrusted input this app takes: anyone can edit
 * one and forward it. So these tests care less about the happy round-trip than
 * about what happens when the link has been tampered with.
 */

const FIELDS = ["target", "years", "currentSavings", "annualReturn"] as const;

describe("buildShareLink", () => {
  it("carries the sender's scenario", () => {
    expect(
      buildShareLink("/tools/savings-goal", { target: 500000, years: 5, annualReturn: 10 })
    ).toBe("/tools/savings-goal?target=500000&years=5&annualReturn=10");
  });

  it("returns a bare path when nothing survives, rather than a dangling '?'", () => {
    expect(buildShareLink("/tools/savings-goal", {})).toBe("/tools/savings-goal");
    expect(buildShareLink("/tools/savings-goal", { target: 0, years: -3 })).toBe(
      "/tools/savings-goal"
    );
  });

  /* A link is read by PEOPLE as well as machines. "target=NaN" in a WhatsApp
   * message costs more trust than a missing field does. */
  it("omits junk instead of serialising it", () => {
    const link = buildShareLink("/tools/savings-goal", {
      target: NaN,
      years: Infinity,
      currentSavings: 50000,
    });
    expect(link).not.toContain("NaN");
    expect(link).not.toContain("Infinity");
    expect(link).toBe("/tools/savings-goal?currentSavings=50000");
  });

  it("trims the trailing noise off a decimal", () => {
    expect(buildShareLink("/t", { years: 5.0 })).toBe("/t?years=5");
    expect(buildShareLink("/t", { annualReturn: 10.5 })).toBe("/t?annualReturn=10.5");
  });
});

describe("readShareParams", () => {
  it("reads back what buildShareLink wrote", () => {
    const link = buildShareLink("/tools/savings-goal", {
      target: 500000,
      years: 5,
      currentSavings: 20000,
      annualReturn: 10,
    });
    const search = link.slice(link.indexOf("?"));
    expect(readShareParams(search, FIELDS)).toEqual({
      target: "500000",
      years: "5",
      currentSavings: "20000",
      annualReturn: "10",
    });
  });

  it("returns strings, because the fields are controlled text inputs", () => {
    const got = readShareParams("?target=500000", FIELDS);
    expect(typeof got.target).toBe("string");
  });

  /* THE CASE THE WHOLE MODULE IS SHAPED AROUND. `Number("1e400")` is Infinity,
   * truthy and greater than zero, so the `!x || x <= 0` guards this codebase
   * spent the year replacing would have waved it straight through into an
   * engine. positiveAmount is the reason it does not. */
  it("drops a tampered value rather than defaulting it to a guess", () => {
    for (const bad of ["1e400", "-5", "0", "abc", "", "NaN", "Infinity"]) {
      expect(readShareParams(`?target=${encodeURIComponent(bad)}`, FIELDS), bad).toEqual({});
    }
  });

  it("refuses a figure larger than any personal amount", () => {
    expect(readShareParams("?target=999999999999", FIELDS)).toEqual({});
    // And still accepts a large but plausible one.
    expect(readShareParams("?target=50000000", FIELDS)).toEqual({ target: "50000000" });
  });

  it("keeps the good fields when one is tampered with", () => {
    // Losing the whole scenario because one value was edited would be the
    // wrong trade: the rest is still the sender's.
    expect(readShareParams("?target=1e400&years=5", FIELDS)).toEqual({ years: "5" });
  });

  it("ignores fields the calculator did not ask for", () => {
    expect(readShareParams("?target=1000&evil=payload", FIELDS)).toEqual({ target: "1000" });
  });

  it("is empty for a link with no query at all", () => {
    expect(readShareParams("", FIELDS)).toEqual({});
    expect(readShareParams("?", FIELDS)).toEqual({});
  });
});

describe("shareableUrl", () => {
  it("matches the bare-host style the existing messages already use", () => {
    expect(shareableUrl("/tools/savings-goal", { target: 500000, years: 5 })).toBe(
      "jipangefinance.org/tools/savings-goal?target=500000&years=5"
    );
  });

  it("degrades to the plain link when there is nothing to carry", () => {
    expect(shareableUrl("/tools/savings-goal", {})).toBe("jipangefinance.org/tools/savings-goal");
  });
});
