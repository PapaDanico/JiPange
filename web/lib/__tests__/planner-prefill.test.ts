import { describe, expect, it } from "vitest";
import { educationPrefill } from "../planner-prefill";

describe("educationPrefill (the Njia hand-off)", () => {
  it("fills the fee and years Njia sends, and knows where they came from", () => {
    expect(educationPrefill("?amount=160200&years=1&from=njia")).toEqual({
      amount: "160200",
      years: "1",
      fromNjia: true,
    });
  });

  it("defaults to the next intake when no years are given", () => {
    expect(educationPrefill("?amount=98000")).toEqual({ amount: "98000", years: "1", fromNjia: false });
  });

  it("clamps years into the planner's range", () => {
    expect(educationPrefill("?amount=100000&years=99")?.years).toBe("25");
    expect(educationPrefill("?amount=100000&years=0.2")?.years).toBe("1");
  });

  it("ignores a link without a usable fee", () => {
    for (const q of ["", "?years=3", "?amount=0", "?amount=-5", "?amount=abc", "?amount=1e308"]) {
      expect(educationPrefill(q), q).toBeNull();
    }
  });

  it("treats any other source as unlabelled, and never echoes it", () => {
    expect(educationPrefill("?amount=50000&from=<b>x</b>")?.fromNjia).toBe(false);
  });
});
