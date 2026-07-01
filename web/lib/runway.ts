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

  if (monthlyWithdrawal <= 0) return Infinity;
  if (startingBalance <= 0) return 0;

  const monthlyRate = annualReturnRate / 12;

  if (monthlyRate === 0) {
    return startingBalance / monthlyWithdrawal;
  }

  const ratio = 1 - (startingBalance * monthlyRate) / monthlyWithdrawal;
  if (ratio <= 0) return Infinity;

  return -Math.log(ratio) / Math.log(1 + monthlyRate);
}
