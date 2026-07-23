"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import {
  calculateNetPay,
  MORTGAGE_INTEREST_RELIEF_CAP_MONTHLY,
  PENSION_RELIEF_CAP_MONTHLY,
} from "@/lib/tax";
import { taxShield } from "@/lib/tax-shield";
import { solveGrossForTargetNet } from "@/lib/salary-negotiation";
import { calculate502525Split, formatKES } from "@/lib/budget";
import { useStickyState, useScrollIntoView } from "@/lib/hooks";
import CalculatorDisclaimer from "./CalculatorDisclaimer";
import DeductionRow from "./DeductionRow";
import ExportCardButton from "./ExportCardButton";
import NumberField from "./NumberField";
import ProductLinks from "./ProductLinks";
import ResultCard from "./ResultCard";
import ShareResultButton from "./ShareResultButton";
import { PENSION_LINKS } from "@/lib/affiliate-links";

const PayBreakdownChart = dynamic(() => import("./PayBreakdownChart"), { ssr: false });

const NEGOTIATION_BUFFER = 5_000;

type Tab = "takehome" | "allocate" | "route" | "shield" | "negotiate";

const TABS: { id: Tab; label: string }[] = [
  { id: "takehome", label: "💰 Take-Home" },
  { id: "allocate", label: "🥧 Allocate" },
  { id: "route", label: "📱 Route" },
  { id: "shield", label: "🛡️ Shield" },
  { id: "negotiate", label: "💼 Negotiate" },
];

