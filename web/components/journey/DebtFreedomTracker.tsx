"use client";

import { useState } from "react";
import { formatKES } from "@/lib/budget";
import type { FulizaTax } from "@/lib/journey";

function addMonths(months: number): string {
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return date.toLocaleDateString("en-KE", { month: "long", year: "numeric" });
}

/**
 * Component 2 — the gamified "Debt Freedom Date" tracker (Recovery theme).
 * Sliders for the debt size and monthly payload drive a live freedom date,
 * and the leaky-bucket vs savings-cushion bars shift as commitment grows.
 */
export default function DebtFreedomTracker({
  fulizaTax,
  microFundTarget,
}: {
  fulizaTax: FulizaTax;
  microFundTarget: number;
}) {
  const [debt, setDebt] = useState(Math.max(1000, fulizaTax.estOutstanding));
  const [payment, setPayment] = useState(
    Math.max(1000, Math.ceil(fulizaTax.estOutstanding / 4 / 500) * 500)
  );

  const monthsToFreedom = Math.max(1, Math.ceil(debt / payment));
  const monthsToMicroFund = Math.ceil(microFundTarget / payment);

  // The leaky bucket drains as the payload grows: fees stop the moment the
  // debt is gone, so weight the leak by how long it survives (capped 12 mo).
  const leakWeight = Math.min(12, monthsToFreedom) * fulizaTax.estMonthlyCost;
  const cushionWeight = payment * 12;
  const leakShare = Math.round((leakWeight / (leakWeight + cushionWeight)) * 100);

  return (
    <section
      aria-label="Debt freedom date"
      className="rounded-2xl bg-white p-5 shadow-sm"
    >
      <h2 className="text-base font-semibold text-primary">Your Debt Freedom Date</h2>

      <div className="mt-3 rounded-xl bg-canvas p-4 text-center">
        <p className="text-xs uppercase tracking-wide text-faint">
          Paying {formatKES(payment)}/month
        </p>
        <p className="mt-1 text-3xl font-semibold text-primary" data-testid="freedom-date">
          {addMonths(monthsToFreedom)}
        </p>
        <p className="mt-1 text-sm text-ink-soft">
          {monthsToFreedom} {monthsToFreedom === 1 ? "month" : "months"} until the overdraft is
          gone — then {monthsToMicroFund} more to your {formatKES(microFundTarget)}{" "}
          micro-emergency fund.
        </p>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between">
          <label htmlFor="debt-size" className="text-sm font-medium text-ink-soft">
            Outstanding mobile debt
          </label>
          <span className="text-sm font-semibold text-primary">{formatKES(debt)}</span>
        </div>
        <input
          id="debt-size"
          type="range"
          min={1000}
          max={100000}
          step={500}
          value={debt}
          onChange={(event) => setDebt(Number(event.target.value))}
          className="mt-2 h-2 w-full accent-primary"
        />
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between">
          <label htmlFor="debt-payload" className="text-sm font-medium text-ink-soft">
            Monthly debt payload
          </label>
          <span className="text-sm font-semibold text-primary">{formatKES(payment)}/mo</span>
        </div>
        <input
          id="debt-payload"
          type="range"
          min={500}
          max={50000}
          step={500}
          value={payment}
          onChange={(event) => setPayment(Number(event.target.value))}
          className="mt-2 h-2 w-full accent-primary"
        />
      </div>

      {/* Leaky bucket → savings cushion */}
      <div className="mt-4 space-y-2" aria-hidden="true">
        <div>
          <p className="text-xs text-ink-soft">
            🕳️ Leaky bucket — fees while the debt survives
          </p>
          <div className="mt-1 h-3 w-full overflow-hidden rounded-full bg-canvas">
            <div
              className="h-full rounded-full bg-danger transition-all duration-500"
              style={{ width: `${Math.max(4, leakShare)}%` }}
            />
          </div>
        </div>
        <div>
          <p className="text-xs text-ink-soft">🛟 Active savings cushion — where it goes next</p>
          <div className="mt-1 h-3 w-full overflow-hidden rounded-full bg-canvas">
            <div
              className="h-full rounded-full bg-success transition-all duration-500"
              style={{ width: `${Math.max(4, 100 - leakShare)}%` }}
            />
          </div>
        </div>
      </div>
      <p className="mt-2 text-xs text-faint">
        Push the payload up and watch the leak shrink: every shilling moved out of overdraft
        reliance stops paying fees and starts earning instead.
      </p>
    </section>
  );
}
