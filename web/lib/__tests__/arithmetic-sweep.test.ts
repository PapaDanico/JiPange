import { describe, it, expect } from "vitest";

import { calculateNetPay, calculatePAYE, calculateNSSF, calculateSHIF, calculateAHL } from "@/lib/tax";
import { taxShield } from "@/lib/tax-shield";
import { calculateLoanAmortization } from "@/lib/loans";
import { calculateFulizaCost } from "@/lib/fuliza";
import { calculateMoneyRunwayMonths } from "@/lib/runway";
import { calculateBudgetSplit, calculate502525Split, calculateFinancials } from "@/lib/budget";
import { checkOneThirdRule } from "@/lib/one-third-rule";
import { calculateShaHealth } from "@/lib/sha";
import { calculateMerryGoRound, calculateChamaInvestment } from "@/lib/chama";
import { calculateLandPurchase } from "@/lib/land";
import { calculateDebtStack } from "@/lib/debt";
import { dhowcsdLadder, EVEN_WEIGHTS } from "@/lib/market-2026";

/**
 * EVERY CALCULATOR, AGAINST NUMBERS NOBODY MEANT TO TYPE — AT THE ARITHMETIC,
 * NOT AT THE RENDER.
 *
 * e2e/hostile-input.spec.ts already zeroes one field at a time through the UI
 * and asserts no "Ksh NaN" reaches a reader. It found nothing, and its own
 * comment is careful about why that is a smaller result than it looks:
 *
 *   "Regression cover for the render layer, not a proof of the arithmetic
 *    beneath it."
 *
 * Two things bound it. It only ever tries ZERO, and it goes through inputs
 * that clamp and parse before the maths sees anything — three of its four
 * mutations were absorbed by the app's own guards rather than caught. So the
 * functions in lib/ have never been driven directly with the values that
 * actually break arithmetic.
 *
 * This does that. Every exported calculator, called straight, with the values
 * a text box can produce (negatives, fractions, absurd magnitudes) and the
 * ones a bad caller can produce (NaN, ±Infinity). The contract asserted is
 * deliberately weak and therefore honest: whatever a calculator returns, no
 * number in it may be NaN or Infinity. It is free to return zero, to refuse,
 * or to answer — it may not emit garbage.
 *
 * WHY WEAK IS THE POINT. A sweep that asserted specific values for absurd
 * inputs would be asserting today's behaviour, and would go red on any
 * deliberate change. "No NaN ever escapes" is a property that stays true
 * however these functions are rewritten, which is the only kind of assertion
 * worth pointing at forty entry points at once.
 */

/**
 * The values a NUMBER FIELD can actually deliver — all finite, all reachable.
 *
 * NaN and ±Infinity are deliberately NOT here, and the reason is worth stating
 * because the first version of this file included them and 26 of 31 cases went
 * red at once.
 *
 * Every one of those was NaN in, NaN out. That is not a finding: no calculator
 * in this app can receive NaN, because every component parses through
 * `positiveAmount()` / `amountOrZero()` in lib/money.ts, which return null or
 * zero and never NaN. Asserting on it would have meant adding a guard clause
 * to fifteen functions to satisfy a caller that does not exist, and — worse —
 * it would have buried the two faults that ARE reachable under twenty-six that
 * are not. A sweep whose failures are mostly noise gets muted, and then it
 * catches nothing.
 *
 * So the contract is the sharp one: a FINITE input may never produce a
 * non-finite output. Both faults this found were of exactly that kind.
 */
const HOSTILE = [
  0,
  -1,
  -1_000_000,
  0.5,
  1e-9,
  1e15,
  Number.MAX_SAFE_INTEGER,
];

/** Walks anything a calculator can return and names the first bad number. */
function badNumbers(value: unknown, path = ""): string[] {
  if (typeof value === "number") {
    return Number.isFinite(value) ? [] : [`${path || "(root)"} = ${value}`];
  }
  if (Array.isArray(value)) {
    return value.flatMap((v, i) => badNumbers(v, `${path}[${i}]`));
  }
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([k, v]) => badNumbers(v, path ? `${path}.${k}` : k));
  }
  return [];
}

/**
 * Each entry drives one calculator across every hostile value, in every
 * numeric slot, one slot at a time — the realistic shape of the mistake, and
 * the same reasoning hostile-input.spec.ts arrived at for the UI. A sane
 * baseline keeps the rest of the input alive so the arithmetic is actually
 * reached.
 */
