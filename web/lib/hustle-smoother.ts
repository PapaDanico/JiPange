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

/**
 * The width one bar's worth of income should occupy, and whether it overran.
 *
 * The chart used to scale every bar by the largest month, which is the obvious
 * choice and the wrong one for this data. Irregular income is irregular
 * precisely because it has outliers: one 300,000 poultry payout beside five
 * months near 20,000 pushed every ordinary month under 8% of the width, so
 * four of six bars rendered as slivers and the salary-draw line — the single
 * comparison the chart exists to make — sat at 5%, indistinguishable from the
 * left edge. The exceptional month was drawn perfectly and everything the
 * reader came to see was crushed against the axis.
 *
 * So the scale is set by the ordinary months rather than the exceptional one:
 * a ceiling at 1.8x the median, never below the salary draw itself, since a
 * draw off the right-hand edge would be worse than the problem being fixed.
 * Months above the ceiling run the full width and are flagged, so an outlier
 * reads as "off this scale" rather than as merely the biggest bar. Nothing is
 * hidden — every bar still carries its own figure in the label beside it.
 *
 * When no month exceeds the ceiling the true maximum is used, so an even
 * income does not get an arbitrary empty third of the chart.
 */
export const BAR_CEILING_MEDIAN_MULTIPLE = 1.8;

export interface BarScale {
  ceiling: number;
  /** Fraction of full width, 0..1. */
  width: (value: number) => number;
  /** True when the value runs past the ceiling and is drawn full width. */
  clipped: (value: number) => boolean;
}

export function barScale(values: number[], monthlyDraw: number): BarScale {
  const positive = values.filter((v) => Number.isFinite(v) && v > 0).sort((a, b) => a - b);
  if (!positive.length) {
    return { ceiling: Math.max(monthlyDraw, 1), width: () => 0, clipped: () => false };
  }

  const mid = Math.floor(positive.length / 2);
  const median =
    positive.length % 2 ? positive[mid] : (positive[mid - 1] + positive[mid]) / 2;
  const trueMax = positive[positive.length - 1];

  /* The draw is applied LAST, after the true-max cap, not folded into the
   * robust ceiling before it.
   *
   * Written the other way round the cap silently undid it: with months of
   * 5,000-7,000 and a draw of 50,000 the ceiling came back as 7,000 and the
   * reference line landed at 714% — off the chart entirely. That is precisely
   * the case where the reader most needs to see it, because a draw above every
   * month means the plan cannot be afforded at all. */
  const robust = Math.min(trueMax, median * BAR_CEILING_MEDIAN_MULTIPLE);
  const ceiling = Math.max(1, robust, monthlyDraw);

  return {
    ceiling,
    width: (v) => (v > 0 ? Math.min(1, v / ceiling) : 0),
    clipped: (v) => v > ceiling,
  };
}
