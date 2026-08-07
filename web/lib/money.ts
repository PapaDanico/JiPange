export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * A user-entered amount, or null if it is not one.
 *
 * WHY `Number(x)` PLUS `!x || x <= 0` IS NOT ENOUGH
 *
 * That guard is the shape used throughout the calculators, and it lets
 * Infinity through. `Number("1e400")` is `Infinity`, which is truthy and
 * greater than zero, so it satisfies both halves and reaches the engine.
 * Verified against the real tax engine:
 *
 *     "1e400"  -> passes the guard -> netMonthly: NaN
 *     "-5"     -> blocked
 *     "abc"    -> blocked
 *
 * NaN then renders as "Ksh NaN". It is not a security problem and nobody's
 * arithmetic is silently wrong — but it is reachable by typing, `1e400` is
 * eleven characters, and a money app that answers NaN has stopped being
 * trustworthy for the next question too.
 *
 * `Number.isFinite` is the whole fix, and it belongs here rather than in
 * twenty-four components, so there is one place to be right.
 */
export function positiveAmount(raw: unknown): number | null {
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) return null;
  return value;
}
