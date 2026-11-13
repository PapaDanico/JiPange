import { assumedMmfYield } from "./mmf-assumption";
import { finiteOr } from "./money";

/**
 * Multi-loan debt escape planner using the avalanche method (highest effective
 * monthly rate first). Designed for the Kenyan mobile loan context where lenders
 * charge flat daily or monthly fees rather than APR-based compound interest.
 */

/** Approximate effective monthly rates for common Kenyan mobile lenders.
 *  Rates are estimates — always verify the current rate in the lender's app. */
export const PRESET_LENDERS: { name: string; monthlyRatePct: number }[] = [
  { name: "Fuliza M-PESA", monthlyRatePct: 32 }, // 1.083%/day × 30
  { name: "Tala", monthlyRatePct: 13 },
  { name: "Branch", monthlyRatePct: 12 },
  { name: "Zenka", monthlyRatePct: 10 },
  { name: "KCB M-PESA", monthlyRatePct: 5 },
  { name: "Timiza", monthlyRatePct: 8 },
  { name: "Other mobile lender", monthlyRatePct: 10 },
];

// The shared, feed-anchored assumption. This was 0.118 under a comment
// calling the divergence from TARGET_MMF_YIELD a product call rather than a
// mechanical fix — it was neither. See lib/mmf-assumption.ts.
const MMF_ANNUAL_RATE = assumedMmfYield();
const MAX_MONTHS = 120;

export interface LoanInput {
  id: string;
  name: string;
  balance: number;
  monthlyRatePct: number;
  /**
   * A one-off charge the lender takes to close the loan (an early-settlement or
   * exit fee), in shillings. Optional; absent means none. It is paid when the
   * loan's balance reaches zero, carries no interest, and counts towards the
   * cost and the months, so a plan that has to pay it says so.
   */
  settlementFee?: number;
}

export interface LoanPayoffDetail {
  id: string;
  name: string;
  originalBalance: number;
  monthlyRatePct: number;
  aprPct: number;
  avalancheRank: number;
  totalInterestPaid: number;
  /** The one-off closing fee this loan cost, 0 when none was entered. */
  settlementFeePaid: number;
  clearedAtMonth: number;
}

export interface DebtStackResult {
  totalBalance: number;
  totalMonthlyInterest: number;
  loans: LoanPayoffDetail[];
  monthsToDebtFree: number;
  totalInterestPaid: number;
  /** Closing fees paid across all loans, on top of interest. */
  totalFeesPaid: number;
  interestSavedVsMinOnly: number;
  mmfValue12m: number;
  debtFreeLabel: string;
  timeline: Array<{ month: number; remaining: number }>;
}

/**
 * Which loan the spare money goes to first. Every strategy pays the same
 * budget and the same interest on the other loans; only the TARGET differs, so
 * the comparison is like for like.
 *
 *  avalanche  highest monthly rate: least total interest.
 *  snowball   smallest balance: the first loan clears soonest, which is a
 *             behavioural win, not a financial one.
 *  relief     largest monthly interest bill in shillings: frees the most
 *             monthly cash soonest, which matters when the month is tight.
 *
 * Non-target loans are held flat by paying their interest, so balances do not
 * move except for the target and the order is stable for the whole plan.
 */
export type DebtStrategy = "avalanche" | "snowball" | "relief";

const STRATEGY_ORDER: Record<DebtStrategy, (a: LoanInput, b: LoanInput) => number> = {
  avalanche: (a, b) => b.monthlyRatePct - a.monthlyRatePct,
  snowball: (a, b) => a.balance - b.balance,
  relief: (a, b) => b.balance * b.monthlyRatePct - a.balance * a.monthlyRatePct,
};

