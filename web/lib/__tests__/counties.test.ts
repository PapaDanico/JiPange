/**
 * `counties.ts` is a list of strings, which is why it sat uncovered — there is
 * no logic to exercise. But it is spread into a zod enum in `types.ts` and
 * rendered as a `<datalist>` in `ProfileForm`, and the county input is free
 * text, not a select. So the list is a validation boundary that a user types
 * against by hand, and the interesting failures are at the seam rather than in
 * the data:
 *
 *   - a name that drifts from what the datalist offers rejects a real county,
 *   - and a typo has to produce an error a person can act on.
 *
 * The second one was broken when these tests were written; see the message
 * length assertion below.
 */
import { describe, it, expect } from "vitest";
import { KENYA_COUNTIES } from "../counties";
import { profileSchema } from "../types";

const county = profileSchema.shape.county;

describe("the county list", () => {
  it("has all 47 counties", () => {
    // Fixed by the Constitution of Kenya 2010, First Schedule. A 46 here means
    // one was dropped in an edit; 48 means a sub-county crept in.
    expect(KENYA_COUNTIES).toHaveLength(47);
  });

  it("puts Nairobi first, which the form relies on as its default", () => {
    // ProfileForm initialises `county: "Nairobi"`. If the list is ever
    // re-sorted alphabetically, that default silently stops being the head.
    expect(KENYA_COUNTIES[0]).toBe("Nairobi");
  });

  it("has no duplicates", () => {
    expect(new Set(KENYA_COUNTIES).size).toBe(KENYA_COUNTIES.length);
  });

  it("has no stray whitespace or empty entries", () => {
    // A trailing space is invisible in the datalist but makes the value
    // unmatchable against anything the user types.
    for (const c of KENYA_COUNTIES) {
      expect(c).toBe(c.trim());
      expect(c.length).toBeGreaterThan(0);
    }
  });

  it("keeps the punctuation the official names carry", () => {
    // Murang'a's apostrophe and the hyphens are part of the names. Stripping
    // them to "simplify" would break the match against the datalist value.
    expect(KENYA_COUNTIES).toContain("Murang'a");
    expect(KENYA_COUNTIES).toContain("Taita-Taveta");
    expect(KENYA_COUNTIES).toContain("Elgeyo-Marakwet");
    expect(KENYA_COUNTIES).toContain("Tharaka-Nithi");
  });
});

describe("the profile schema's county field", () => {
  it("accepts every county the form offers", () => {
    // The list and the enum must not drift: the datalist is built from
    // KENYA_COUNTIES, so anything here that the schema rejects is an option a
    // user can pick and then be told is invalid.
    const rejected = KENYA_COUNTIES.filter((c) => !county.safeParse(c).success);
    expect(rejected).toEqual([]);
  });

  it("rejects something that is not a county", () => {
    expect(county.safeParse("Kampala").success).toBe(false);
    expect(county.safeParse("").success).toBe(false);
  });

  it("is case- and whitespace-exact, matching the datalist values", () => {
    // Recorded rather than asserted as desirable: the input does not normalise,
    // so "nairobi" fails. If that is ever softened, this test should change
    // alongside the form, not be deleted.
    expect(county.safeParse("nairobi").success).toBe(false);
    expect(county.safeParse("Nairobi ").success).toBe(false);
  });

  it("explains a typo in one short line instead of listing all 47 counties", () => {
    // Zod's default enum message is `expected one of "Nairobi"|"Mombasa"|...`
    // — 508 characters, rendered inline under the input. The county field is
    // free text with a datalist, so typos are the expected failure, not an
    // edge case, and this is what the user reads when they make one.
    const issue = county.safeParse("Nairobo");
    expect(issue.success).toBe(false);
    if (issue.success) return;
    const message = issue.error.issues[0].message;
    expect(message).toBe("Choose a county from the list");
    expect(message.length).toBeLessThan(80);
  });
});
