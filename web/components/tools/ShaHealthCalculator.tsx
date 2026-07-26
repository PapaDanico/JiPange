"use client";

import { useMemo } from "react";
import { calculateShaHealth, type EmploymentType } from "@/lib/sha";
import { formatKES } from "@/lib/budget";
import { useStickyState, useScrollIntoView } from "@/lib/hooks";
import CalculatorDisclaimer from "./CalculatorDisclaimer";
import ExportCardButton from "./ExportCardButton";
import NumberField from "./NumberField";
import ResetLink from "./ResetLink";
import ResultCard from "./ResultCard";
import ShareResultButton from "./ShareResultButton";
import Toggle from "./Toggle";
import { PENSION_LINKS } from "@/lib/affiliate-links";
import ProductLinks from "./ProductLinks";

const EMPLOYMENT_OPTIONS: { id: EmploymentType; label: string; sub: string }[] = [
  { id: "employed", label: "Employed", sub: "Employer deducts your 2.75% automatically" },
  { id: "self_employed", label: "Self-employed", sub: "You declare income and pay directly" },
  { id: "informal", label: "Informal / no fixed income", sub: "Minimum Ksh 300/month applies" },
];

const FAMILY_OPTIONS = [
  { value: 1, label: "Just me" },
  { value: 2, label: "Me + spouse" },
  { value: 3, label: "Family of 3" },
  { value: 4, label: "Family of 4" },
  { value: 5, label: "Family of 5+" },
];

