"use client";

import { useMemo } from "react";
import Link from "next/link";
import { CBC_GRADES, getCbcGrade } from "@/lib/cbc-grades";
import { solveMonthlyContribution } from "@/lib/savings-goal";
import { formatKES } from "@/lib/budget";
import { useStickyState, useScrollIntoView } from "@/lib/hooks";
import CalculatorDisclaimer from "./CalculatorDisclaimer";
import ExportCardButton from "./ExportCardButton";
import NumberField from "./NumberField";
import ResetLink from "./ResetLink";
import ProductLinks from "./ProductLinks";
import ResultCard from "./ResultCard";
import ShareResultButton from "./ShareResultButton";
import { MMF_LINKS } from "@/lib/affiliate-links";

export default function EducationSavingsCalculator() {
  const [gradeValue, setGradeValue] = useStickyState(
    "jipange:tool:education-savings:grade",
    "grade1"
  );
  const [jssFees, setJssFees] = useStickyState("jipange:tool:education-savings:jssFees", "");
  const [sssFees, setSssFees] = useStickyState("jipange:tool:education-savings:sssFees", "");
  const [currentSavings, setCurrentSavings] = useStickyState(
    "jipange:tool:education-savings:currentSavings",
    "0"
  );
  const [annualReturn, setAnnualReturn] = useStickyState(
    "jipange:tool:education-savings:annualReturn",
    "8"
  );

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

  const resultsRef = useScrollIntoView<HTMLDivElement>(result !== null);

  const alreadyInSeniorSecondary = grade && grade.yearsToJSS <= 0 && grade.yearsToSSS <= 0;

  const isDirty =
    gradeValue !== "grade1" ||
    jssFees !== "" ||
    sssFees !== "" ||
    currentSavings !== "0" ||
    annualReturn !== "8";

  function handleReset() {
    setGradeValue("grade1");
    setJssFees("");
    setSssFees("");
    setCurrentSavings("0");
    setAnnualReturn("8");
  }

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="gradeValue" className="block text-sm font-medium text-ink-soft">
          Child&apos;s current level
        </label>
        <select
          id="gradeValue"
          value={gradeValue}
          onChange={(event) => setGradeValue(event.target.value)}
          className="mt-1 h-12 w-full rounded-lg border border-border bg-white px-4 text-base focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
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
          <p className="text-sm text-ink-soft">
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
          label={`Junior Secondary total fees, 3 years (Ksh) — starts in ${grade.yearsToJSS} year${grade.yearsToJSS === 1 ? "" : "s"}`}
          value={jssFees}
          onChange={setJssFees}
          placeholder="e.g. 600000"
        />
      )}

      {grade && grade.yearsToSSS > 0 && (
        <NumberField
          id="sssFees"
          label={`Senior Secondary total fees, 3 years (Ksh) — starts in ${grade.yearsToSSS} year${grade.yearsToSSS === 1 ? "" : "s"}`}
          value={sssFees}
          onChange={setSssFees}
          placeholder="e.g. 900000"
        />
      )}

      {grade && !alreadyInSeniorSecondary && (
        <>
          <NumberField
            id="currentSavings"
            label="Already saved toward this (Ksh)"
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

      <ResetLink show={isDirty} onReset={handleReset} />

      {result && (
        <>
        <div ref={resultsRef} className="animate-rise space-y-4" aria-live="polite">
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
            message={`🎓 *My Kids' Education Savings Plan*\n\nCombined monthly savings needed: ${formatKES(result.combinedMonthly)}\n\nCalculate yours → jipangefinance.org/tools/education-savings`}
          />
        </div>
        <ExportCardButton
          containerRef={resultsRef}
          filename="education-savings"
          title="Kids' Education Savings Plan"
          assumptions={[
            { label: "Child's level", value: grade?.label ?? gradeValue },
            ...(grade && grade.yearsToJSS > 0
              ? [{ label: "Junior Secondary", value: `${formatKES(Number(jssFees) || 0)} in ${grade.yearsToJSS} yrs` }]
              : []),
            ...(grade && grade.yearsToSSS > 0
              ? [{ label: "Senior Secondary", value: `${formatKES(Number(sssFees) || 0)} in ${grade.yearsToSSS} yrs` }]
              : []),
            { label: "Already saved", value: formatKES(Number(currentSavings) || 0) },
            { label: "Return assumed", value: `${annualReturn}% a year` },
          ]}
          notes={[
            "Fees are entered at today's prices and are not escalated here — school fee structures are set by individual schools and reviewed annually, so re-run this each January.",
            "The current savings figure is applied to whichever transition comes first; the later one starts from zero, because the same shilling cannot be counted twice.",
          ]}
        />
        <CalculatorDisclaimer
          extraNotes={[
            "CBC fee structures are set by individual schools and reviewed annually. Re-run this calculator each January when your school publishes fees for the year.",
            "The current savings input is applied toward whichever CBC transition comes first. The later transition is assumed to start from zero — the same shilling cannot be counted twice.",
          ]}
        />
        <ProductLinks products={MMF_LINKS.slice(0, 2)} heading="Start the fund in an MMF today" />
        </>
      )}
    </div>
  );
}
