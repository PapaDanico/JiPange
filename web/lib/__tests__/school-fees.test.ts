import { describe, expect, it } from "vitest";
import { mmfFeeSubsidy, termlyMonthlyTarget, SMOOTHER_MMF_RATE } from "../school-fees";

describe("termlyMonthlyTarget", () => {
  it("spreads the annual bill across 12 months per child", () => {
    expect(termlyMonthlyTarget(120_000, 1)).toBeCloseTo(10_000, 5);
    expect(termlyMonthlyTarget(100_000, 2)).toBeCloseTo(16_666.67, 1);
  });

  it("returns 0 for empty inputs", () => {
    expect(termlyMonthlyTarget(0, 2)).toBe(0);
    expect(termlyMonthlyTarget(100_000, 0)).toBe(0);
  });
});

describe("mmfFeeSubsidy", () => {
  it("computes one year of monthly-compounded interest on the contributions", () => {
    // Bounds derived from the rate in force rather than the 6,500-7,200 band
    // that assumed a hardcoded 12%. An annuity of m per month for 12 months at
    // monthly rate i returns m × ((1+i)^12 − 1)/i; the interest is that minus
    // the contributions. Written out so the test checks the compounding, not a
    // remembered answer from a rate environment that has since moved.
    const m = 10_000;
    const i = SMOOTHER_MMF_RATE / 12;
    const expected = m * ((Math.pow(1 + i, 12) - 1) / i) - m * 12;
    const subsidy = mmfFeeSubsidy(120_000, 1);
    expect(subsidy).toBeCloseTo(expected, 0);
  });

  it("scales linearly with children", () => {
    expect(mmfFeeSubsidy(120_000, 2)).toBeCloseTo(mmfFeeSubsidy(120_000, 1) * 2, -1);
  });
});
