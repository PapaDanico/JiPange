import { describe, expect, it } from "vitest";
import { CBC_GRADES, getCbcGrade } from "../cbc-grades";

describe("CBC_GRADES", () => {
  it("has all 14 CBC levels from PP1 through Grade 12", () => {
    expect(CBC_GRADES).toHaveLength(14);
  });

  it("counts down to Junior Secondary and Senior Secondary consistently", () => {
    for (let i = 1; i < CBC_GRADES.length; i++) {
      const prev = CBC_GRADES[i - 1];
      const curr = CBC_GRADES[i];
      expect(curr.yearsToJSS).toBeLessThanOrEqual(prev.yearsToJSS);
      expect(curr.yearsToSSS).toBeLessThanOrEqual(prev.yearsToSSS);
    }
  });

  it("shows 0 years to JSS once a child is already in Junior Secondary", () => {
    expect(getCbcGrade("grade7")?.yearsToJSS).toBe(0);
    expect(getCbcGrade("grade9")?.yearsToJSS).toBe(0);
  });

  it("shows 0 years to SSS once a child is already in Senior Secondary", () => {
    expect(getCbcGrade("grade10")?.yearsToSSS).toBe(0);
    expect(getCbcGrade("grade12")?.yearsToSSS).toBe(0);
  });

  it("PP1 is 8 years from Junior Secondary and 11 from Senior Secondary", () => {
    const pp1 = getCbcGrade("pp1");
    expect(pp1?.yearsToJSS).toBe(8);
    expect(pp1?.yearsToSSS).toBe(11);
  });

  it("returns undefined for an unknown grade value", () => {
    expect(getCbcGrade("grade13")).toBeUndefined();
  });
});
