"use client";

import { useMemo, useState } from "react";
import { formatKES } from "@/lib/budget";
import { simulateHouseholdLiquidity } from "@/lib/household-liquidity";
import { MAX_AMOUNT, positiveAmount, typedNumber } from "@/lib/money";

/** A typed amount that may legitimately be zero (no savings, no income); blank is not zero. */
function amountOrNull(raw: string): number | null {
  if (raw.trim() === "") return null;
  const v = typedNumber(raw);
  return Number.isFinite(v) && v >= 0 && v <= MAX_AMOUNT ? v : null;
}
import NumberField from "./NumberField";
import CalculatorDisclaimer from "./CalculatorDisclaimer";

export default function HouseholdResilienceCalculator() {
  const [savings, setSavings] = useState("");
  const [income, setIncome] = useState("");
  const [essentials, setEssentials] = useState("");
  const [debt, setDebt] = useState("0");
  const [shock, setShock] = useState("20");
  const [feeMonth, setFeeMonth] = useState("1");
  const [fee, setFee] = useState("0");

  const result = useMemo(() => {
    // Zero savings and zero income are exactly the households this test is for.
    const reserves = amountOrNull(savings);
    const earnings = amountOrNull(income);
    const costs = positiveAmount(essentials);
    const debtAmount = typedNumber(debt);
    const feeAmount = typedNumber(fee);
    const shockPct = typedNumber(shock);
    const month = typedNumber(feeMonth);
    if (reserves === null || earnings === null || costs === null ||
        !Number.isFinite(debtAmount) || debtAmount < 0 ||
        !Number.isFinite(feeAmount) || feeAmount < 0 ||
        !Number.isFinite(shockPct) || shockPct < 0 || shockPct > 100 ||
        !Number.isSafeInteger(month) || month < 1 || month > 12) return null;
    return simulateHouseholdLiquidity({
      liquidSavings: reserves, monthlyIncome: earnings,
      essentialExpenses: costs, monthlyDebtService: debtAmount,
      incomeShockPct: shockPct,
      obligations: feeAmount > 0 ? [{ month, amount: feeAmount }] : [],
    });
  }, [savings, income, essentials, debt, shock, fee, feeMonth]);

  return (
    <div className="space-y-4">
      <NumberField id="resilience-savings" label="Accessible liquid savings (Ksh)" value={savings} onChange={setSavings} placeholder="e.g. 420000" />
      <NumberField id="resilience-income" label="Monthly take-home income (Ksh)" value={income} onChange={setIncome} placeholder="e.g. 200000" />
      <NumberField id="resilience-essentials" label="Monthly essential spending, excluding loan payments (Ksh)" value={essentials} onChange={setEssentials} placeholder="e.g. 140000" />
      <NumberField id="resilience-debt" label="Monthly debt repayments (Ksh)" value={debt} onChange={setDebt} />
      <NumberField id="resilience-shock" label="Income reduction to simulate" suffix="%" value={shock} onChange={setShock} />
      <NumberField id="resilience-fee" label="One upcoming school-fee or other bill (Ksh)" value={fee} onChange={setFee} />
      <NumberField id="resilience-fee-month" label="Month the upcoming bill falls due (1–12)" value={feeMonth} onChange={setFeeMonth} />
      {result && (
        <section className="space-y-3 rounded-2xl bg-white p-4 shadow-sm" aria-live="polite">
          <h2 className="text-lg font-semibold text-primary">Your 12-month cash-flow stress test</h2>
          <p className="text-sm text-ink-soft">Emergency runway at current spending: <strong>{result.essentialRunwayMonths === null ? "Not applicable" : `${result.essentialRunwayMonths} months`}</strong></p>
          <p className="text-sm text-ink-soft">Income after simulated reduction: <strong>{formatKES(result.stressedMonthlyIncome)}/month</strong></p>
          <p className="text-sm text-ink-soft">First projected cash shortfall: <strong>{result.firstShortfallMonth === null ? "None in 12 months" : `Month ${result.firstShortfallMonth}`}</strong></p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead><tr><th scope="col" className="py-2">Month</th><th scope="col" className="py-2 text-right">Closing cash balance</th></tr></thead>
              <tbody>{result.endingBalanceByMonth.map((balance, index) => (
                <tr key={index} className="border-t border-black/10">
                  <td className="py-2">{index + 1}</td>
                  <td className={`py-2 text-right ${balance < 0 ? "font-semibold text-red-700" : ""}`}>{formatKES(balance)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </section>
      )}
      <CalculatorDisclaimer payroll={false} extraNotes={[
        "Illustrative cash-flow scenario, not a financial forecast or a guarantee.",
        "Only accessible cash savings are included; bond principal, investment returns, inflation and unentered bills are excluded.",
        "Essential expenses must exclude debt repayments to avoid double counting. The bill month is relative to the next month.",
      ]} />
    </div>
  );
}
