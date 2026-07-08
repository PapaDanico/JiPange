/**
 * Month-to-month irregular income smoother: derive a sustainable fixed "salary"
 * from a history of variable monthly earnings, then simulate the buffer tank
 * that absorbs the variance between good and lean months.
 */

export interface SmootherStats {
  min: number;
  max: number;
  average: number;
  median: number;
  total: number;
}

export interface MonthPoint {
  income: number;
  surplus: number;
  cumBuffer: number;
}

export interface SmootherResult {
  stats: SmootherStats;
  monthlyDraw: number;
  points: MonthPoint[];
  finalBuffer: number;
  finalBufferMonths: number;
  shortMonths: number;
}

/**
 * @param incomes - Array of monthly income values (all must be > 0)
 * @param drawFraction - Fraction of median to draw as monthly salary (e.g. 0.80)
 */
export function smoothIncomes(
  incomes: number[],
  drawFraction: number
): SmootherResult {
  const sorted = [...incomes].sort((a, b) => a - b);
  const n = sorted.length;

  const min = sorted[0];
  const max = sorted[n - 1];
  const total = sorted.reduce((s, v) => s + v, 0);
  const average = total / n;
  const mid = Math.floor(n / 2);
  const median =
    n % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

  const monthlyDraw = Math.round(median * drawFraction);

  let cumBuffer = 0;
  let shortMonths = 0;
  const points: MonthPoint[] = incomes.map((income) => {
    const surplus = income - monthlyDraw;
    cumBuffer += surplus;
    if (surplus < 0) shortMonths++;
    return { income, surplus, cumBuffer };
  });

  const finalBuffer = cumBuffer;
  const finalBufferMonths =
    monthlyDraw > 0 ? Math.max(0, finalBuffer) / monthlyDraw : 0;

  return {
    stats: { min, max, average, median, total },
    monthlyDraw,
    points,
    finalBuffer,
    finalBufferMonths,
    shortMonths,
  };
}
