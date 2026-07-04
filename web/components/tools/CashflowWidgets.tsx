"use client";

import { useState } from "react";
import NumberField from "./NumberField";

const LUMP_RATE = 19.9; // KSh/kWh average, single lump-sum buy
const STAGGERED_RATE = 16.45; // KSh/kWh average when split buys stay in lower tariff bands
const BUDGETS = [1000, 2000, 5000];

export function KplcOptimizer() {
  const [budget, setBudget] = useState(2000);
  const extraUnits = budget / STAGGERED_RATE - budget / LUMP_RATE;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {BUDGETS.map((b) => (
          <button
            key={b}
            type="button"
            onClick={() => setBudget(b)}
            aria-pressed={budget === b}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              budget === b
                ? "border-primary bg-primary text-white"
                : "border-[#E5E0D8] bg-white text-[#4B4238] hover:bg-[#F1ECE3]"
            }`}
          >
            KSh {b.toLocaleString("en-KE")}
          </button>
        ))}
      </div>
      <p className="rounded-2xl bg-[#FFF8EA] p-4 text-sm text-[#4B4238]">
        💡 <em>Don&apos;t buy all at once!</em> Split your KSh {budget.toLocaleString("en-KE")}{" "}
        budget into two half-month token purchases. This strategy keeps you locked in a lower
        tariff band, gaining you an extra{" "}
        <strong data-testid="kplc-extra">{extraUnits.toFixed(1)} kWh (Units)</strong> for free on
        the exact same spend.
      </p>
    </div>
  );
}

export function PaydayRouter() {
  const [salary, setSalary] = useState("");
  const [rent, setRent] = useState("");
  const [bills, setBills] = useState("");
  const surplus = (Number(salary) || 0) - (Number(rent) || 0) - (Number(bills) || 0);
  return (
    <div className="space-y-4">
      <NumberField id="routerSalary" label="Net monthly salary (KES)" value={salary} onChange={setSalary} placeholder="e.g. 60000" />
      <NumberField id="routerRent" label="Rent (KES)" value={rent} onChange={setRent} placeholder="e.g. 20000" />
      <NumberField id="routerBills" label="Fixed bills (KES)" value={bills} onChange={setBills} placeholder="e.g. 10000" />
      {Number(salary) > 0 && surplus > 0 && (
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-[#4B4238]">
            Your True Weekly Spend Limit:{" "}
            <strong className="text-lg text-primary" data-testid="weekly-limit">
              KSh {(surplus / 4.33).toFixed(0)}
            </strong>
          </p>
          <p className="mt-2 text-xs text-[#4B4238]">
            🔒 <em>Action:</em> To protect your money, move the remaining{" "}
            <strong>KSh {surplus.toFixed(0)}</strong> surplus out of your main M-Pesa wallet and
            into a locked savings pocket or MMF <em>on payday</em> before lifestyle creep handles
            it for you.
          </p>
        </div>
      )}
    </div>
  );
}
