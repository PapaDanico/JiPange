import { MAX_AMOUNT, round2 } from "./money";

/**
 * Deterministic household liquidity stress test. This is a cash-only model:
 * inaccessible investments, unrealised returns and future borrowing are excluded.
 * Month 1 is the next calendar month. Debt service is a separate outflow.
 */
export interface HouseholdLiquidityInput {
  liquidSavings: number;
  monthlyIncome: number;
  essentialExpenses: number;
  monthlyDebtService: number;
  /** Dated obligations in month 1..12 (e.g. school fees). */
  obligations?: ReadonlyArray<{ month: number; amount: number }>;
  incomeShockPct?: number;
}

export interface HouseholdLiquidityResult {
  essentialRunwayMonths: number | null;
  stressedMonthlyIncome: number;
  firstShortfallMonth: number | null;
  endingBalanceByMonth: number[];
  minimumBalance: number;
}

export function simulateHouseholdLiquidity(input: HouseholdLiquidityInput): HouseholdLiquidityResult | null {
  const { liquidSavings, monthlyIncome, essentialExpenses, monthlyDebtService } = input;
  const shock = input.incomeShockPct ?? 0;
  if (
    [liquidSavings, monthlyIncome, essentialExpenses, monthlyDebtService].some(
      (v) => !Number.isFinite(v) || v < 0 || v > MAX_AMOUNT
    ) ||
    !Number.isFinite(shock) || shock < 0 || shock > 100 ||
    (input.obligations ?? []).some(
      (o) => !Number.isSafeInteger(o.month) || o.month < 1 || o.month > 12 ||
        !Number.isFinite(o.amount) || o.amount < 0 || o.amount > MAX_AMOUNT
    )
  ) return null;

  const monthlyOutflow = essentialExpenses + monthlyDebtService;
  if (!Number.isFinite(monthlyOutflow) || monthlyOutflow > MAX_AMOUNT) return null;
  const essentialRunwayMonths = monthlyOutflow === 0
    ? null
    : round2(liquidSavings / monthlyOutflow);
  const stressedMonthlyIncome = round2(monthlyIncome * (1 - shock / 100));
  const endingBalanceByMonth: number[] = [];
  let balance = liquidSavings;
  let minimumBalance = balance;
  let firstShortfallMonth: number | null = null;
  for (let month = 1; month <= 12; month++) {
    const obligation = (input.obligations ?? [])
      .filter((o) => o.month === month)
      .reduce((sum, o) => sum + o.amount, 0);
    if (!Number.isFinite(obligation) || obligation > MAX_AMOUNT) return null;
    balance = round2(balance + stressedMonthlyIncome - monthlyOutflow - obligation);
    if (!Number.isFinite(balance)) return null;
    if (balance < 0 && firstShortfallMonth === null) firstShortfallMonth = month;
    minimumBalance = Math.min(minimumBalance, balance);
    endingBalanceByMonth.push(balance);
  }
  return { essentialRunwayMonths, stressedMonthlyIncome, firstShortfallMonth, endingBalanceByMonth, minimumBalance };
}
