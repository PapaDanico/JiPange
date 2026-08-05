"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CBC_GRADES } from "@/lib/cbc-grades";
import {
  FEE_ANCHORS,
  DEFAULT_FEE_ESCALATION,
  FEE_ESCALATION_TYPICAL_RANGE,
  DEFAULT_LEAD_MONTHS,
  buildHouseholdPlan,
  solveLevelContribution,
  interestContributionKES,
  shareOfNetPayPct,
  type ChildInput,
} from "@/lib/education-plan";
import { assumedMmfYield } from "@/lib/mmf-assumption";
import { formatKES } from "@/lib/budget";
import { useStickyState, useScrollIntoView } from "@/lib/hooks";
import CalculatorDisclaimer from "./CalculatorDisclaimer";
import ExportCardButton from "./ExportCardButton";
import NumberField from "./NumberField";
import ResetLink from "./ResetLink";
import ProductLinks from "./ProductLinks";
import ResultCard from "./ResultCard";
import ShareResultButton from "./ShareResultButton";
import HowItWorks from "./HowItWorks";
import { MMF_LINKS } from "@/lib/affiliate-links";

/** A child as the form holds it: strings, because inputs produce strings. */
interface ChildRow {
  id: string;
  name: string;
  gradeValue: string;
  annualFee: string;
}

const MAX_CHILDREN = 4;

const blankChild = (n: number): ChildRow => ({
  id: `c${n}`,
  name: "",
  gradeValue: "grade1",
  annualFee: "",
});

/**
 * The next free row id — one past the highest in use, not the row count.
 *
 * Counting rows collides. Add a second child (c2), remove the first, and the
 * list is [c2] with a length of one, so the next "new" row is c2 again. Two
 * rows then share a React key AND a DOM id: React applies edits meant for one
 * to the other, and `<label for>` resolves to whichever field the browser
 * finds first, so tapping the second child's label focuses the first child's
 * input. Caught by driving the add/remove/add sequence, which is exactly the
 * order a parent fixing a mistake would use.
 */
export function nextChildId(rows: readonly ChildRow[]): string {
  const highest = rows.reduce((max, r) => {
    const n = Number.parseInt(r.id.replace(/^c/, ""), 10);
    return Number.isFinite(n) && n > max ? n : max;
  }, 0);
  return `c${highest + 1}`;
}

/**
 * Hoisted so the array identity is stable across renders.
 *
 * `useStickyState` feeds its default into a `useSyncExternalStore` snapshot.
 * A fresh `[blankChild(1)]` literal on every render is a new reference every
 * time, which is the shape that makes a snapshot look permanently changed.
 * lib/storage.ts caches parsed reads specifically to avoid that, but the
 * default never goes through the cache — so it has to be stable here.
 */
const INITIAL_CHILDREN: ChildRow[] = [blankChild(1)];

