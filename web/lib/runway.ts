/**
 * "How long will my money last" — months until a balance drawn down by a fixed
 * monthly withdrawal (with the remainder still earning return) hits zero.
 *
 * Recurrence: B_t = B_{t-1}(1+r) - W. Solving for the smallest t with B_t <= 0:
 *   t = ln(W / (W - B_0·r)) / ln(1+r)
 * If the withdrawal never exceeds what the balance itself earns each month
 * (W <= B_0·r), the balance never depletes — returns Infinity.
 */
export function calculateMoneyRunwayMonths(params: {
  startingBalance: number;
  monthlyWithdrawal: number;
  annualReturnRate: number;
}): number {
  const { startingBalance, monthlyWithdrawal, annualReturnRate } = params;

  /* Non-finite inputs are refused rather than propagated. A caller handing
     this NaN gets 0 back — "no runway" — instead of a NaN that renders. */
  if (!Number.isFinite(startingBalance) || !Number.isFinite(monthlyWithdrawal)) return 0;
  if (monthlyWithdrawal <= 0) return Infinity;
  if (startingBalance <= 0) return 0;

  const monthlyRate = Number.isFinite(annualReturnRate) ? annualReturnRate / 12 : 0;

  /* A monthly rate at or below -100% makes (1 + r) zero or negative, and
     Math.log of that is NaN — which reached the reader as "NaN months". No
     real return is ever that negative, so the balance is treated as earning
     nothing and the answer becomes the plain division below: still an honest
     runway, and never garbage. */
  if (1 + monthlyRate <= 0) return startingBalance / monthlyWithdrawal;

  if (monthlyRate === 0) {
    return startingBalance / monthlyWithdrawal;
  }

  const ratio = 1 - (startingBalance * monthlyRate) / monthlyWithdrawal;
  if (ratio <= 0) return Infinity;

  return -Math.log(ratio) / Math.log(1 + monthlyRate);
}
