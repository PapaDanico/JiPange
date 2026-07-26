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
  /**
   * The deepest the running buffer ever got, and the month it happened.
   *
   * This is the number the tool was missing. `finalBuffer` says where you
   * ended up; it says nothing about the hole you had to climb out of, and the
   * order of the months decides that entirely. Two hustlers with the identical
   * twelve months of income in a different sequence get the identical final
   * buffer — and one of them was Ksh 140,000 overdrawn in February.
   */
  lowestBuffer: number;
  /** 1-based month index of the trough. */
  lowestBufferMonth: number;
  /** True when the plan required money the simulation never had. */
  goesNegative: boolean;
  /**
   * What you would have needed in the bank on day one for this draw to have
   * been survivable — i.e. the trough, made positive. Zero when the plan never
   * dipped. This is the actionable form of the finding.
   */
  requiredStartingBuffer: number;
}

/**
 * @param incomes - Array of monthly income values (all must be > 0)
 * @param drawFraction - Fraction of median to draw as monthly salary (e.g. 0.80)
 */
export function smoothIncomes(
  incomes: number[],
  drawFraction: number
): SmootherResult {
  if (incomes.length === 0) {
    return {
      stats: { min: 0, max: 0, average: 0, median: 0, total: 0 },
      monthlyDraw: 0,
      points: [],
      finalBuffer: 0,
      finalBufferMonths: 0,
      shortMonths: 0,
      lowestBuffer: 0,
      lowestBufferMonth: 0,
      goesNegative: false,
      requiredStartingBuffer: 0,
    };
  }

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
  // Track the trough as we go. The order of the months is the whole story:
  // the same twelve figures shuffled give the same final buffer and a
  // completely different experience of the year.
  let lowestBuffer = Infinity;
  let lowestBufferMonth = 0;
  const points: MonthPoint[] = incomes.map((income, i) => {
    const surplus = income - monthlyDraw;
    cumBuffer += surplus;
    if (surplus < 0) shortMonths++;
    if (cumBuffer < lowestBuffer) {
      lowestBuffer = cumBuffer;
      lowestBufferMonth = i + 1;
    }
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
    lowestBuffer,
    lowestBufferMonth,
    goesNegative: lowestBuffer < 0,
    requiredStartingBuffer: Math.max(0, -lowestBuffer),
  };
}
