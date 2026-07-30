import { describe, it, expect } from 'vitest';
import { barScale, BAR_CEILING_MEDIAN_MULTIPLE } from '../hustle-smoother';

/**
 * The chart exists to compare each month against the salary draw. It was
 * scaled so that comparison could not be made.
 *
 * Every bar was sized against the largest month, which is the obvious choice
 * and exactly wrong for irregular income — irregular income has outliers by
 * definition. The exported sheet showed it plainly: one 300,000 poultry payout
 * beside five months near 20,000 put four of six bars under 8% of the width
 * and the salary-draw line at 5%, flush against the left edge. The one
 * exceptional month was drawn beautifully and everything the reader came for
 * was crushed into the axis.
 *
 * The figures from that sheet are used here as the case, because a scale that
 * cannot handle the data it shipped against is not fixed.
 */
const SHEET = [18_000, 22_500, 300_000, 20_000, 35_000, 21_000];
const DRAW = 14_625;

describe('the bar scale, against the export that exposed it', () => {
  it('keeps ordinary months legible instead of flattening them', () => {
    const s = barScale(SHEET, DRAW);
    const ordinary = SHEET.filter((v) => v < 100_000);
    for (const v of ordinary) {
      expect(
        s.width(v),
        `${v} would render at ${(s.width(v) * 100).toFixed(1)}% — invisible on a 4px bar`
      ).toBeGreaterThan(0.25);
    }
  });

  it('keeps the salary line on the chart, which is the whole comparison', () => {
    const s = barScale(SHEET, DRAW);
    expect(s.width(DRAW)).toBeGreaterThan(0.1);
    expect(s.width(DRAW)).toBeLessThanOrEqual(1);
  });

  it('would have failed under the old max-based scale', () => {
    // Stated explicitly so the regression is named, not merely absent.
    const oldWidth = (v: number) => v / Math.max(...SHEET, DRAW);
    expect(oldWidth(18_000)).toBeLessThan(0.08);
    expect(oldWidth(DRAW)).toBeLessThan(0.06);
  });

  it('never lets a draw larger than every month fall off the right edge', () => {
    /* A draw above the ceiling would put the reference line past 100% and off
     * the chart — worse than the problem being fixed, since the line is the
     * only thing a reader is meant to measure against. */
    const s = barScale([5_000, 6_000, 7_000], 50_000);
    expect(s.width(50_000)).toBeLessThanOrEqual(1);
    expect(s.ceiling).toBeGreaterThanOrEqual(50_000);
  });

  it('flags an off-scale month rather than drawing it as merely the biggest', () => {
    const s = barScale(SHEET, DRAW);
    expect(s.clipped(300_000)).toBe(true);
    expect(s.width(300_000)).toBe(1);
    // And does not cry outlier over an ordinary month.
    for (const v of SHEET.filter((x) => x !== 300_000)) {
      expect(s.clipped(v), `${v} was flagged as off-scale`).toBe(false);
    }
  });

  it('uses the true maximum when nothing is exceptional', () => {
    // Otherwise a steady income gets an arbitrary empty third of the chart.
    const even = [20_000, 21_000, 22_000, 20_500];
    const s = barScale(even, 16_000);
    expect(s.ceiling).toBe(22_000);
    expect(s.width(22_000)).toBe(1);
    expect(s.clipped(22_000)).toBe(false);
  });

  it('survives the inputs a half-filled form actually produces', () => {
    for (const vals of [[], [0, 0], [Number.NaN, 5_000], [-100, 3_000]]) {
      const s = barScale(vals, 0);
      for (const v of [0, 1_000, 1e9, Number.NaN, -5]) {
        const w = s.width(v);
        expect(Number.isFinite(w), `width(${v}) was not finite for ${JSON.stringify(vals)}`).toBe(
          true
        );
        expect(w).toBeGreaterThanOrEqual(0);
        expect(w).toBeLessThanOrEqual(1);
      }
      expect(s.ceiling).toBeGreaterThan(0);
    }
  });

  it('sets the ceiling from the median, not the mean', () => {
    /* The mean of this data is 69,667 — dragged up by the outlier, and the
     * figure the sheet printed as "Average month" beside a median of 22,500.
     * A ceiling built on the mean would reintroduce the same crushing more
     * quietly, which is why the multiple is applied to the median. */
    const s = barScale(SHEET, DRAW);
    const mean = SHEET.reduce((a, b) => a + b, 0) / SHEET.length;
    expect(s.ceiling).toBeLessThan(mean);
    expect(s.ceiling).toBeCloseTo(21_750 * BAR_CEILING_MEDIAN_MULTIPLE, 6);
  });
});
