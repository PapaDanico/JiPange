import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { formatInput, inputsFromPairs, MAX_EXPORT_INPUTS } from "../export-inputs";

describe("formatInput", () => {
  it("turns a Ksh field into a labelled amount", () => {
    expect(formatInput("Loan amount / HELB balance (Ksh)", "500000")).toEqual({
      label: "Loan amount / HELB balance",
      value: "Ksh 500,000",
    });
  });

  it("keeps the unit of a monthly amount", () => {
    expect(formatInput("Monthly contribution (Ksh/month)", "25000")).toEqual({
      label: "Monthly contribution",
      value: "Ksh 25,000 per month",
    });
  });

  it("leaves non-money numbers and their units in the label", () => {
    expect(formatInput("Repayment period (years)", "5")).toEqual({ label: "Repayment period (years)", value: "5" });
    expect(formatInput("Annual interest rate", "12.5")).toEqual({ label: "Annual interest rate", value: "12.5" });
  });

  it("drops an empty field and passes non-numeric text through untouched", () => {
    expect(formatInput("Loan amount (Ksh)", "  ")).toBeNull();
    expect(formatInput("", "5")).toBeNull();
    expect(formatInput("Lender", "Co-op Bank")).toEqual({ label: "Lender", value: "Co-op Bank" });
  });

  it("prints a percent suffix and drops the form's optional marker", () => {
    expect(formatInput("Annual interest rate", "12", "%")).toEqual({ label: "Annual interest rate", value: "12%" });
    expect(formatInput("What you put away each month (Ksh) — optional", "5000")).toEqual({
      label: "What you put away each month",
      value: "Ksh 5,000",
    });
  });

  it("never prints Infinity or NaN as a figure", () => {
    expect(formatInput("Amount (Ksh)", "1e999")?.value).toBe("1e999");
  });
});

describe("inputsFromPairs", () => {
  it("collapses duplicate labels and caps the list", () => {
    const dup = inputsFromPairs([
      { label: "Rate", value: "10" },
      { label: "Rate", value: "12" },
    ]);
    expect(dup).toEqual([{ label: "Rate", value: "10" }]);
    const many = inputsFromPairs(Array.from({ length: 30 }, (_, i) => ({ label: `Field ${i}`, value: String(i + 1) })));
    expect(many).toHaveLength(MAX_EXPORT_INPUTS);
  });
});

describe("the export wiring", () => {
  const read = (p: string) => readFileSync(p, "utf8");

  it("every NumberField marks itself for collection", () => {
    expect(read("components/tools/NumberField.tsx")).toMatch(/data-export-label=\{label\}/);
  });

  it("the exporter prints the reader's inputs when a tool passes none, and sets document properties", () => {
    const src = read("components/tools/ExportCardButton.tsx");
    expect(src).toMatch(/assumptions: assumptions \?\? collectInputs\(\)/);
    expect(src).toMatch(/pdf\.setProperties\(\{[\s\S]*title:[\s\S]*author: "JiPange"/);
    expect(src).toMatch(/pdf\.setLanguage\("en-GB"\)/);
  });

  it("a sheet that flows onto several pages numbers them", () => {
    expect(read("lib/export-sheet.ts")).toMatch(/Page \$\{k \+ 1\} of \$\{pages\}/);
  });

  it("the loan insight no longer calls early repayment a guaranteed return", () => {
    const src = read("components/tools/LoanRepaymentCalculator.tsx");
    expect(src).not.toMatch(/guaranteed, tax-free return/);
    expect(src).toMatch(/no early-repayment fee/);
  });
});