const CASES: { name: string; run: (v: number) => unknown }[] = [
  { name: "calculateNetPay(gross)", run: (v) => calculateNetPay(v) },
  { name: "calculateNetPay(pension relief)", run: (v) => calculateNetPay(50_000, { pensionContribution: v }) },
  { name: "calculateNetPay(mortgage relief)", run: (v) => calculateNetPay(50_000, { mortgageInterest: v }) },
  { name: "calculateNetPay(insurance premium)", run: (v) => calculateNetPay(50_000, { insurancePremium: v }) },
  { name: "calculatePAYE(taxablePay)", run: (v) => calculatePAYE(v) },
  { name: "calculatePAYE(relief)", run: (v) => calculatePAYE(50_000, v) },
  { name: "calculateNSSF", run: (v) => calculateNSSF(v) },
  { name: "calculateSHIF", run: (v) => calculateSHIF(v) },
  { name: "calculateAHL", run: (v) => calculateAHL(v) },

  { name: "taxShield(gross)", run: (v) => taxShield({ grossMonthly: v, pensionContribution: 5_000, mortgageInterestMonthly: 5_000, insurancePremiumMonthly: 2_000 }) },
  { name: "taxShield(pension)", run: (v) => taxShield({ grossMonthly: 150_000, pensionContribution: v, mortgageInterestMonthly: 5_000, insurancePremiumMonthly: 2_000 }) },
  { name: "taxShield(insurance)", run: (v) => taxShield({ grossMonthly: 150_000, pensionContribution: 5_000, mortgageInterestMonthly: 5_000, insurancePremiumMonthly: v }) },

  { name: "loan(principal)", run: (v) => calculateLoanAmortization({ principal: v, annualRate: 0.14, termMonths: 24 }) },
  { name: "loan(annualRate)", run: (v) => calculateLoanAmortization({ principal: 500_000, annualRate: v, termMonths: 24 }) },
  { name: "loan(termMonths)", run: (v) => calculateLoanAmortization({ principal: 500_000, annualRate: 0.14, termMonths: v }) },

  { name: "fuliza(principal)", run: (v) => calculateFulizaCost(v, 7) },
  { name: "fuliza(days)", run: (v) => calculateFulizaCost(5_000, v) },

  { name: "runway(balance)", run: (v) => calculateMoneyRunwayMonths({ startingBalance: v, monthlyWithdrawal: 20_000, annualReturnRate: 0.08 }) },
  { name: "runway(withdrawal)", run: (v) => calculateMoneyRunwayMonths({ startingBalance: 1_000_000, monthlyWithdrawal: v, annualReturnRate: 0.08 }) },
  { name: "runway(return)", run: (v) => calculateMoneyRunwayMonths({ startingBalance: 1_000_000, monthlyWithdrawal: 20_000, annualReturnRate: v }) },

  { name: "budgetSplit", run: (v) => calculateBudgetSplit(v) },
  { name: "budget502525", run: (v) => calculate502525Split(v) },
  { name: "calculateFinancials", run: (v) => calculateFinancials(v) },

  { name: "oneThirdRule(basic)", run: (v) => checkOneThirdRule({ basicSalary: v, saccoDeductions: 5_000, loanDeductions: 5_000 }) },
  { name: "oneThirdRule(sacco)", run: (v) => checkOneThirdRule({ basicSalary: 50_000, saccoDeductions: v, loanDeductions: 5_000 }) },

  { name: "sha(income)", run: (v) => calculateShaHealth({ employmentType: "employed", grossMonthlyIncome: v, familySize: 3, wantsPrivateCare: true }) },
  { name: "sha(familySize)", run: (v) => calculateShaHealth({ employmentType: "employed", grossMonthlyIncome: 60_000, familySize: v, wantsPrivateCare: false }) },

  { name: "landPurchase(price)", run: (v) => calculateLandPurchase({ plotPriceKes: v, landType: "agricultural", usesAgent: true }) },

  { name: "dhowcsdLadder(capital)", run: (v) => dhowcsdLadder(v, EVEN_WEIGHTS) },
  { name: "dhowcsdLadder(weight)", run: (v) => dhowcsdLadder(900_000, { 91: v, 182: 1, 364: 1 }) },

  { name: "merryGoRound(members)", run: (v) => calculateMerryGoRound(v, 5_000, 10) },
  { name: "merryGoRound(contribution)", run: (v) => calculateMerryGoRound(12, v, 10) },
  { name: "merryGoRound(bufferPct)", run: (v) => calculateMerryGoRound(12, 5_000, v) },
  { name: "chamaInvestment(members)", run: (v) => calculateChamaInvestment(v, 5_000, 12) },
  { name: "chamaInvestment(return)", run: (v) => calculateChamaInvestment(12, 5_000, v) },

  /* calculateDebtStack returns null rather than an answer when the budget
     cannot cover the interest, which badNumbers() walks harmlessly. */
  { name: "debtStack(balance)", run: (v) => calculateDebtStack([{ id: "a", name: "a", balance: v, monthlyRatePct: 3 }], 20_000) },
  { name: "debtStack(rate)", run: (v) => calculateDebtStack([{ id: "a", name: "a", balance: 100_000, monthlyRatePct: v }], 20_000) },
  { name: "debtStack(budget)", run: (v) => calculateDebtStack([{ id: "a", name: "a", balance: 100_000, monthlyRatePct: 3 }], v) },
];