export default function SalaryPlannerHub() {
  const [activeTab, setActiveTab] = useState<Tab>("takehome");
  const [showReliefs, setShowReliefs] = useState(false);

  const [gross, setGross] = useStickyState("jipange:hub:salary:gross", "");
  const [pension, setPension] = useStickyState("jipange:hub:salary:pension", "0");
  const [mortgage, setMortgage] = useStickyState("jipange:hub:salary:mortgage", "0");
  const [insurance, setInsurance] = useStickyState("jipange:hub:salary:insurance", "0");

  const [rent, setRent] = useStickyState("jipange:hub:salary:rent", "");
  const [bills, setBills] = useStickyState("jipange:hub:salary:bills", "");
  const [targetNet, setTargetNet] = useStickyState("jipange:hub:salary:targetNet", "");

  const reliefs = useMemo(
    () => ({
      pensionContribution: Number(pension) || 0,
      mortgageInterest: Number(mortgage) || 0,
      insurancePremium: Number(insurance) || 0,
    }),
    [pension, mortgage, insurance]
  );

  const taxResult = useMemo(() => {
    const g = Number(gross);
    if (!g || g <= 0) return null;
    return calculateNetPay(g, reliefs);
  }, [gross, reliefs]);

  const shieldResult = useMemo(() => {
    const g = Number(gross);
    if (!g || g <= 0) return null;
    return taxShield({
      grossMonthly: g,
      pensionContribution: reliefs.pensionContribution,
      mortgageInterestMonthly: reliefs.mortgageInterest,
      insurancePremiumMonthly: reliefs.insurancePremium,
    });
  }, [gross, reliefs]);

  const split = useMemo(() => {
    if (!taxResult) return null;
    return calculate502525Split(taxResult.netMonthly);
  }, [taxResult]);

  const negotiateResult = useMemo(() => {
    const net = Number(targetNet);
    if (!net || net <= 0) return null;
    const requiredGross = solveGrossForTargetNet(net);
    return { requiredGross, grossWithBuffer: requiredGross + NEGOTIATION_BUFFER };
  }, [targetNet]);

  const routeSurplus = taxResult
    ? taxResult.netMonthly - (Number(rent) || 0) - (Number(bills) || 0)
    : null;

  const resultsRef = useScrollIntoView<HTMLDivElement>(taxResult !== null);
  const pensionCapped = reliefs.pensionContribution > PENSION_RELIEF_CAP_MONTHLY;
  const mortgageCapped = reliefs.mortgageInterest > MORTGAGE_INTEREST_RELIEF_CAP_MONTHLY;

  const noGrossMsg = (
    <p className="text-sm text-muted">Enter your gross salary above to see results.</p>
  );

  return (
    <div className="space-y-4">
      {/* Shared gross salary input */}
      <NumberField
        id="hub-gross"
        label="Monthly gross salary (KES)"
        value={gross}
        onChange={setGross}
        placeholder="e.g. 80000"
      />

      {/* Optional reliefs toggle */}
      <button
        type="button"
        onClick={() => setShowReliefs((prev) => !prev)}
        aria-expanded={showReliefs}
        className="text-sm font-medium text-primary underline"
      >
        {showReliefs ? "− Hide optional tax reliefs" : "+ Add optional tax reliefs"}
      </button>

      {showReliefs && (
        <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
          {/* Pension slider */}
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="hub-pension" className="text-sm font-medium text-ink-soft">
                Pension contribution (KES/month)
              </label>
              <span className="text-sm font-semibold text-primary">
                {formatKES(Number(pension) || 0)}
              </span>
            </div>
            <input
              id="hub-pension"
              type="range"
              min={0}
              max={PENSION_RELIEF_CAP_MONTHLY}
              step={500}
              value={Number(pension) || 0}
              onChange={(e) => setPension(e.target.value)}
              className="mt-2 h-2 w-full accent-primary"
            />
            <div className="mt-1 flex justify-between text-[10px] text-muted">
              <span>0</span>
              <span>cap {formatKES(PENSION_RELIEF_CAP_MONTHLY)}</span>
            </div>
            {pensionCapped && (
              <p className="mt-1 text-xs text-warning">
                Relief capped at {formatKES(PENSION_RELIEF_CAP_MONTHLY)}/month.
              </p>
            )}
          </div>

          {/* Mortgage slider */}
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="hub-mortgage" className="text-sm font-medium text-ink-soft">
                Mortgage interest (KES/month)
              </label>
              <span className="text-sm font-semibold text-primary">
                {formatKES(Number(mortgage) || 0)}
              </span>
            </div>
            <input
              id="hub-mortgage"
              type="range"
              min={0}
              max={MORTGAGE_INTEREST_RELIEF_CAP_MONTHLY}
              step={500}
              value={Number(mortgage) || 0}
              onChange={(e) => setMortgage(e.target.value)}
              className="mt-2 h-2 w-full accent-primary"
            />
            <div className="mt-1 flex justify-between text-[10px] text-muted">
              <span>0</span>
              <span>cap {formatKES(MORTGAGE_INTEREST_RELIEF_CAP_MONTHLY)}</span>
            </div>
            {mortgageCapped && (
              <p className="mt-1 text-xs text-warning">
                Relief capped at {formatKES(MORTGAGE_INTEREST_RELIEF_CAP_MONTHLY)}/month.
              </p>
            )}
          </div>

          {/* Insurance field */}
          <NumberField
            id="hub-insurance"
            label="Life / education insurance premium (KES/month)"
            value={insurance}
            onChange={setInsurance}
            placeholder="0"
          />
          <p className="text-xs text-ink-soft">
            Pension and mortgage reduce taxable pay. Insurance relief is 15% of premiums up to Ksh
            5,000/month. These are declared to your employer — the contributions themselves are not
            deducted here.
          </p>
        </div>
      )}

      {/* Tab bar */}
      <div
        className="scrollbar-none -mx-1 flex gap-1 overflow-x-auto px-1"
        role="tablist"
        aria-label="Salary tools"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? "border-primary bg-primary text-white"
                : "border-border bg-white text-ink-soft hover:bg-canvas"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Take-Home tab ── */}
      {activeTab === "takehome" && (
        <div className="space-y-4">
          {!taxResult && noGrossMsg}
          {taxResult && (
            <>
              <div ref={resultsRef} className="animate-rise space-y-4" aria-live="polite">
                <ResultCard
                  label="Take-home pay"
                  value={formatKES(taxResult.netMonthly)}
                  tone="success"
                />
                <div className="rounded-2xl bg-white p-6 shadow-sm">
                  <DeductionRow
                    label="Gross salary"
                    value={formatKES(taxResult.grossMonthly)}
                    bold
                  />
                  <DeductionRow
                    label="Less: NSSF Tier 1"
                    value={`(${formatKES(taxResult.nssf.tier1)})`}
                    info="Mandatory retirement savings — Tier 1 covers the first Ksh 9,000 at 6%. Still your money in your NSSF account."
                  />
                  <DeductionRow
                    label="Less: NSSF Tier 2"
                    value={`(${formatKES(taxResult.nssf.tier2)})`}
                  />
                  <DeductionRow
                    label="Less: SHIF (2.75%)"
                    value={`(${formatKES(taxResult.shif)})`}
                    info="Social Health Insurance Fund — 2.75% of gross, min Ksh 300/month. Funds your public health cover."
                  />
                  <DeductionRow
                    label="Less: Housing Levy (AHL)"
                    value={`(${formatKES(taxResult.ahl)})`}
                    info="Affordable Housing Levy — 1.5% of gross. Your employer also pays a matching 1.5% on top."
                  />
                  {taxResult.pensionRelief > 0 && (
                    <DeductionRow
                      label="Less: Pension relief"
                      value={`(${formatKES(taxResult.pensionRelief)})`}
                    />
                  )}
                  {taxResult.mortgageRelief > 0 && (
                    <DeductionRow
                      label="Less: Mortgage interest relief"
                      value={`(${formatKES(taxResult.mortgageRelief)})`}
                    />
                  )}
                  <hr className="my-2 border-border" />
                  <DeductionRow
                    label="Taxable pay"
                    value={formatKES(taxResult.taxablePay)}
                    bold
                    info="PAYE is calculated on this amount — your gross minus NSSF, SHIF, AHL, and any declared reliefs."
                  />
                  <DeductionRow
                    label="PAYE (before relief)"
                    value={`(${formatKES(taxResult.grossPaye)})`}
                  />
                  <DeductionRow
                    label="Less: Personal relief"
                    value={formatKES(taxResult.personalRelief)}
                    info="A flat Ksh 2,400/month PAYE credit every formally employed Kenyan gets automatically."
                  />
                  {taxResult.insuranceRelief > 0 && (
                    <DeductionRow
                      label="Less: Insurance relief"
                      value={formatKES(taxResult.insuranceRelief)}
                    />
                  )}
                  <DeductionRow label="Net PAYE" value={`(${formatKES(taxResult.paye)})`} />
                  <hr className="my-2 border-border" />
                  <DeductionRow
                    label="Net take-home pay"
                    value={formatKES(taxResult.netMonthly)}
                    bold
                  />
                </div>
                <div className="rounded-2xl bg-white p-6 shadow-sm">
                  <p className="text-sm font-semibold text-primary">Employer also pays</p>
                  <DeductionRow
                    label="NSSF match"
                    value={formatKES(taxResult.employerCost.nssf)}
                  />
                  <DeductionRow
                    label="Housing Levy match"
                    value={formatKES(taxResult.employerCost.ahl)}
                  />
                  <hr className="my-2 border-border" />
                  <DeductionRow
                    label="Your total cost to employer"
                    value={formatKES(taxResult.employerCost.total)}
                    bold
                  />
                </div>
                <PayBreakdownChart
                  netMonthly={taxResult.netMonthly}
                  paye={taxResult.paye}
                  nssfTotal={taxResult.nssf.total}
                  shif={taxResult.shif}
                  ahl={taxResult.ahl}
                />
                <ShareResultButton
                  message={`🇰🇪 *My Take-Home Pay*\n\nGross: ${formatKES(Number(gross))}\nTake-home: ${formatKES(taxResult.netMonthly)}/month\n\nCalculate yours → jipangefinance.org/tools/salary`}
                />
              </div>
              <ExportCardButton containerRef={resultsRef} filename="take-home-pay" />
              <CalculatorDisclaimer
                extraNotes={[
                  "Rates effective February 2026: NSSF Year 4 (lower Ksh 9,000 / upper Ksh 108,000 at 6%), SHIF 2.75%, Housing Levy 1.5%.",
                  "Pension relief (s.15(3)) capped Ksh 30,000/month; mortgage interest relief capped Ksh 30,000/month (raised from Ksh 25,000 by Finance Act 2025); insurance relief 15% of premiums up to Ksh 5,000/month (s.31).",
                ]}
              />
            </>
          )}
        </div>
      )}

      {/* ── Allocate tab ── */}
      {activeTab === "allocate" && (
        <div className="space-y-4">
          {!split && noGrossMsg}
          {split && taxResult && (
            <>
              <div className="rounded-2xl bg-canvas p-4 text-sm text-ink-soft">
                Splitting your{" "}
                <strong>{formatKES(taxResult.netMonthly)}</strong> take-home into three purposeful
                buckets.
              </div>
              <div className="grid grid-cols-1 gap-3">
                <ResultCard
                  label="50% — Household expenses"
                  value={formatKES(split.household)}
                  sublabel="Rent, groceries, utilities, transport, school fees"
                />
                <ResultCard
                  label="25% — Savings & emergency fund"
                  value={formatKES(split.savingsEmergency)}
                  sublabel="MMF or SACCO — aim for 3–6 months of expenses"
                  tone="success"
                />
                <ResultCard
                  label="25% — Investments"
                  value={formatKES(split.investments)}
                  sublabel="T-Bills, pension top-up, FIRE contributions"
                  tone="success"
                />
              </div>
              <ShareResultButton
                message={`🥧 *My 50/25/25 Budget Split*\n\nTake-home: ${formatKES(taxResult.netMonthly)}/month\nHousehold: ${formatKES(split.household)}\nSavings: ${formatKES(split.savingsEmergency)}\nInvestments: ${formatKES(split.investments)}\n\nCalculate yours → jipangefinance.org/tools/salary`}
              />
              <CalculatorDisclaimer
                extraNotes={[
                  "The 50/25/25 split is a guideline — adjust to your actual household costs and commitments. Use the Take-Home tab to see the exact net pay used here.",
                ]}
              />
            </>
          )}
        </div>
      )}

      {/* ── Route tab ── */}
      {activeTab === "route" && (
        <div className="space-y-4">
          {!taxResult && noGrossMsg}
          {taxResult && (
            <>
              <div className="rounded-xl bg-canvas p-3 text-sm text-ink-soft">
                Routing from your{" "}
                <strong>{formatKES(taxResult.netMonthly)}</strong> take-home pay.
              </div>
              <NumberField
                id="hub-rent"
                label="Rent (KES/month)"
                value={rent}
                onChange={setRent}
                placeholder="e.g. 20000"
              />
              <NumberField
                id="hub-bills"
                label="Fixed bills (KES/month)"
                value={bills}
                onChange={setBills}
                placeholder="e.g. 10000"
              />
              {routeSurplus !== null && routeSurplus > 0 && (
                <>
                  <ResultCard
                    label="Your true weekly spend limit"
                    value={formatKES(Math.round(routeSurplus / 4.33))}
                    sublabel={`Floating surplus ${formatKES(routeSurplus)} ÷ 4.33 weeks`}
                    tone="success"
                  />
                  <div className="rounded-2xl bg-canvas p-4 text-sm text-ink-soft">
                    <p className="font-semibold text-primary">Payday action</p>
                    <p className="mt-1 text-xs">
                      On the day you&apos;re paid, move{" "}
                      <strong>{formatKES(routeSurplus)}</strong> out of your main M-Pesa wallet
                      into a locked pocket or MMF — before lifestyle creep handles it. Withdraw
                      only{" "}
                      <strong>{formatKES(Math.round(routeSurplus / 4.33))}</strong>{" "}
                      per week back into your spending wallet.
                    </p>
                  </div>
                  <ShareResultButton
                    message={`📱 *My Payday Router*\n\nSurplus to route: ${formatKES(routeSurplus)}\nWeekly limit: ${formatKES(Math.round(routeSurplus / 4.33))}\n\nRoute yours → jipangefinance.org/tools/salary`}
                  />
                </>
              )}
              {routeSurplus !== null && routeSurplus <= 0 && (Number(rent) > 0 || Number(bills) > 0) && (
                <div className="rounded-xl border border-danger bg-danger-soft p-4 text-sm text-danger">
                  Rent and bills exceed your take-home — review your fixed costs.
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Shield tab ── */}
      {activeTab === "shield" && (
        <div className="space-y-4">
          {!shieldResult && noGrossMsg}
          {shieldResult && (
            <>
              {shieldResult.totalMonthlyRecoverable < 1 ? (
                <div className="rounded-2xl bg-success-soft p-4 text-sm text-success-deep">
                  <p className="font-semibold">Fully optimised — no unused headroom.</p>
                  <p className="mt-1 text-xs">
                    You&apos;re already claiming all available pension, mortgage, and insurance relief.
                  </p>
                </div>
              ) : (
                <ResultCard
                  label="PAYE recoverable per month"
                  value={formatKES(shieldResult.totalMonthlyRecoverable)}
                  sublabel={`${formatKES(shieldResult.totalMonthlyRecoverable * 12)}/year you could redirect to your own pension or insurance`}
                  tone="warning"
                />
              )}

              <div className="grid grid-cols-1 gap-3">
                {shieldResult.pensionHeadroom > 0 && (
                  <ResultCard
                    label="Unused pension headroom"
                    value={formatKES(shieldResult.pensionHeadroom)}
                    sublabel={`Worth ${formatKES(shieldResult.pensionTaxSavings)}/month saved at your ${Math.round(shieldResult.marginalRate * 100)}% marginal rate`}
                  />
                )}
                {shieldResult.mortgageHeadroom > 0 && (
                  <ResultCard
                    label="Unused mortgage relief headroom"
                    value={formatKES(shieldResult.mortgageHeadroom)}
                    sublabel={`Worth ${formatKES(shieldResult.mortgageTaxSavings)}/month in PAYE savings`}
                  />
                )}
                {shieldResult.insuranceReliefClaimable > 0 && (
                  <ResultCard
                    label="Insurance relief claimable"
                    value={formatKES(shieldResult.insuranceReliefClaimable)}
                    sublabel="15% of premiums up to Ksh 5,000/month"
                  />
                )}
              </div>

              {shieldResult.totalMonthlyRecoverable >= 1 && (
                <div className="rounded-2xl bg-accent-wash p-4 text-sm">
                  <p className="font-semibold text-warning">How to close the gap</p>
                  <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs text-ink-soft">
                    <li>
                      Open a pension plan and declare contributions to HR — headroom fills
                      immediately on the payslip.
                    </li>
                    <li>
                      For a registered home loan, confirm your bank issues a mortgage interest
                      certificate to KRA annually.
                    </li>
                    <li>
                      Pay life/education insurance premiums and attach certificates to your P9
                      return.
                    </li>
                  </ol>
                </div>
              )}

              <ShareResultButton
                message={`🛡️ *My KRA Tax Shield*\n\nMonthly PAYE recoverable: ${formatKES(shieldResult.totalMonthlyRecoverable)}\nAnnual: ${formatKES(shieldResult.totalMonthlyRecoverable * 12)}\n\nCheck yours → jipangefinance.org/tools/salary`}
              />
              <CalculatorDisclaimer
                extraNotes={[
                  "Relief claims must be declared to your employer via the payroll system — they don't apply automatically.",
                  "Use the sliders in 'Add optional tax reliefs' above to model what filling the headroom does to your take-home.",
                  "KRA relief rules may change with annual Finance Acts. Verify current limits at kra.go.ke.",
                ]}
              />
              <ProductLinks
                products={PENSION_LINKS.slice(0, 3)}
                heading="Open a pension to claim this relief"
              />
            </>
          )}
        </div>
      )}

      {/* ── Negotiate tab ── */}
      {activeTab === "negotiate" && (
        <div className="space-y-4">
          <NumberField
            id="hub-targetNet"
            label="Target take-home pay (KES/month)"
            value={targetNet}
            onChange={setTargetNet}
            placeholder="e.g. 80000"
          />
          <p className="text-xs text-ink-soft">
            Enter what you need in your pocket — we&apos;ll work out the gross salary to negotiate for.
          </p>
          {negotiateResult && (
            <>
              <div className="grid grid-cols-1 gap-3">
                <ResultCard
                  label="Gross salary to negotiate"
                  value={formatKES(negotiateResult.requiredGross)}
                  sublabel="Produces exactly your target net after all statutory deductions"
                  tone="success"
                />
                <ResultCard
                  label="Ask for this (with buffer)"
                  value={formatKES(negotiateResult.grossWithBuffer)}
                  sublabel={`+ ${formatKES(NEGOTIATION_BUFFER)} negotiation buffer — room to be talked down`}
                  tone="primary"
                />
              </div>
              <div className="rounded-2xl bg-canvas p-4 text-sm text-ink-soft">
                <p className="font-semibold text-primary">Negotiation script</p>
                <p className="mt-1 text-xs">
                  &quot;Based on my take-home needs and Kenya&apos;s statutory deductions, I&apos;m
                  looking for a gross salary of{" "}
                  <strong>{formatKES(negotiateResult.grossWithBuffer)}</strong>. I&apos;m happy to
                  discuss the full package including pension contributions.&quot;
                </p>
              </div>
              <p className="text-xs text-ink-soft">
                Verify the outcome: enter{" "}
                <strong>{formatKES(negotiateResult.requiredGross)}</strong> in the gross field above
                and switch to Take-Home to confirm the net pay.
              </p>
              <ShareResultButton
                message={`💼 *My Salary Negotiation*\n\nTarget take-home: ${formatKES(Number(targetNet))}\nGross to negotiate: ${formatKES(negotiateResult.grossWithBuffer)}\n\nCalculate yours → jipangefinance.org/tools/salary`}
              />
              <CalculatorDisclaimer
                extraNotes={[
                  "Uses current PAYE, NSSF Year 4, SHIF, and Housing Levy rates — no optional reliefs applied. The required gross changes if you declare pension or mortgage relief.",
                  "Always verify the resulting net pay in the Take-Home tab with the gross you negotiate.",
                ]}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}