export function calculateDebtStack(
  loans: LoanInput[],
  monthlyBudget: number,
  strategy: DebtStrategy = "avalanche"
): DebtStackResult | null {
  // >= 0, not > 0 — a 0% loan (e.g. interest-free from family) still owes
  // real money and belongs in the payoff plan; the avalanche loop below
  // naturally deprioritizes it since it never accrues interest to target.
  const valid = loans.filter((l) => l.balance > 0 && l.monthlyRatePct >= 0);
  if (valid.length === 0 || monthlyBudget <= 0) return null;

  const totalBalance = valid.reduce((s, l) => s + l.balance, 0);
  const totalMonthlyInterest = valid.reduce(
    (s, l) => s + l.balance * (l.monthlyRatePct / 100),
    0
  );

  // Budget must exceed total monthly interest to make forward progress.
  if (monthlyBudget <= totalMonthlyInterest) return null;

  // Order by the chosen strategy; ties keep the avalanche order so the result is deterministic.
  const sorted = [...valid].sort(
    (a, b) => STRATEGY_ORDER[strategy](a, b) || STRATEGY_ORDER.avalanche(a, b)
  );

  type State = {
    id: string;
    name: string;
    originalBalance: number;
    rate: number;
    balance: number;
    interestPaid: number;
    clearedAtMonth: number;
    rank: number;
    fee: number;
    feeCharged: boolean;
    feesPaid: number;
  };

  const states: State[] = sorted.map((l, i) => ({
    id: l.id,
    name: l.name,
    originalBalance: l.balance,
    rate: l.monthlyRatePct / 100,
    balance: l.balance,
    interestPaid: 0,
    clearedAtMonth: -1,
    rank: i + 1,
    fee: Number.isFinite(l.settlementFee) && (l.settlementFee ?? 0) > 0 ? (l.settlementFee as number) : 0,
    feeCharged: false,
    feesPaid: 0,
  }));

  // When a loan's balance reaches zero, its closing fee (if any) becomes the
  // amount still owed, at no interest; only once that is paid is it cleared.
  const markPaid = (st: State, month: number) => {
    if (st.balance >= 0.01) return;
    if (st.fee > 0 && !st.feeCharged) {
      st.feeCharged = true;
      st.balance = st.fee;
      st.rate = 0;
      st.feesPaid = st.fee;
      return;
    }
    st.balance = 0;
    if (st.clearedAtMonth === -1) st.clearedAtMonth = month;
  };

  let month = 0;
  let totalInterestPaid = 0;
  const timeline: Array<{ month: number; remaining: number }> = [
    { month: 0, remaining: Math.round(totalBalance) },
  ];

  while (states.some((s) => s.balance > 0.01) && month < MAX_MONTHS) {
    month++;

    // Accrue interest on all active loans, tracking this month's amount per loan.
    const accrued = states.map((s) => {
      if (s.balance <= 0) return 0;
      const interest = s.balance * s.rate;
      s.balance += interest;
      s.interestPaid += interest;
      totalInterestPaid += interest;
      return interest;
    });

    let remaining = monthlyBudget;

    // True avalanche: find the highest-rate active loan (target for surplus).
    const targetIdx = states.findIndex((s) => s.balance > 0.01);

    // Pay the minimum (just the interest accrued) on every non-target active loan
    // so their balances stay flat while the target is being eliminated.
    for (let i = 0; i < states.length; i++) {
      if (i === targetIdx || states[i].balance < 0.01 || remaining <= 0) continue;
      const minPay = Math.min(remaining, accrued[i], states[i].balance);
      states[i].balance -= minPay;
      remaining -= minPay;
      markPaid(states[i], month);
    }

    // Pour all remaining budget into avalanche targets; cascade if a loan clears mid-month.
    let surplus = remaining;
    while (surplus > 0) {
      const nextTarget = states.findIndex((s) => s.balance > 0.01);
      if (nextTarget < 0) break;
      const pay = Math.min(surplus, states[nextTarget].balance);
      states[nextTarget].balance -= pay;
      surplus -= pay;
      markPaid(states[nextTarget], month);
    }

    timeline.push({
      month,
      remaining: Math.round(states.reduce((s, st) => s + Math.max(0, st.balance), 0)),
    });
  }

  if (states.some((s) => s.balance > 0.01)) return null;

  // Interest saved vs paying only minimums (just interest, no principal) for the same N months.
  // Paying exactly the monthly interest keeps balances flat, so cost = totalMonthlyInterest * N.
  const interestSavedVsMinOnly = Math.round(Math.max(0, totalMonthlyInterest * month - totalInterestPaid));

  // What the repayment budget grows to in an MMF at 11.8% p.a. for 12 months post-debt-freedom.
  const r = MMF_ANNUAL_RATE / 12;
  const mmfValue12m =
    r > 0
      ? Math.round(monthlyBudget * ((Math.pow(1 + r, 12) - 1) / r))
      : Math.round(monthlyBudget * 12);

  const now = new Date();
  const freeDate = new Date(now.getFullYear(), now.getMonth() + month);
  const debtFreeLabel = freeDate.toLocaleDateString("en-KE", { month: "long", year: "numeric" });

  const loanDetails: LoanPayoffDetail[] = states.map((s) => {
    const monthlyRatePct = s.rate * 100;
    return {
      id: s.id,
      name: s.name,
      originalBalance: s.originalBalance,
      monthlyRatePct,
      aprPct: Math.round(((Math.pow(1 + s.rate, 12) - 1) * 100) * 10) / 10,
      avalancheRank: s.rank,
      totalInterestPaid: Math.round(s.interestPaid),
      settlementFeePaid: Math.round(s.feesPaid),
      clearedAtMonth: s.clearedAtMonth,
    };
  });

  return {
    totalBalance,
    totalMonthlyInterest: Math.round(totalMonthlyInterest),
    loans: loanDetails,
    monthsToDebtFree: month,
    totalInterestPaid: Math.round(totalInterestPaid),
    totalFeesPaid: Math.round(states.reduce((a, st) => a + st.feesPaid, 0)),
    interestSavedVsMinOnly,
    mmfValue12m,
    debtFreeLabel,
    timeline,
  };
}