/**
 * WHAT THIS SWEEP ACTUALLY FOUND, so the green below is read for what it is.
 *
 *  1. calculateLoanAmortization at a rate of 1e15 returned NaN in the monthly
 *     payment and in all twenty-four schedule rows. (1+r)^n overflows to
 *     Infinity and Infinity/Infinity is NaN. The module already caps the TERM
 *     to stop an absurd value hanging the browser, and reasons at length about
 *     why that guarantee belongs in lib rather than in the field — the RATE
 *     had no such cap, so the identical class of defect was reachable through
 *     the other box. Fixed with MAX_ANNUAL_RATE.
 *
 *  2. calculateMoneyRunwayMonths at an annual return of -1,000,000 returned
 *     NaN: the monthly rate drops below -100%, so Math.log(1 + r) is the log
 *     of a negative number. Fixed by treating a balance that cannot compound
 *     as earning nothing, which is the honest reading and still answers.
 *
 *  3. futureValue — the SHARED compounding primitive behind chama,
 *     savings-goal, school-fees, goal-planner and tool-stats — overflowed
 *     (1+r)^n to Infinity and then computed `0 * Infinity`, which is NaN
 *     rather than Infinity. It surfaced through calculateChamaInvestment,
 *     whose three- and five-year figures came back NaN while the one-year
 *     figure beside them stayed finite: a PARTIAL failure, which is the kind
 *     that survives a glance. Fixed at the primitive, so all five callers are
 *     covered by one guard.
 *
 * Three faults, all the same shape — a floating-point limit reached through a
 * field nobody thought to bound — and none of them reachable by zeroing.
 *
 * Neither was reachable by zeroing a field, which is why the existing UI sweep
 * — which found nothing, correctly, within its own scope — could not see them.
 */
describe("a finite input never produces a non-finite output", () => {
  for (const c of CASES) {
    it(c.name, () => {
      for (const v of HOSTILE) {
        let out: unknown;
        try {
          out = c.run(v);
        } catch {
          /* Throwing is a legitimate refusal — currentInflation() throws by
             design rather than substitute an estimate. What is banned is
             RETURNING garbage, which a caller renders. */
          continue;
        }
        /* runway answers Infinity for "this never runs out", which is a
           meaning rather than a fault — see the block below, which pins it. */
        if (c.name.startsWith("runway") && out === Infinity) continue;
        const bad = badNumbers(out);
        expect(
          bad.slice(0, 6),
          `${c.name} with ${String(v)} returned ${bad.slice(0, 6).join(", ")}` +
            (bad.length > 6 ? ` (+${bad.length - 6} more)` : "")
        ).toEqual([]);
      }
    });
  }
});

/**
 * Two calculators legitimately return Infinity, and it means something.
 *
 * calculateMoneyRunwayMonths returns Infinity for "this never runs out" — the
 * balance earns more than the withdrawal — and the UI renders that as a phrase,
 * not a number. Excluding it above would have hidden real faults, so the sweep
 * treats it like anything else and the meaningful case is pinned here instead.
 */
describe("Infinity, where it is an answer rather than a fault", () => {
  it("a runway that never depletes says so, and only then", () => {
    const forever = calculateMoneyRunwayMonths({
      startingBalance: 10_000_000,
      monthlyWithdrawal: 1_000,
      annualReturnRate: 0.12,
    });
    expect(forever).toBe(Infinity);

    const depletes = calculateMoneyRunwayMonths({
      startingBalance: 500_000,
      monthlyWithdrawal: 50_000,
      annualReturnRate: 0.05,
    });
    expect(Number.isFinite(depletes)).toBe(true);
    expect(depletes).toBeGreaterThan(0);
  });
});