export default function SchoolFeesLifetimeCalculator() {
  const [children, setChildren] = useStickyState<ChildRow[]>(
    "jipange:tool:school-fees-lifetime:children",
    INITIAL_CHILDREN
  );
  const [escalationPct, setEscalationPct] = useStickyState(
    "jipange:tool:school-fees-lifetime:escalation",
    String(Math.round(DEFAULT_FEE_ESCALATION * 100))
  );
  const [alreadySaved, setAlreadySaved] = useStickyState(
    "jipange:tool:school-fees-lifetime:saved",
    "0"
  );
  const [netPay, setNetPay] = useStickyState("jipange:tool:school-fees-lifetime:netPay", "");
  const [frontLoaded, setFrontLoaded] = useStickyState(
    "jipange:tool:school-fees-lifetime:frontLoaded",
    false
  );
  const [university, setUniversity] = useStickyState(
    "jipange:tool:school-fees-lifetime:university",
    false
  );
  const [uniFee, setUniFee] = useStickyState(
    "jipange:tool:school-fees-lifetime:uniFee",
    "250000"
  );
  const [showSchedule, setShowSchedule] = useState(false);

  const returnRate = assumedMmfYield();

  const result = useMemo(() => {
    const inputs: ChildInput[] = children
      .filter((c) => Number(c.annualFee) > 0)
      .map((c) => ({
        name: c.name,
        gradeValue: c.gradeValue,
        annualFeeTodayKES: Number(c.annualFee),
        escalation: Math.max(0, Number(escalationPct) || 0) / 100,
        universityYears: university ? 4 : 0,
        universityAnnualTodayKES: university ? Number(uniFee) || 0 : 0,
      }));

    if (inputs.length === 0) return null;

    const household = buildHouseholdPlan(inputs);
    if (household.years.length === 0) return null;

    /* The household is funded as one pot against one merged schedule, not as
     * a sum of per-child plans. Siblings share a fund in practice, and the
     * overlap years are precisely where a per-child sum would over-provision
     * — the pot for the younger child is still building while the older
     * child's is being drawn down. */
    const schedule = household.years.map((y) => ({
      yearsAhead: y.yearsAhead,
      feeKES: y.totalKES,
    }));

    const common = {
      years: schedule,
      openingBalanceKES: Math.max(0, Number(alreadySaved) || 0),
      annualReturn: returnRate,
      frontLoaded,
      leadMonths: DEFAULT_LEAD_MONTHS,
    };

    const monthly = solveLevelContribution(common);

    return {
      household,
      monthly,
      interest: interestContributionKES(common),
      sharePct: shareOfNetPayPct(monthly, Number(netPay) || 0),
      naiveTotal: household.children.reduce((s, c) => s + c.totalIfFeesNeverRoseKES, 0),
    };
  }, [
    children,
    escalationPct,
    alreadySaved,
    netPay,
    frontLoaded,
    university,
    uniFee,
    returnRate,
  ]);

  const resultsRef = useScrollIntoView<HTMLDivElement>(result !== null);

  function updateChild(id: string, patch: Partial<ChildRow>) {
    setChildren(children.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  const isDirty =
    children.length > 1 ||
    children.some((c) => c.annualFee !== "" || c.name !== "" || c.gradeValue !== "grade1") ||
    alreadySaved !== "0" ||
    netPay !== "" ||
    frontLoaded ||
    university;

  function handleReset() {
    setChildren(INITIAL_CHILDREN);
    setEscalationPct(String(Math.round(DEFAULT_FEE_ESCALATION * 100)));
    setAlreadySaved("0");
    setNetPay("");
    setFrontLoaded(false);
    setUniversity(false);
    setUniFee("250000");
  }

  return (
    <div className="space-y-4">
      {/* ── The children ── */}
      <div className="space-y-4">
        {children.map((child, i) => (
          <div key={child.id} className="rounded-2xl border border-border bg-white p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-primary">
                {child.name.trim() || `Child ${i + 1}`}
              </p>
              {children.length > 1 && (
                <button
                  type="button"
                  onClick={() => setChildren(children.filter((c) => c.id !== child.id))}
                  className="text-xs text-ink-soft underline hover:text-danger"
                >
                  Remove
                </button>
              )}
            </div>

            <label
              htmlFor={`name-${child.id}`}
              className="mt-3 block text-sm font-medium text-ink-soft"
            >
              Name (optional)
            </label>
            <input
              id={`name-${child.id}`}
              type="text"
              value={child.name}
              onChange={(e) => updateChild(child.id, { name: e.target.value })}
              placeholder="e.g. Wanjiru"
              className="mt-1 h-12 w-full rounded-lg border border-border bg-white px-4 text-base focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />

            <label
              htmlFor={`grade-${child.id}`}
              className="mt-3 block text-sm font-medium text-ink-soft"
            >
              Current level
            </label>
            <select
              id={`grade-${child.id}`}
              value={child.gradeValue}
              onChange={(e) => updateChild(child.id, { gradeValue: e.target.value })}
              className="mt-1 h-12 w-full rounded-lg border border-border bg-white px-4 text-base focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {CBC_GRADES.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>

            {/* Anchors, presented as reference points to overwrite. */}
            <p className="mt-3 text-sm font-medium text-ink-soft">
              Fees this year, per year
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {FEE_ANCHORS.map((a) => (
                <button
                  key={a.key}
                  type="button"
                  title={a.source}
                  onClick={() => updateChild(child.id, { annualFee: String(a.annualKES) })}
                  aria-pressed={child.annualFee === String(a.annualKES)}
                  className={`inline-flex min-h-11 items-center justify-center rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    child.annualFee === String(a.annualKES)
                      ? "border-accent bg-accent text-ink"
                      : "border-border bg-white text-ink-soft hover:bg-canvas"
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </div>
            <NumberField
              id={`fee-${child.id}`}
              label=""
              value={child.annualFee}
              onChange={(v) => updateChild(child.id, { annualFee: v })}
              placeholder="Your school's annual fee, e.g. 333500"
            />
          </div>
        ))}
      </div>

      {children.length < MAX_CHILDREN && (
        <button
          type="button"
          onClick={() => setChildren([...children, blankChild(Number(nextChildId(children).slice(1)))])}
          className="h-12 w-full rounded-full border border-dashed border-primary text-sm font-semibold text-primary hover:bg-canvas"
        >
          + Add another child
        </button>
      )}

      {/* ── Assumptions ── */}
      <div className="rounded-2xl border border-border bg-white p-4">
        <div className="flex items-center justify-between">
          <label htmlFor="escalation" className="text-sm font-medium text-ink-soft">
            Annual fee increase
          </label>
          <span className="text-sm font-semibold text-primary">{escalationPct}%/yr</span>
        </div>
        <input
          id="escalation"
          type="range"
          min={0}
          max={20}
          value={escalationPct}
          onChange={(e) => setEscalationPct(e.target.value)}
          className="mt-2 h-11 w-full cursor-pointer accent-primary"
        />
        <p className="mt-1 text-xs text-faint">
          Kenyan private schools are widely reported to raise fees{" "}
          {Math.round(FEE_ESCALATION_TYPICAL_RANGE.low * 100)}–
          {Math.round(FEE_ESCALATION_TYPICAL_RANGE.high * 100)}% a year. This is an{" "}
          <strong>assumption, not a measurement</strong> — check your own school&apos;s last
          three invoices and set it to what they actually did.
        </p>

        {/* min-h-6 on the LABEL, not the checkbox.
            *
            * WCAG 2.5.8 measures the target, and the target here is the whole
            * label — a 16px checkbox inside a 40px label is already compliant.
            * This one's label wrapped to a single 20px line, so the control it
            * exposes was 20px. Raising the checkbox instead would have made a
            * 24px box next to 14px text, which looks wrong and fixes the
            * smaller of the two problems. */}
          <label className="mt-4 flex min-h-6 cursor-pointer items-center gap-2 text-sm text-ink-soft">
          <input
            type="checkbox"
            checked={frontLoaded}
            onChange={(e) => setFrontLoaded(e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          My school front-loads Term 1 (≈50% / 30% / 20%)
        </label>

        <label className="mt-3 flex min-h-6 cursor-pointer items-center gap-2 text-sm text-ink-soft">
          <input
            type="checkbox"
            checked={university}
            onChange={(e) => setUniversity(e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          Add four years of university after Grade 12
        </label>
        {university && (
          <NumberField
            id="uniFee"
            label="University cost per year, at today's prices"
            value={uniFee}
            onChange={setUniFee}
            placeholder="250000"
          />
        )}
      </div>

      <NumberField
        id="alreadySaved"
        label="Already saved toward school fees (Ksh)"
        value={alreadySaved}
        onChange={setAlreadySaved}
        placeholder="0"
      />
      <NumberField
        id="netPay"
        label="Household take-home pay per month (optional)"
        value={netPay}
        onChange={setNetPay}
        placeholder="e.g. 150000"
      />

      <ResetLink show={isDirty} onReset={handleReset} />

      {result && (
        <>
          <div ref={resultsRef} className="animate-rise space-y-4" aria-live="polite">
            <ResultCard
              label={`Total fees to the end of school${university ? " and university" : ""}`}
              value={formatKES(result.household.totalNominalKES)}
              sublabel={`In today's money that is ${formatKES(
                result.household.totalTodayKES
              )}. Multiplying this year's fee by the years left would have said ${formatKES(
                result.naiveTotal
              )} — the difference is ${escalationPct}% a year, compounding.`}
              tone="warning"
            />

            <ResultCard
              label="Save this every month, starting now"
              value={`${formatKES(result.monthly)}/mo`}
              sublabel={`Funds every term from next January to the last one${
                result.household.lastYear ? ` in ${result.household.lastYear}` : ""
              }, without borrowing. This year's fees are assumed to be already covered from cash flow.`}
              tone="success"
            />

            {result.household.peakYear && result.household.peakYear.perChild.length > 1 && (
              <ResultCard
                label={`Your hardest year is ${result.household.peakYear.calendarYear}`}
                value={formatKES(result.household.peakYear.totalKES)}
                sublabel={`${result.household.peakYear.perChild
                  .map((c) => `${c.name} in ${c.gradeLabel}`)
                  .join(" and ")} — both in school, after ${
                  result.household.peakYear.yearsAhead
                } years of increases. This is the year a plan built on averages breaks.`}
                tone="warning"
              />
            )}

            {result.sharePct > 0 && (
              <ResultCard
                label="Share of your take-home pay"
                value={`${result.sharePct}%`}
                sublabel={
                  result.sharePct > 40
                    ? "Above 40% of net pay on school fees alone leaves very little for everything else — worth testing a different school against this same calculator before committing."
                    : "Fees are only one line in the budget — check it against your full split."
                }
                tone={result.sharePct > 40 ? "warning" : undefined}
              />
            )}

            {result.interest > 0 && (
              <ResultCard
                label="Paid by the fund, not by you"
                value={formatKES(result.interest)}
                sublabel={`Interest earned at ${(returnRate * 100).toFixed(
                  1
                )}% while each term's money waits — the part of the bill that saving early covers for you.`}
              />
            )}

            <ShareResultButton
              message={`🎓 *School fees, all the way to Grade 12*\n\nTotal: ${formatKES(
                result.household.totalNominalKES
              )}\nSave monthly: ${formatKES(
                result.monthly
              )}\n\nWork out yours → jipangefinance.org/tools/school-fees-lifetime`}
            />

            {/* The schedule lives INSIDE the exported node and is always
                rendered, hidden on screen only when collapsed.

                It used to sit outside the capture, so the year-by-year bill —
                the one part of this a school bursar or a SACCO loans officer
                would actually read — never reached the PDF, and the sheet had
                a third of a page of white space where it should have been.
                `data-export-include` tells the sheet builder to reveal it
                regardless of the on-screen toggle: what you export should not
                depend on which disclosures you happened to open. */}
            <div
              data-export-include
              className={`overflow-x-auto rounded-2xl border border-border bg-white ${
                showSchedule ? "" : "hidden"
              }`}
            >
              <table className="w-full min-w-[420px] text-left text-sm">
                <caption className="sr-only">
                  School fees due each year, escalated at {escalationPct}% a year
                </caption>
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wide text-faint">
                    <th scope="col" className="p-3">Year</th>
                    <th scope="col" className="p-3">Who is in school</th>
                    <th scope="col" className="p-3 text-right">Due</th>
                  </tr>
                </thead>
                <tbody>
                  {result.household.years.map((y) => (
                    <tr
                      key={y.calendarYear}
                      className={`border-b border-border last:border-0 ${
                        y.calendarYear === result.household.peakYear?.calendarYear
                          ? "bg-danger-soft font-semibold"
                          : ""
                      }`}
                    >
                      <td className="p-3">{y.calendarYear}</td>
                      <td className="p-3 text-ink-soft">
                        {y.perChild.map((c) => `${c.name}, ${c.gradeLabel}`).join("; ")}
                      </td>
                      <td className="p-3 text-right">{formatKES(y.totalKES)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowSchedule((v) => !v)}
            aria-expanded={showSchedule}
            className="h-12 w-full rounded-full border border-border text-sm font-semibold text-primary hover:bg-canvas"
          >
            {showSchedule ? "Hide the year-by-year bill" : "Show the year-by-year bill"}
          </button>

          <ExportCardButton
            containerRef={resultsRef}
            filename="school-fees-lifetime"
            title="The Full Cost of Private School"
            assumptions={[
              {
                label: "Children",
                value: children
                  .filter((c) => Number(c.annualFee) > 0)
                  .map((c, i) => `${c.name.trim() || `Child ${i + 1}`} (${
                    CBC_GRADES.find((g) => g.value === c.gradeValue)?.label ?? c.gradeValue
                  })`)
                  .join(", "),
              },
              { label: "Fee increase assumed", value: `${escalationPct}% a year` },
              { label: "Return assumed", value: `${(returnRate * 100).toFixed(1)}% a year` },
              { label: "Already saved", value: formatKES(Number(alreadySaved) || 0) },
              ...(university ? [{ label: "University", value: `4 years at ${formatKES(Number(uniFee) || 0)}/yr` }] : []),
              ...(frontLoaded ? [{ label: "Term 1", value: "Front-loaded (50/30/20)" }] : []),
            ]}
            notes={[
              "The fee increase is an assumption you set, not a measured rate — over a fourteen-year horizon it drives the total more than the return does.",
              "This year's fees are treated as already committed; the monthly figure funds every term from next January onward.",
              "Returns are not guaranteed. A money market fund's yield moves with Treasury bill rates.",
            ]}
          />

          <CalculatorDisclaimer
            extraNotes={[
              "The fee increase is an assumption you set, not a measured rate. It is the single biggest driver of the total over a fourteen-year horizon — a plan built on 5% and met with 12% falls short badly, so set it from your own school's invoice history.",
              "The reference fee buttons are individual published fee schedules from named schools, offered as starting points. There is no such thing as an average Kenyan private school fee; replace them with your own invoice.",
              "This year's fees are treated as already committed. The monthly figure funds every term from next January onward.",
              "Returns are not guaranteed. A money market fund's yield moves with Treasury bill rates and can fall.",
            ]}
          />

          <ProductLinks products={MMF_LINKS.slice(0, 2)} heading="Where the fund can live" />

          <p className="mt-4 rounded-xl bg-accent-soft p-3 text-sm text-ink-soft">
            🏛️ For the later years, matching a bond maturity to each fee year means the principal
            arrives just before the invoice instead of forcing a sale at whatever price the market
            offers that week.{" "}
            <Link
              href="https://mwangazayield.org/goals/"
              className="font-medium text-primary underline"
            >
              Match maturities to fee years →
            </Link>
          </p>
        </>
      )}

      <HowItWorks
        steps={[
          "Add each child and pick their current level — the plan starts from the year they are in now, not from the next transition.",
          "Enter this year's fee for their actual school. The buttons are published figures from named schools, there to be replaced by your invoice.",
          "Set the fee-increase slider to what your school has actually done. Over fourteen years this matters more than the return you earn.",
          "Read the total, then the monthly figure that funds it — and check the peak year, which is when two children overlap and a plan built on averages gives way.",
        ]}
      />
    </div>
  );
}
