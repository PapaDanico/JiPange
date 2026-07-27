"use client";

import { useState } from "react";
import HowItWorks from "./HowItWorks";
import NumberField from "./NumberField";
import { formatKES as kes } from "@/lib/budget";

/**
 * KPLC prepaid tariff bands, as they actually work.
 *
 * This tool used to say: split your monthly token budget into two purchases to
 * stay in a lower band and collect free units. It quoted a 19.9 vs 16.45
 * Ksh/kWh gap and put a number on the saving.
 *
 * The bands do not work that way. EPRA/KPLC define a "Pre-paid Unit Purchase
 * Period" of one calendar month, and units accumulate across every purchase
 * inside it — exactly as a post-paid billing period does. Two Ksh 500 buys in
 * the same month reach the same cumulative total as one Ksh 1,000 buy and are
 * charged identically. The saving was not small or stale. It was zero, and the
 * tool asked people to set two M-PESA reminders a month to collect it.
 *
 * What is true is more useful, and needs no hardcoded tariff at all:
 *
 *   - The lever is TOTAL units in the month, not how many purchases it took.
 *   - Your tariff CATEGORY comes from a rolling three-month average, so a
 *     heavy month raises what you pay in the months that follow.
 *   - Fixed monthly charges are recovered on the FIRST purchase of the month,
 *     so a very small first buy returns very few units and looks like a scam.
 *
 * The rate is read from the reader's own last token receipt rather than typed
 * here. That is not a workaround for the missing tariff table — it is more
 * accurate than one, because the all-in rate depends on their category, fuel
 * and forex pass-throughs, levies and any debt recovery. Their receipt already
 * carries the answer for their meter.
 */
const BAND_LIFELINE_UNITS = 30; // DC1, per the EPRA domestic schedule
const BAND_ORDINARY_UNITS = 100; // DC2 ceiling; above this is DC3

function bandFor(units: number): { name: string; note: string } {
  if (units <= BAND_LIFELINE_UNITS) {
    return {
      name: "DC1 (lifeline)",
      note: "the cheapest domestic band — your whole month sits inside it",
    };
  }
  if (units <= BAND_ORDINARY_UNITS) {
    return {
      name: "DC2 (ordinary)",
      note: `units past the first ${BAND_LIFELINE_UNITS} this month cost more than the lifeline rate`,
    };
  }
  return {
    name: "DC3 (ordinary, high use)",
    note: `everything past ${BAND_ORDINARY_UNITS} units this month is charged at the top domestic rate`,
  };
}

export function KplcOptimizer() {
  const [budget, setBudget] = useState("");
  const [lastCost, setLastCost] = useState("");
  const [lastUnits, setLastUnits] = useState("");

  const cost = Number(lastCost) || 0;
  const units = Number(lastUnits) || 0;
  const monthly = Number(budget) || 0;
  const effectiveRate = cost > 0 && units > 0 ? cost / units : 0;
  const monthUnits = effectiveRate > 0 && monthly > 0 ? monthly / effectiveRate : 0;
  const band = monthUnits > 0 ? bandFor(monthUnits) : null;

  return (
    <div className="space-y-4">
      <NumberField
        id="kplcBudget"
        label="Your monthly token budget (Ksh)"
        value={budget}
        onChange={setBudget}
        placeholder="e.g. 2000"
      />
      <NumberField
        id="kplcLastCost"
        label="Your last token purchase (Ksh)"
        value={lastCost}
        onChange={setLastCost}
        placeholder="e.g. 1000"
      />
      <NumberField
        id="kplcLastUnits"
        label="Units you received on that purchase (kWh)"
        value={lastUnits}
        onChange={setLastUnits}
        placeholder="e.g. 48.6"
      />

      {band !== null && (
        <div className="rounded-2xl bg-white p-5 shadow-sm" data-testid="kplc-band">
          <p className="text-sm text-ink-soft">
            Your last purchase worked out at{" "}
            {/* Two decimals, not the shilling formatter. A unit rate of 19.23
                rounds to "Ksh 19", and the difference across a month's units is
                real money — the whole point of this card is the precision. */}
            <strong className="text-primary">Ksh {effectiveRate.toFixed(2)} per unit</strong> —
            all charges included, for your meter.
          </p>
          <p className="mt-2 text-sm text-ink-soft">
            At that rate {kes(monthly)} buys roughly{" "}
            <strong className="text-lg text-primary" data-testid="kplc-units">
              {monthUnits.toFixed(1)} units
            </strong>{" "}
            in a month, which puts you in <strong>{band.name}</strong> — {band.note}.
          </p>
        </div>
      )}

      <p className="rounded-2xl bg-accent-soft p-4 text-sm text-ink-soft">
        ⚡ <em>Splitting your purchase does not help.</em> KPLC counts units across the whole
        calendar month, so two Ksh 500 buys are charged exactly like one Ksh 1,000 buy. The
        levers that do work: use less in total, remember your tariff category follows a
        three-month rolling average, and don&apos;t make your first buy of the month tiny —
        that is the one carrying the fixed monthly charges.
      </p>

      <HowItWorks
        steps={[
          "Take your last KPLC token receipt — it shows what you paid and the units you got.",
          "Those two numbers give your real all-in rate, including levies and pass-through charges that no published table can tell you.",
          "Your monthly budget at that rate is roughly the units you will buy this month.",
          "Bands are cumulative over the calendar month, so that total — not the number of purchases — decides what your last units cost.",
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
      <NumberField id="routerSalary" label="Net monthly salary (Ksh)" value={salary} onChange={setSalary} placeholder="e.g. 60000" />
      <NumberField id="routerRent" label="Rent (Ksh)" value={rent} onChange={setRent} placeholder="e.g. 20000" />
      <NumberField id="routerBills" label="Fixed bills (Ksh)" value={bills} onChange={setBills} placeholder="e.g. 10000" />
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
      {Number(salary) > 0 && surplus <= 0 && (
        // The tool used to render nothing here — no card, no sentence — which
        // silently abandoned the one user it most needs to reach: the person
        // whose rent and bills already exceed their salary. A blank screen
        // reads as "you typed something wrong", not "here is your number".
        <div className="rounded-2xl bg-white p-5 shadow-sm" data-testid="router-shortfall">
          <p className="text-sm text-ink-soft">
            Your rent and bills come to{" "}
            <strong>{kes((Number(rent) || 0) + (Number(bills) || 0))}</strong> against a{" "}
            {kes(Number(salary))} salary — a shortfall of{" "}
            <strong className="text-lg text-primary">{kes(Math.abs(surplus))}</strong> every month.
          </p>
          <p className="mt-2 text-xs text-ink-soft">
            There is no surplus to route, so routing is not the fix. The gap has to close on one of
            the two fixed lines before a weekly limit means anything — rent is usually the larger
            and the more movable of the two.
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
