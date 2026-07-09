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

const MMF_ANNUAL_RATE = 0.118;
const MAX_MONTHS = 120;

export interface LoanInput {
  id: string;
  name: string;
  balance: number;
  monthlyRatePct: number;
}

export interface LoanPayoffDetail {
  id: string;
  name: string;
  originalBalance: number;
  monthlyRatePct: number;
  aprPct: number;
  avalancheRank: number;
  totalInterestPaid: number;
  clearedAtMonth: number;
}

export interface DebtStackResult {
  totalBalance: number;
  totalMonthlyInterest: number;
  loans: LoanPayoffDetail[];
  monthsToDebtFree: number;
  totalInterestPaid: number;
  interestSavedVsMinOnly: number;
  mmfValue12m: number;
  debtFreeLabel: string;
}

export function calculateDebtStack(
  loans: LoanInput[],
  monthlyBudget: number
): DebtStackResult | null {
  const valid = loans.filter((l) => l.balance > 0 && l.monthlyRatePct > 0);
  if (valid.length === 0 || monthlyBudget <= 0) return null;

  const totalBalance = valid.reduce((s, l) => s + l.balance, 0);
  const totalMonthlyInterest = valid.reduce(
    (s, l) => s + l.balance * (l.monthlyRatePct / 100),
    0
  );

  // Budget must exceed total monthly interest to make forward progress.
  if (monthlyBudget <= totalMonthlyInterest) return null;

  // Avalanche: sort highest monthly rate first.
  const sorted = [...valid].sort((a, b) => b.monthlyRatePct - a.monthlyRatePct);

  type State = {
    id: string;
    name: string;
    originalBalance: number;
    rate: number;
    balance: number;
    interestPaid: number;
    clearedAtMonth: number;
    rank: number;
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
  }));

  let month = 0;
  let totalInterestPaid = 0;

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
      if (states[i].balance < 0.01) {
        states[i].balance = 0;
        if (states[i].clearedAtMonth === -1) states[i].clearedAtMonth = month;
      }
    }

    // Pour all remaining budget into the target loan.
    if (targetIdx >= 0 && states[targetIdx].balance > 0.01 && remaining > 0) {
      const pay = Math.min(remaining, states[targetIdx].balance);
      states[targetIdx].balance -= pay;
      if (states[targetIdx].balance < 0.01) {
        states[targetIdx].balance = 0;
        if (states[targetIdx].clearedAtMonth === -1) states[targetIdx].clearedAtMonth = month;
      }
    }
  }

  if (states.some((s) => s.balance > 0.01)) return null;

  // Interest saved vs paying only minimums (just interest, no principal) for the same N months.
  // Paying exactly the monthly interest keeps balances flat, so cost = totalMonthlyInterest * N.
  const minOnlyCostSamePeriod = Math.round(totalMonthlyInterest * month);
  const interestSavedVsMinOnly = Math.max(0, minOnlyCostSamePeriod - Math.round(totalInterestPaid));

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
    const input = valid.find((l) => l.id === s.id)!;
    return {
      id: s.id,
      name: s.name,
      originalBalance: s.originalBalance,
      monthlyRatePct: input.monthlyRatePct,
      aprPct: input.monthlyRatePct * 12,
      avalancheRank: s.rank,
      totalInterestPaid: Math.round(s.interestPaid),
      clearedAtMonth: s.clearedAtMonth,
    };
  });

  return {
    totalBalance,
    totalMonthlyInterest: Math.round(totalMonthlyInterest),
    loans: loanDetails,
    monthsToDebtFree: month,
    totalInterestPaid: Math.round(totalInterestPaid),
    interestSavedVsMinOnly,
    mmfValue12m,
    debtFreeLabel,
  };
}
