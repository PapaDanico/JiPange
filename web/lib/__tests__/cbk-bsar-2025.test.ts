import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  SOURCES,
  cbkDigitalCreditGrowthPct,
  cbkHouseholdNplRatioPct,
  cbkInsuredShareOfDepositsPct,
} from "../sources";
import {
  CBK_AVG_DEPOSIT_RATE_NET_PCT,
  CBK_HOUSEHOLD_NPL_RATIO_PCT,
  CBK_INSURED_SHARE_OF_DEPOSITS_PCT,
  CBK_MORTGAGE_AVG_RATE_PCT,
  CBK_SECTOR_NPL_RATIO_PCT,
} from "../kenya-stats";
import { saccoVsBankInterestSavingKES } from "../tool-stats";
import { calculateLoanAmortization } from "../loans";

/**
 * The CBK Bank Supervision Annual Report 2025, integrated September 2026.
 *
 * These tests pin the figures to the report's OWN arithmetic, not to our
 * transcription of it: where the report prints a total beside its parts, the
 * parts must reproduce it. A mistyped digit in any entry fails one of these
 * rather than reaching a page. The report was read from the PDF (SHA-256
 * 65e4b9c2…6b88); press coverage of it was checked and in two places wrong.
 */

describe("the figures agree with the report's own tables", () => {
  it("customer deposits are Table 17's line, not Table 2's total deposits", () => {
    // 6,384,556 is Table 2 / Appendix VII "total deposits" — what the press
    // quoted as "deposits". Customer deposits are the measure the rest of the
    // registry uses, and Table 17 and Appendix IX agree on it.
    expect(SOURCES.cbkCustomerDepositsMillionKsh.value).toBe(6_119_188);
    expect(SOURCES.cbkCustomerDepositsMillionKsh.value).not.toBe(6_384_556);
  });

  it("the sector NPL ratio reproduces from Table 20's two lines", () => {
    const grossNpl = 696_931;
    const grossLoans = 4_347_164;
    expect(Math.round((grossNpl / grossLoans) * 1000) / 10).toBe(CBK_SECTOR_NPL_RATIO_PCT);
  });

  it("household lending is Table 18's row, which sums with the others to the total", () => {
    // Table 18's gross-loans column, Ksh million, in the printed order.
    const rows = [
      857_832.3, 511_116.3, 584_989.3, 1_176_958.3, 175_519.6, 321_105.5, 197_895.5,
      99_113.8, 142_807.6, 241_698.4, 38_127.5,
    ];
    const total = rows.reduce((a, b) => a + b, 0);
    expect(Math.abs(total - 4_347_164.1)).toBeLessThan(0.5);
    expect(rows).toContain(SOURCES.cbkHouseholdGrossLoansMillionKsh.value);
  });
});

describe("derived figures", () => {
  it("insured deposits are 19.5% of customer deposits", () => {
    expect(cbkInsuredShareOfDepositsPct()).toBeCloseTo(19.54, 2);
    expect(CBK_INSURED_SHARE_OF_DEPOSITS_PCT).toBe(19.5);
  });

  it("households default at well under the sector rate", () => {
    // The coverage said households drive the bad loans. By COUNT of accounts
    // they dominate; by RATE they are the better payers — 9.7% against 16.0%.
    expect(cbkHouseholdNplRatioPct()).toBeCloseTo(9.69, 2);
    expect(CBK_HOUSEHOLD_NPL_RATIO_PCT).toBeLessThan(CBK_SECTOR_NPL_RATIO_PCT);
  });

  it("digital credit growth is what the two printed figures give, not the prose's 99.6%", () => {
    expect(cbkDigitalCreditGrowthPct()).toBeCloseTo(99.46, 2);
  });

  it("the deposit rate after withholding tax is 85% of the gross", () => {
    expect(CBK_AVG_DEPOSIT_RATE_NET_PCT).toBe(6.06);
  });
});

describe("the loan page's SACCO saving is the calculator's own answer", () => {
  it("equals the difference the amortization engine produces", () => {
    const at = (pct: number) =>
      calculateLoanAmortization({ principal: 100_000, annualRate: pct / 100, termMonths: 24 })
        .totalInterest;
    expect(saccoVsBankInterestSavingKES()).toBe(Math.round(at(14.82) - at(12)));
  });

  it("is not the Ksh 12,000 the page used to claim", () => {
    // 12,000 was roughly the SACCO loan's own interest bill (12,976), taken
    // for the saving. At the old 19% bank rate the saving was 8,004.
    expect(saccoVsBankInterestSavingKES()).not.toBe(12_000);
    expect(saccoVsBankInterestSavingKES()).toBeGreaterThan(0);
  });
});

/**
 * No component states a mortgage rate in prose.
 *
 * The home planner's heading said "skip the 14.5% mortgage" for months, with
 * no source anywhere, a point above CBK's measured 13.5%. Same shape as the
 * best-paying-tenor copy that tenor-weights.test.ts now forbids: a claim about
 * the market typed where no test could see it. The rate is data; ask for it.
 */
describe("mortgage rates are data, not prose", () => {
  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const p = join(dir, name);
      if (name === "__tests__") return [];
      if (statSync(p).isDirectory()) return walk(p);
      return /\.tsx$/.test(name) ? [p] : [];
    });

  it("no component types a number beside 'mortgage'", () => {
    const files = [
      ...walk(new URL("../../components", import.meta.url).pathname),
      ...walk(new URL("../../app", import.meta.url).pathname),
    ];
    expect(files.length).toBeGreaterThan(20);
    const offenders = files.flatMap((f) =>
      readFileSync(f, "utf8")
        // Comments may quote the old copy to explain its removal; only what
        // renders is checked. Same stripping as money.test.ts's ratchet.
        .replace(/\/\*[\s\S]*?\*\//g, " ")
        .replace(/\{\/\*[\s\S]*?\*\/\}/g, " ")
        .replace(/^\s*\/\/.*$/gm, " ")
        .split("\n")
        .filter((line) => /\d+(\.\d+)?%\s*(commercial\s+)?mortgage/i.test(line))
        .map((line) => `${f}: ${line.trim()}`)
    );
    expect(offenders).toEqual([]);
  });

  it("the planner's rate is the one CBK published", () => {
    expect(CBK_MORTGAGE_AVG_RATE_PCT).toBe(13.5);
  });
});
