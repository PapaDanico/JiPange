"use client";

import { useState } from "react";
import HowItWorks from "./HowItWorks";
import NumberField from "./NumberField";
import { formatKES as kes } from "@/lib/budget";

const LUMP_RATE = 19.9; // KSh/kWh average, single lump-sum buy
const STAGGERED_RATE = 16.45; // KSh/kWh average when split buys stay in lower tariff bands
const BUDGETS = [1000, 2000, 5000];

export function KplcOptimizer() {
  const [budget, setBudget] = useState(2000);
  const [custom, setCustom] = useState("");
  const active = Number(custom) > 0 ? Number(custom) : budget;
  const extraUnits = active / STAGGERED_RATE - active / LUMP_RATE;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {BUDGETS.map((b) => (
          <button
            key={b}
            type="button"
            onClick={() => { setBudget(b); setCustom(""); }}
            aria-pressed={active === b}
            className={`inline-flex min-h-11 items-center justify-center rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              active === b
                ? "border-primary bg-primary text-white"
                : "border-border bg-white text-ink-soft hover:bg-canvas"
            }`}
          >
            KSh {b.toLocaleString("en-KE")}
          </button>
        ))}
      </div>
      <NumberField
        id="kplcCustom"
        label="Or your exact monthly token budget (KES)"
        value={custom}
        onChange={setCustom}
        placeholder="e.g. 3500"
      />
      <p className="rounded-2xl bg-accent-soft p-4 text-sm text-ink-soft">
        💡 <em>Don&apos;t buy all at once!</em> Split your {kes(active)}{" "}
        budget into two half-month token purchases. This strategy keeps you locked in a lower
        tariff band, gaining you an extra{" "}
        <strong data-testid="kplc-extra">{extraUnits.toFixed(1)} kWh (Units)</strong> for free on
        the exact same spend.
      </p>
      <HowItWorks
        steps={[
          "Set your real monthly token budget — a preset or your exact figure.",
          "KPLC's tariff tiers charge more per unit the more you buy in one purchase.",
          "Buy half your tokens at the start of the month and half mid-month to stay in the cheaper band.",
          "The extra kWh shown is what the same money gains you — set two M-Pesa reminders and collect it.",
        ]}
      />
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
          <p className="text-sm text-ink-soft">
            Your True Weekly Spend Limit:{" "}
            <strong className="text-lg text-primary" data-testid="weekly-limit">
              {kes(surplus / 4.33)}
            </strong>
          </p>
          <p className="mt-2 text-xs text-ink-soft">
            🔒 <em>Action:</em> To protect your money, move the remaining{" "}
            <strong>{kes(surplus)}</strong> surplus out of your main M-Pesa wallet and
            into a locked savings pocket or MMF <em>on payday</em> before lifestyle creep handles
            it for you.
          </p>
        </div>
      )}
      <HowItWorks
        steps={[
          "Enter your net salary and the two fixed outflows — rent and bills.",
          "What's left is your floating surplus; ÷4.33 weeks gives your true weekly spend limit.",
          "On payday, move the surplus out of your main M-Pesa wallet into a locked pocket or MMF before it evaporates.",
          "Withdraw only the weekly limit back — the wallet you see is the money you spend.",
        ]}
      />
    </div>
  );
}