/**
 * The largest monthly rate the debt tools will model. 100% a month is already
 * about 409,500% a year, past the harshest mobile credit by orders of
 * magnitude; compounding anything larger twelve times overflows to Infinity,
 * which is what typing "1e308" into the rate field used to print beside
 * "effective APR".
 */
export const MAX_MONTHLY_RATE_PCT = 100;

/**
 * A typed monthly rate (in percent), or null when it is not one a lender could
 * charge. Blank reads as 0% — the calculator has always counted a loan with a
 * balance and no rate as interest-free rather than dropping it from the plan.
 */
export function monthlyRateOrNull(raw: unknown): number | null {
  const rate = Number(raw);
  if (!Number.isFinite(rate) || rate < 0 || rate > MAX_MONTHLY_RATE_PCT) return null;
  return rate;
}

/** A monthly rate compounded to its effective annual rate, in percent. */
export function effectiveAprPct(monthlyRatePct: number): number {
  return finiteOr((Math.pow(1 + monthlyRatePct / 100, 12) - 1) * 100);
}

export interface StrategyComparison {
  strategy: DebtStrategy;
  result: DebtStackResult;
  /** Extra interest against the cheapest strategy, in shillings. */
  extraInterestVsBest: number;
  /** Extra months against the fastest strategy. */
  extraMonthsVsBest: number;
}

/** Every strategy on the same loans and budget, or [] when the plan cannot be paid off. */
export function compareStrategies(loans: LoanInput[], monthlyBudget: number): StrategyComparison[] {
  const all = (["avalanche", "snowball", "relief"] as DebtStrategy[]).flatMap((strategy) => {
    const result = calculateDebtStack(loans, monthlyBudget, strategy);
    return result ? [{ strategy, result }] : [];
  });
  if (all.length === 0) return [];
  const minInterest = Math.min(...all.map((a) => a.result.totalInterestPaid));
  const minMonths = Math.min(...all.map((a) => a.result.monthsToDebtFree));
  return all.map((a) => ({
    ...a,
    extraInterestVsBest: a.result.totalInterestPaid - minInterest,
    extraMonthsVsBest: a.result.monthsToDebtFree - minMonths,
  }));
}
