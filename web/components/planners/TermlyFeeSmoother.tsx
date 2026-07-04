"use client";

import { useState } from "react";
import Link from "next/link";
import { formatKES } from "@/lib/budget";
import {
  CBC_CUSHION_PER_CHILD,
  SMOOTHER_MMF_RATE,
  mmfFeeSubsidy,
  termlyMonthlyTarget,
} from "@/lib/school-fees";
import { saveStoredGoal } from "@/lib/storage";

const FEE_PRESETS = [50_000, 100_000, 250_000];
const MAX_CHILDREN = 5;

/**
 * Solves the cyclical cash-flow problem of Kenyan school terms: three lumpy
 * bills a year become one flat monthly amount, the MMF's interest pays part
 * of the bill, and CBC's ad-hoc project costs get their own cushion.
 */
export default function TermlyFeeSmoother() {
  const [annualFees, setAnnualFees] = useState("");
  const [children, setChildren] = useState(1);
  const [cbc, setCbc] = useState(false);
  const [locked, setLocked] = useState(false);

  const parsedFees = Math.max(0, Number(annualFees) || 0);
  const monthly = termlyMonthlyTarget(parsedFees, children);
  const subsidy = mmfFeeSubsidy(parsedFees, children);
  const termLump = (parsedFees * children) / 3;
  const cushionTotal = CBC_CUSHION_PER_CHILD * children;

  function handleInputsChanged() {
    setLocked(false);
  }

  function lockPlan() {
    if (monthly <= 0) return;
    saveStoredGoal({
      goalType: "education-termly",
      title: `School fees (${children} ${children === 1 ? "child" : "children"})`,
      emoji: "🎒",
      amountToday: parsedFees * children + (cbc ? cushionTotal : 0),
      nominalTarget: parsedFees * children + (cbc ? cushionTotal : 0),
      years: 1,
      requiredMonthly: Math.round(monthly),
      savedAt: new Date().toISOString(),
    });
    setLocked(true);
  }

  return (
    <div className="space-y-6">
      {/* ── Module 1: the Termly Fee Smoother ── */}
      <section aria-label="Termly fee smoother" className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-primary">
          This year&apos;s fees — smoothed
        </h2>
        <p className="mt-1 text-xs text-[#4B4238]">
          Three lumpy termly bills become one flat monthly amount that earns while it waits.
        </p>

        <p className="mt-4 text-sm font-medium text-[#4B4238]">Annual school fees (per child)</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {FEE_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => {
                setAnnualFees(String(preset));
                handleInputsChanged();
              }}
              aria-pressed={annualFees === String(preset)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                annualFees === String(preset)
                  ? "border-accent bg-accent text-[#171717]"
                  : "border-[#E5E0D8] bg-white text-[#4B4238] hover:bg-[#F1ECE3]"
              }`}
            >
              {formatKES(preset)}
            </button>
          ))}
        </div>
        <div className="relative mt-3">
          <input
            id="smoother-fees"
            type="number"
            inputMode="numeric"
            min={0}
            value={annualFees}
            onChange={(event) => {
              setAnnualFees(event.target.value);
              handleInputsChanged();
            }}
            placeholder="Custom amount, e.g. 150000"
            className="h-12 w-full rounded-lg border border-[#E5E0D8] bg-white px-4 text-base focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm text-[#4B4238]">
            KES/yr
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm font-medium text-[#4B4238]">Number of children</p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setChildren((c) => Math.max(1, c - 1));
                handleInputsChanged();
              }}
              aria-label="Fewer children"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E5E0D8] text-lg text-[#4B4238] hover:bg-[#F1ECE3]"
            >
              −
            </button>
            <span data-testid="children-count" className="w-6 text-center text-base font-semibold text-primary">
              {children}
            </span>
            <button
              type="button"
              onClick={() => {
                setChildren((c) => Math.min(MAX_CHILDREN, c + 1));
                handleInputsChanged();
              }}
              aria-label="More children"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E5E0D8] text-lg text-[#4B4238] hover:bg-[#F1ECE3]"
            >
              +
            </button>
          </div>
        </div>

        {monthly > 0 && (
          <>
            {/* Standard vs JiPange visualizer */}
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-[#FBEAEA] p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-danger">
                  Standard approach
                </p>
                <p className="mt-1 text-lg font-semibold text-danger">
                  {formatKES(Math.round(termLump))}
                </p>
                <p className="text-xs text-[#4B4238]">× 3 termly shocks (Jan, May, Sep)</p>
                <div className="mt-2 flex items-end gap-1" aria-hidden="true">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-8 w-3 rounded-sm bg-danger" />
                  ))}
                </div>
              </div>
              <div className="rounded-xl bg-[#E9F5EC] p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-success">
                  JiPange approach
                </p>
                <p className="mt-1 text-lg font-semibold text-success" data-testid="smoother-monthly">
                  {formatKES(Math.round(monthly))}/mo
                </p>
                <p className="text-xs text-[#4B4238]">flat, every month, earning interest</p>
                <div className="mt-2 flex items-end gap-0.5" aria-hidden="true">
                  {Array.from({ length: 12 }, (_, i) => (
                    <div key={i} className="h-2.5 w-1.5 rounded-sm bg-success" />
                  ))}
                </div>
              </div>
            </div>

            <p className="mt-4 rounded-xl bg-[#FFF8EA] p-3 text-sm text-[#4B4238]">
              💰 <em>JiPange Bonus:</em> By smoothing your fees monthly, compound interest at ~
              {(SMOOTHER_MMF_RATE * 100).toFixed(0)}% pays{" "}
              <strong className="text-success">{formatKES(subsidy)}</strong> of your annual total
              for you — equivalent to free school uniforms.
            </p>
          </>
        )}
      </section>

      {/* ── Module 2: the CBC Project Leak cushion ── */}
      <section aria-label="CBC cushion" className="rounded-2xl bg-white p-6 shadow-sm">
        <label className="flex cursor-pointer items-center justify-between gap-3">
          <span className="text-sm font-medium text-[#4B4238]">
            Do you have children in the CBC system?
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={cbc}
            onClick={() => setCbc((v) => !v)}
            className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
              cbc ? "bg-success" : "bg-[#C9BFB2]"
            }`}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
                cbc ? "left-6" : "left-1"
              }`}
            />
          </button>
        </label>
        {cbc && (
          <div className="mt-4 rounded-xl border-2 border-accent bg-[#FFF8EA] p-4 text-sm text-[#4B4238]">
            🛡️ <strong className="text-primary">The CBC Cushion:</strong> We recommend
            maintaining a floating buffer of{" "}
            <strong>{formatKES(CBC_CUSHION_PER_CHILD)} per child</strong> (
            {formatKES(cushionTotal)} total) in a high-speed liquidity MMF (with T+0 M-Pesa
            withdrawal). This ensures unexpected printing, project materials, and
            extra-curricular trips never disrupt your primary monthly budget.
          </div>
        )}
      </section>

      {/* ── Module 3: vehicle allocation ── */}
      {monthly > 0 && (
        <section aria-label="Vehicle allocation" className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-primary">Where each shilling goes</h2>
          <div className="mt-3 space-y-3">
            <div className="rounded-xl border border-[#E5E0D8] p-4">
              <p className="text-sm font-semibold text-primary">📈 Next term&apos;s fees</p>
              <p className="mt-1 text-sm text-[#4B4238]">
                A high-liquidity, M-Pesa integrated MMF (e.g., Sanlam, Britam, ICEA) — hassle-free
                withdrawals every January, May, and September.
              </p>
            </div>
            <div className="rounded-xl border border-[#E5E0D8] p-4">
              <p className="text-sm font-semibold text-primary">
                🏛️ Long-term transitions (High School / Uni)
              </p>
              <p className="mt-1 text-sm text-[#4B4238]">
                A Tier-1 Sacco (e.g., Stima, Safaricom) — the 3× development loan multiplier
                funds future tuition blocks. Plan those stages below.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={lockPlan}
            disabled={locked}
            className={`mt-4 h-12 w-full rounded-full text-base font-semibold transition-colors ${
              locked
                ? "bg-[#E9F5EC] text-success"
                : "bg-primary text-white hover:bg-[#584a3e]"
            }`}
          >
            {locked ? "✓ Locked — see it on your Pesa Picture" : "Lock This Education Plan to My Profile"}
          </button>
          {locked && (
            <p className="mt-2 text-center text-xs text-[#6f6e69]">
              <Link href="/picture" className="font-medium text-primary underline">
                View it on My Pesa Picture →
              </Link>
            </p>
          )}
        </section>
      )}
    </div>
  );
}
