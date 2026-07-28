import { describe, it, expect } from "vitest";
import {
  calculateCurrentStreak,
  calculateBestStreak,
  totalSaved,
  getWindowStatus,
  WINDOW_START_DAY,
  WINDOW_END_DAY,
} from "../20th-challenge";

const ci = (month: string, amount = 1_000) => ({ month, amount, date: `${month}-20` });
const on = (y: number, m: number, d: number) => new Date(y, m - 1, d);

/**
 * Streak logic, previously untested.
 *
 * Date arithmetic is where quiet bugs live — month rollovers, year rollovers,
 * and the difference between "you have not checked in yet" and "you missed it".
 * Getting the last one wrong tells somebody their eleven-month streak is dead
 * on the 16th of the month, which is the sort of thing that makes them stop
 * using the app rather than write in about it.
 *
 * Checked by hand across six cases before writing these: all six were already
 * right. This holds them there.
 */
describe("the monthly streak", () => {
  it("survives while the current window is still open", () => {
    // Checked in January; it is 20 February and the window runs 15th-25th.
    // Nothing has been missed yet.
    expect(calculateCurrentStreak([ci("2026-01")], on(2026, 2, WINDOW_START_DAY + 5))).toBe(1);
  });

  it("dies once the window closes with no check-in", () => {
    expect(calculateCurrentStreak([ci("2026-01")], on(2026, 2, WINDOW_END_DAY + 1))).toBe(0);
  });

  it("counts consecutive months", () => {
    expect(
      calculateCurrentStreak([ci("2026-01"), ci("2026-02")], on(2026, 2, WINDOW_END_DAY + 1))
    ).toBe(2);
  });

  it("crosses a year boundary", () => {
    // December to January is the case a naive month comparison gets wrong.
    expect(
      calculateCurrentStreak([ci("2025-12"), ci("2026-01")], on(2026, 1, WINDOW_END_DAY + 1))
    ).toBe(2);
  });

  it("resets after a skipped month rather than counting through it", () => {
    expect(
      calculateCurrentStreak([ci("2026-01"), ci("2026-03")], on(2026, 3, 20))
    ).toBe(1);
  });

  it("is dead once a whole month has passed unchecked", () => {
    expect(calculateCurrentStreak([ci("2026-01")], on(2026, 3, 10))).toBe(0);
  });

  it("has no streak with no check-ins", () => {
    expect(calculateCurrentStreak([], on(2026, 3, 10))).toBe(0);
    expect(calculateBestStreak([])).toBe(0);
  });

  it("remembers the best run even after it is broken", () => {
    const runs = [ci("2026-01"), ci("2026-02"), ci("2026-04"), ci("2026-05"), ci("2026-06")];
    expect(calculateBestStreak(runs)).toBe(3);
    // The best streak must never be smaller than the current one.
    expect(calculateBestStreak(runs)).toBeGreaterThanOrEqual(
      calculateCurrentStreak(runs, on(2026, 6, 20))
    );
  });

  it("sums what was actually put away", () => {
    expect(totalSaved([ci("2026-01", 2_000), ci("2026-02", 3_500)])).toBe(5_500);
    expect(totalSaved([])).toBe(0);
  });

  it("moves through waiting, open and closed on the stated days", () => {
    // Boundaries inclusive at both ends — the 15th and the 25th are both days
    // on which someone can still act, and an off-by-one here would tell a
    // punctual saver they had missed it.
    expect(getWindowStatus(on(2026, 3, WINDOW_START_DAY - 1), [])).toBe("waiting");
    expect(getWindowStatus(on(2026, 3, WINDOW_START_DAY), [])).toBe("open");
    expect(getWindowStatus(on(2026, 3, WINDOW_END_DAY), [])).toBe("open");
    expect(getWindowStatus(on(2026, 3, WINDOW_END_DAY + 1), [])).toBe("closed");
  });

  it("reports done for the month once checked in, whatever the day", () => {
    const done = [ci("2026-03")];
    for (const d of [1, WINDOW_START_DAY, WINDOW_END_DAY, 28]) {
      expect(getWindowStatus(on(2026, 3, d), done)).toBe("done");
    }
  });
});
