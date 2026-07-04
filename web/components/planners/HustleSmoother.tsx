"use client";

import { useMemo, useState } from "react";
import { formatKES } from "@/lib/budget";
import {
  VENTURE_TYPES,
  maxSafeMonthlyDraw,
  nextCycleRunway,
  type VentureType,
} from "@/lib/hustle";

/**
 * The three-bucket volatile-income smoother: cycle lump sums become a steady
 * monthly salary drawn from an MMF tank, with next cycle's inputs ring-fenced.
 */
export default function HustleSmoother() {
  const [venture, setVenture] = useState<VentureType>("poultry");
  const [cycleDays, setCycleDays] = useState(45);
  const [dayInCycle, setDayInCycle] = useState(10);
  const [inputCosts, setInputCosts] = useState("");
  const [payout, setPayout] = useState("");
  const [activeSavings, setActiveSavings] = useState("");
  const [draw, setDraw] = useState<number | null>(null); // null = follow the safe default

  const parsedCosts = Math.max(0, Number(inputCosts) || 0);
  const parsedPayout = Math.max(0, Number(payout) || 0);
  const parsedSavings = Math.max(0, Number(activeSavings) || 0);

  const safeDraw = useMemo(
    () =>
      maxSafeMonthlyDraw({
        targetLumpSumPayout: parsedPayout,
        inputCostsPerCycle: parsedCosts,
        cycleLengthDays: cycleDays,
      }),
    [parsedPayout, parsedCosts, cycleDays]
  );
  const runway = nextCycleRunway({ activeSavings: parsedSavings, inputCostsPerCycle: parsedCosts });
  const currentDraw = draw ?? Math.round(safeDraw);
  const hasNumbers = parsedPayout > 0 && parsedCosts >= 0 && cycleDays > 0;

  return (
    <div className="space-y-6">
      {/* ── Venture profile ── */}
      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-primary">Your venture</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {VENTURE_TYPES.map((v) => (
            <button
              key={v.value}
              type="button"
              onClick={() => {
                setVenture(v.value);
                setCycleDays(v.defaultCycleDays);
                setDayInCycle(Math.min(dayInCycle, v.defaultCycleDays));
                setDraw(null);
              }}
              aria-pressed={venture === v.value}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                venture === v.value
                  ? "border-accent bg-accent text-[#171717]"
                  : "border-[#E5E0D8] bg-white text-[#4B4238] hover:bg-[#F1ECE3]"
              }`}
            >
              {v.emoji} {v.label}
            </button>
          ))}
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between">
            <label htmlFor="cycle-days" className="text-sm font-medium text-[#4B4238]">
              Cycle length
            </label>
            <span className="text-sm font-semibold text-primary">{cycleDays} days</span>
          </div>
          <input
            id="cycle-days"
            type="range"
            min={14}
            max={365}
            value={cycleDays}
            onChange={(event) => {
              setCycleDays(Number(event.target.value));
              setDraw(null);
            }}
            className="mt-2 h-2 w-full accent-primary"
          />
        </div>

        {(
          [
            ["hustle-costs", "Input costs per cycle (feeds, seeds, ops)", inputCosts, setInputCosts, "e.g. 120000"],
            ["hustle-payout", "Expected lump-sum payout per cycle", payout, setPayout, "e.g. 300000"],
            ["hustle-savings", "Active savings available today", activeSavings, setActiveSavings, "e.g. 80000"],
          ] as const
        ).map(([id, label, value, setter, placeholder]) => (
          <div key={id} className="relative mt-3">
            <label htmlFor={id} className="block text-sm font-medium text-[#4B4238]">
              {label}
            </label>
            <input
              id={id}
              type="number"
              inputMode="numeric"
              min={0}
              value={value}
              onChange={(event) => {
                setter(event.target.value);
                setDraw(null);
              }}
              placeholder={placeholder}
              className="mt-1 h-12 w-full rounded-lg border border-[#E5E0D8] bg-white px-4 text-base focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        ))}
      </section>

      {hasNumbers && (
        <>
          {/* ── Module A: cycle stepper + runway ── */}
          <section aria-label="Cycle runway" className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-primary">Where you are in the cycle</h2>
              <span className="text-xs text-[#4B4238]">
                Day {dayInCycle} of {cycleDays}
              </span>
            </div>
            <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-[#F1ECE3]">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${Math.min(100, (dayInCycle / cycleDays) * 100)}%` }}
              />
            </div>
            <input
              id="day-in-cycle"
              type="range"
              min={0}
              max={cycleDays}
              value={dayInCycle}
              onChange={(event) => setDayInCycle(Number(event.target.value))}
              aria-label="Day in cycle"
              className="mt-2 h-2 w-full accent-primary"
            />

            {runway.protected ? (
              <p className="mt-3 inline-block rounded-full bg-[#E9F5EC] px-4 py-2 text-sm font-semibold text-success">
                🛡️ STATUS: NEXT CYCLE PROTECTED
              </p>
            ) : (
              <div className="mt-3 rounded-xl border-2 border-accent bg-[#FFF4DC] p-3">
                <p className="text-sm font-semibold text-[#946213]">
                  ⚠️ STATUS: RUNWAY GAP EXPOSED
                </p>
                <p className="mt-1 text-sm text-[#4B4238]">
                  You&apos;re {formatKES(runway.shortfall)} short of next cycle&apos;s{" "}
                  {formatKES(parsedCosts)} input costs — ring-fence that first, before drawing a
                  salary.
                </p>
              </div>
            )}
          </section>

          {/* ── Module B: the MMF smoothing tank ── */}
          <section aria-label="Smoothing tank" className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-primary">The MMF smoothing tank</h2>
            <p className="mt-1 text-xs text-[#4B4238]">
              Park the {formatKES(parsedPayout)} payout in a money market fund; draw a salary
              monthly while the rest compounds.
            </p>

            <div className="mt-4 rounded-xl bg-[#F1ECE3] p-4 text-center">
              <p className="text-xs uppercase tracking-wide text-[#6f6e69]">
                Your smoothed monthly salary
              </p>
              <p className="mt-1 text-3xl font-semibold text-primary" data-testid="hustle-draw">
                {formatKES(currentDraw)}/mo
              </p>
            </div>

            <div className="mt-3">
              <div className="flex items-center justify-between">
                <label htmlFor="hustle-slider" className="text-sm font-medium text-[#4B4238]">
                  Configure your drawdown
                </label>
                <span className="text-xs text-[#4B4238]">
                  safe max: {formatKES(safeDraw)}
                </span>
              </div>
              <input
                id="hustle-slider"
                type="range"
                min={0}
                max={Math.max(1000, Math.round(safeDraw * 1.5))}
                step={500}
                value={currentDraw}
                onChange={(event) => setDraw(Number(event.target.value))}
                className="mt-2 h-2 w-full accent-primary"
              />
            </div>

            {currentDraw > safeDraw ? (
              <p className="mt-3 rounded-xl bg-[#FBEAEA] p-3 text-sm text-danger">
                Drawing {formatKES(currentDraw - Math.round(safeDraw))} above the safe line eats
                next cycle&apos;s seed capital — the tank runs dry before the payout lands.
              </p>
            ) : (
              <p className="mt-3 rounded-xl bg-[#E9F5EC] p-3 text-sm text-[#2b4a2b]">
                Sustainable: {formatKES(Math.round(safeDraw) - currentDraw)}/mo stays in the tank
                earning MMF interest, and {formatKES(parsedCosts)} of seed capital is never
                touched.
              </p>
            )}
          </section>

          {/* ── Module C: automation referral ── */}
          <section
            aria-label="Automation"
            className="rounded-2xl border-2 border-accent bg-[#FFF8EA] p-5"
          >
            <h2 className="text-sm font-semibold text-primary">
              ⚙️ Automate the tank — 3 steps
            </h2>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-[#4B4238]">
              <li>
                Open an M-Pesa-integrated MMF (Britam, ICEA Lion, Sanlam) and note its Paybill.
              </li>
              <li>
                From your Business Till / Paybill, set a standing transfer of each payout straight
                to the fund — money never idles in the till.
              </li>
              <li>
                Schedule your {formatKES(currentDraw)} monthly withdrawal to M-Pesa — your salary,
                paid by your hustle.
              </li>
            </ol>
          </section>
        </>
      )}

      <p className="text-xs text-[#4B4238]">
        For guidance only, not financial advice. Yields vary — verify current MMF rates before
        committing.
      </p>
    </div>
  );
}
