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
  if (!Number.isFinite(value) || value <= 0 || value > MAX_AMOUNT) return null;
  return value;
}

/**
 * The largest amount any calculator will accept: a quadrillion shillings.
 *
 * WHY FINITE WAS NOT ENOUGH
 *
 * `Number.isFinite` closed `1e400`, which parses to Infinity. It left `1e308`
 * open: finite, typeable into any number field in eleven keystrokes, and one
 * multiplication from Infinity. Driving every calculator in a browser with it
 * (September 2026) put "NaN× your current annual spending" on the FIRE page,
 * "Infinity%" on Fuliza, SHA, DhowCSD and school fees, and NaN into the
 * take-home pay chart's SVG path — eight pages, all through the two parsers
 * in this file.
 *
 * THE NUMBER. lib/__tests__/arithmetic-sweep.test.ts proves every engine
 * stays finite up to `Number.MAX_SAFE_INTEGER` (about 9 x 10^15). The parser
 * must not admit anything that sweep has not proven, so the ceiling sits
 * below it, at a round figure that no household, chama or SACCO sum comes
 * within many orders of magnitude of. Above it there is nothing to model, so
 * the field is treated as not-an-amount — the same answer as a blank one.
 */
export const MAX_AMOUNT = 1e15;

/**
 * An optional amount that defaults to zero — the `Number(x) || 0` idiom, with
 * the same hole closed.
 *
 * `Number("1e400") || 0` is Infinity, not 0, because Infinity is truthy. The
 * idiom reads as "a number, or nothing", and it silently is not: a blank field
 * gives 0 as intended while an absurd one gives Infinity, which then poisons
 * whatever it is added to. Negatives are floored to 0 to match what the
 * callers already assume — every use of this is an amount, not a delta.
 */
export function amountOrZero(raw: unknown): number {
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0 || value > MAX_AMOUNT) return 0;
  return value;
}

/**
 * The band of annual rates any projection in this app will model, and the
 * last line of defence on a figure that has already been computed.
 *
 * WHY THIS IS HERE RATHER THAN IN EACH MODULE
 *
 * `positiveAmount` above exists because a guard that lives in twenty-four
 * components is a guard that is wrong in at least one of them. The same
 * argument applies one layer down, to the arithmetic those amounts feed.
 *
 * A sweep of every calculator against the values a number field can actually
 * produce (lib/__tests__/arithmetic-sweep.test.ts) found the same defect in
 * nine places, in six modules, all of it the same shape: `(1 + r)^n` either
 * overflows to Infinity, or — for a rate at or below -100% — raises a
 * non-positive base to a power and divides by zero. What came back was
 * Infinity in a shilling figure, or NaN, and both render.
 *
 * They were nine separate bugs only in the sense that they were in nine
 * files. They are one bug about floating-point limits, so the bound is
 * declared once and read everywhere, including by loans.ts, which had reached
 * the same conclusion independently and written its own copy.
 *
 * THE NUMBERS
 *
 * 10,000% a year is far beyond any instrument a Kenyan reader will meet —
 * the harshest mobile credit in this market annualises in the low hundreds —
 * and -99% is past any real loss. Outside that band there is no projection to
 * make, so the calculators decline rather than answer, which is what they
 * already do for a zero principal or an unplaceable bid.
 */
export const MAX_ANNUAL_RATE = 100;
export const MIN_ANNUAL_RATE = -0.99;

/** True when a rate is finite and inside the band above. */
export function isSaneRate(rate: number): boolean {
  return Number.isFinite(rate) && rate >= MIN_ANNUAL_RATE && rate <= MAX_ANNUAL_RATE;
}

/**
 * The computed figure, or the fallback when it is not a number a reader could
 * be shown. Belt to `isSaneRate`'s braces: bounding the inputs does not bound
 * every product of them, because a sane rate over an absurd NUMBER OF YEARS
 * overflows just as well.
 */
export function finiteOr(value: number, fallback = 0): number {
  return Number.isFinite(value) ? value : fallback;
}
