"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CBC_GRADES, getCbcGrade } from "@/lib/cbc-grades";
import { solveMonthlyContribution } from "@/lib/savings-goal";
import { formatKES } from "@/lib/budget";
import NumberField from "./NumberField";
import ResultCard from "./ResultCard";
import ShareResultButton from "./ShareResultButton";

export default function EducationSavingsCalculator() {
  const [gradeValue, setGradeValue] = useState("grade1");
  const [jssFees, setJssFees] = useState("");
  const [sssFees, setSssFees] = useState("");
  const [currentSavings, setCurrentSavings] = useState("0");
  const [annualReturn, setAnnualReturn] = useState("8");

  const grade = getCbcGrade(gradeValue);

  const result = useMemo(() => {
    if (!grade) return null;
    if (grade.yearsToJSS <= 0 && grade.yearsToSSS <= 0) return null;

    const savings = Number(currentSavings) || 0;
    const rate = Math.max(0, Number(annualReturn) || 0) / 100;

    let jssMonthly: number | null = null;
    if (grade.yearsToJSS > 0) {
      const target = Number(jssFees);
      if (target > 0) {
        const monthly = solveMonthlyContribution({
          targetFutureValue: target,
          presentValue: savings,
          annualRate: rate,
          years: grade.yearsToJSS,
        });
        jssMonthly = Number.isFinite(monthly) ? monthly : null;
      }
    }

    // Current savings are assumed to go toward whichever goal comes first —
    // by the time that goal is funded, there's nothing left over for the
    // later one, so the later goal starts from zero rather than double-
    // counting the same shilling toward both targets.
    let sssMonthly: number | null = null;
    if (grade.yearsToSSS > 0) {
      const target = Number(sssFees);
      if (target > 0) {
        const sssPresentValue = grade.yearsToJSS > 0 ? 0 : savings;
        const monthly = solveMonthlyContribution({
          targetFutureValue: target,
          presentValue: sssPresentValue,
          annualRate: rate,
          years: grade.yearsToSSS,
        });
        sssMonthly = Number.isFinite(monthly) ? monthly : null;
      }
    }

    if (jssMonthly === null && sssMonthly === null) return null;

    return {
      jssMonthly,
      sssMonthly,
      combinedMonthly: (jssMonthly ?? 0) + (sssMonthly ?? 0),
    };
  }, [grade, jssFees, sssFees, currentSavings, annualReturn]);

  const alreadyInSeniorSecondary = grade && grade.yearsToJSS <= 0 && grade.yearsToSSS <= 0;

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="gradeValue" className="block text-sm font-medium text-[#4B4238]">
          Child&apos;s current level
        </label>
        <select
          id="gradeValue"
          value={gradeValue}
          onChange={(event) => setGradeValue(event.target.value)}
          className="mt-1 h-12 w-full rounded-lg border border-[#E5E0D8] bg-white px-4 text-base focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {CBC_GRADES.map((g) => (
            <option key={g.value} value={g.value}>
              {g.label}
            </option>
          ))}
        </select>
      </div>

      {alreadyInSeniorSecondary && (
        <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
          <p className="text-sm text-[#4B4238]">
            Your child has already reached Senior Secondary — there are no more CBC transitions
            ahead to save for. For fees due soon, try our{" "}
            <Link href="/tools/savings-goal" className="underline hover:text-primary">
              Savings Goal Calculator
            </Link>{" "}
            instead.
          </p>
        </div>
      )}

      {grade && grade.yearsToJSS > 0 && (
        <NumberField
          id="jssFees"
          label={`Junior Secondary total fees, 3 years (KES) — starts in ${grade.yearsToJSS} year${grade.yearsToJSS === 1 ? "" : "s"}`}
          value={jssFees}
          onChange={setJssFees}
          placeholder="e.g. 600000"
        />
      )}

      {grade && grade.yearsToSSS > 0 && (
        <NumberField
          id="sssFees"
          label={`Senior Secondary total fees, 3 years (KES) — starts in ${grade.yearsToSSS} year${grade.yearsToSSS === 1 ? "" : "s"}`}
          value={sssFees}
          onChange={setSssFees}
          placeholder="e.g. 900000"
        />
      )}

      {grade && !alreadyInSeniorSecondary && (
        <>
          <NumberField
            id="currentSavings"
            label="Already saved toward this (KES)"
            value={currentSavings}
            onChange={setCurrentSavings}
            placeholder="0"
          />
          <NumberField
            id="annualReturn"
            label="Expected annual return"
            value={annualReturn}
            onChange={setAnnualReturn}
            suffix="%"
          />
        </>
      )}

      {result && (
        <>
          {result.jssMonthly !== null && (
            <ResultCard
              label="Monthly savings for Junior Secondary"
              value={formatKES(result.jssMonthly)}
            />
          )}
          {result.sssMonthly !== null && (
            <ResultCard
              label="Monthly savings for Senior Secondary"
              value={formatKES(result.sssMonthly)}
            />
          )}
          {result.jssMonthly !== null && result.sssMonthly !== null && (
            <ResultCard
              label="Combined monthly savings needed"
              value={formatKES(result.combinedMonthly)}
              sublabel="A dedicated education fund (e.g. a money market fund) can help this grow steadily."
              tone="success"
            />
          )}
          <ShareResultButton
            message={`🎓 *My Kids' Education Savings Plan*\n\nCombined monthly savings needed: ${formatKES(result.combinedMonthly)}\n\nCalculate yours → jipangefinance.netlify.app/tools/education-savings`}
          />
        </>
      )}
    </div>
  );
}