export default function ShaHealthCalculator() {
  const [employmentType, setEmploymentType] = useStickyState<EmploymentType>(
    "jipange:tool:sha:employment",
    "employed"
  );
  const [income, setIncome] = useStickyState("jipange:tool:sha:income", "");
  const [familySize, setFamilySize] = useStickyState("jipange:tool:sha:family", "1");
  const [wantsPrivate, setWantsPrivate] = useStickyState(
    "jipange:tool:sha:private",
    "false"
  );

  const result = useMemo(() => {
    const inc = Number(income);
    if (!inc || inc <= 0) return null;
    return calculateShaHealth({
      employmentType,
      grossMonthlyIncome: inc,
      familySize: Number(familySize),
      wantsPrivateCare: wantsPrivate === "true",
    });
  }, [employmentType, income, familySize, wantsPrivate]);

  const resultsRef = useScrollIntoView<HTMLDivElement>(result !== null);

  const isDirty = income !== "" || employmentType !== "employed";

  function handleReset() {
    setEmploymentType("employed");
    setIncome("");
    setFamilySize("1");
    setWantsPrivate("false");
  }

  // Insurance partners — filter out pension for this context; use pension links as proxies
  // until we have dedicated health insurance partners in the directory.
  const healthPartners = PENSION_LINKS.slice(0, 2);

  return (
    <div className="space-y-4">
      {/* Employment type */}
      <div>
        <p className="text-sm font-medium text-ink-soft">Employment type</p>
        <div className="mt-1 space-y-2">
          {EMPLOYMENT_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setEmploymentType(opt.id)}
              aria-pressed={employmentType === opt.id}
              className={`w-full rounded-lg border px-4 py-2.5 text-left transition-colors ${
                employmentType === opt.id
                  ? "border-primary bg-canvas"
                  : "border-border bg-white hover:bg-[#FAF8F5]"
              }`}
            >
              <p
                className={`text-sm font-medium ${
                  employmentType === opt.id ? "text-primary" : "text-ink-soft"
                }`}
              >
                {opt.label}
              </p>
              <p className="text-xs text-faint">{opt.sub}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Income */}
      <NumberField
        id="income"
        label={
          employmentType === "employed"
            ? "Gross monthly salary (KES)"
            : "Monthly income / declared earnings (KES)"
        }
        value={income}
        onChange={setIncome}
        placeholder="e.g. 60000"
        min={1}
      />

      {/* Family size */}
      <div>
        <label htmlFor="family-size" className="block text-sm font-medium text-ink-soft">
          Who are you covering?
        </label>
        <select
          id="family-size"
          value={familySize}
          onChange={(e) => setFamilySize(e.target.value)}
          className="mt-1 h-12 w-full rounded-lg border border-border bg-white px-4 text-base focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {FAMILY_OPTIONS.map((o) => (
            <option key={o.value} value={String(o.value)}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Private care toggle */}
      <div className="flex items-center justify-between rounded-lg border border-border bg-white px-4 py-3">
        <div>
          <p className="text-sm font-medium text-ink-soft">
            I want to access private hospitals
          </p>
          <p className="text-xs text-faint">
            SHA alone only covers accredited public facilities
          </p>
        </div>
        <Toggle
          checked={wantsPrivate === "true"}
          onChange={() => setWantsPrivate(wantsPrivate === "true" ? "false" : "true")}
          aria-label="Toggle private hospital access"
        />
      </div>

      <ResetLink show={isDirty} onReset={handleReset} />

      {result && (
        <div ref={resultsRef} className="animate-rise space-y-4" aria-live="polite">
          {/* SHA contribution */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ResultCard
              label="SHA monthly contribution (SHIF)"
              value={formatKES(result.monthlyContribution)}
              sublabel={
                result.isAtFloor
                  ? "At the Ksh 300 statutory floor — your 2.75% computed contribution was below this."
                  : result.isStatutoryRate
                    ? `${result.shaAsPercentOfIncome}% of your gross income`
                    : `${result.shaAsPercentOfIncome}% of the income you entered — an estimate; see the note below`
              }
              tone="primary"
            />
            <ResultCard
              label="Annual SHA contribution"
              value={formatKES(result.annualContribution)}
              sublabel="What leaves your salary for SHIF each year"
            />
          </div>

          {/* Coverage summary */}
          <div className="rounded-2xl bg-success-soft p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-success">
              What SHA covers
            </p>
            <ul className="mt-2 space-y-1 text-xs text-[#1A4A28]">
              <li>✓ Inpatient care at accredited public hospitals (Level 4–6)</li>
              <li>✓ Outpatient at accredited public facilities</li>
              <li>✓ Maternity — delivery at public hospitals</li>
              <li>✓ Chronic illness management (diabetes, hypertension, cancer treatment)</li>
              <li>✓ Emergency care at contracted facilities</li>
              <li>✓ Primary health care (immunisation, ANC, family planning) — free at Level 1–3</li>
            </ul>
          </div>

          {/* Gaps */}
          <div className="rounded-2xl bg-accent-wash p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-warning">
              SHA gaps to plug with a top-up plan
            </p>
            <ul className="mt-2 space-y-1 text-xs text-[#6B3A0A]">
              {result.gaps.map((gap, i) => (
                <li key={i}>⚠ {gap}</li>
              ))}
            </ul>
          </div>

          {/* Top-up recommendation */}
          <ResultCard
            label={`Recommended private top-up cost (${result.privateTopUpLabel})`}
            value={`${formatKES(result.privateTopUpRange.low)} – ${formatKES(result.privateTopUpRange.high)}/month`}
            sublabel="Estimate for a SHA top-up plan filling the key gaps above. Get quotes from CIC, ICEA Lion, or Jubilee Insurance."
            tone="warning"
          />

          <ResultCard
            label="Total monthly health budget (SHA + top-up)"
            value={`${formatKES(result.totalMonthlyHealthBudget.low)} – ${formatKES(result.totalMonthlyHealthBudget.high)}/month`}
            sublabel="Budget this range to be fully covered for your family situation."
          />

          <ShareResultButton
            message={`🏥 *My SHA Health Coverage Gap*\n\nSHA contribution: ${formatKES(result.monthlyContribution)}/month\nRecommended top-up: ${formatKES(result.privateTopUpRange.low)}–${formatKES(result.privateTopUpRange.high)}/month\nTotal health budget: ${formatKES(result.totalMonthlyHealthBudget.low)}–${formatKES(result.totalMonthlyHealthBudget.high)}/month\n\nCheck yours → jipangefinance.org/tools/sha-health`}
          />

          <ProductLinks
            products={healthPartners}
            heading="Explore regulated pension & insurance providers"
          />

          {!result.isStatutoryRate && (
            <div className="rounded-2xl border border-border bg-accent-soft/40 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-accent-ink">
                How your contribution is really assessed
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">
                The 2.75% rate above is the statutory deduction for <strong>salaried</strong>{" "}
                members. If you are self-employed or in informal work, SHA assesses you on declared{" "}
                <strong>household</strong> income and assets rather than a single payslip figure, so
                your actual contribution is set through that process and may differ from this. Treat
                the figure as a planning estimate and confirm your assessment with SHA directly.
              </p>
            </div>
          )}

          <CalculatorDisclaimer
            extraNotes={[
              "SHA tariffs and coverage limits change as the system matures — verify current benefits at sha.go.ke or with your HR department.",
              "Private top-up costs are market estimates for 2026. Actual premiums depend on your age, health history, and the specific plan chosen.",
              "SHA accreditation status of private hospitals changes frequently. Always verify before seeking treatment.",
            ]}
          />
          <ExportCardButton containerRef={resultsRef} filename="sha-health" />
        </div>
      )}
    </div>
  );
}
