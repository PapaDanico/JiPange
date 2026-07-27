import { calculateNetPay, PENSION_RELIEF_CAP_MONTHLY } from "./tax";
import { round2 } from "./money";

/**
 * The headline figures on tool pages, computed instead of typed.
 *
 * WHY THIS EXISTS
 * ---------------
 * Every tool page carries two or three "insight" stats above its calculator.
 * Most quote an outside source and are hand-written, which is fine. Eight cite
 * JiPange itself — they claim our own engine produced them. Three of those were
 * wrong, and each sat directly above the calculator that computes the right
 * answer:
 *
 *   tax-shield          "Ksh 72,000/yr from maxing pension"     -> 108,000
 *   salary-negotiation  "Ksh 108,000/yr from a 15k raise"       -> 113,088
 *   take-home-pay       "Ksh 4,500/mo pension saving"           -> 9,000
 *
 * The 72,000 is 20,000 x 12 x 30% — the pension cap BEFORE the Finance Act 2024
 * raised it to 30,000. It went stale the day the law changed and nothing
 * noticed, because a number in a string is invisible to every test we own.
 *
 * The 108,000 is subtler and more instructive: it is 15,000 less 40.25%, got by
 * ADDING the marginal rates together. But NSSF, SHIF and the housing levy are
 * deducted before PAYE is assessed, so summing the rates overstates the bite. A
 * plausible method, applied in the wrong order, producing a plausible number —
 * the kind of error that survives review because nothing about it looks odd.
 *
 * And take-home-pay's 4,500 contradicted tax-shield's own output on the same
 * site. Two pages, one question, two answers, both in 48-point type.
 *
 * So these are derived from the same engine the calculators use. A figure that
 * disagrees with the calculator underneath it can no longer be written down.
 */

/** A raise big enough to be worth negotiating for, used by the worked example. */
export const EXAMPLE_RAISE_KES = 15_000;
/** The salary the worked example starts from. */
export const EXAMPLE_BASE_SALARY_KES = 50_000;

/**
 * The salary the pension claim is quoted at.
 *
 * Both pages phrase the claim as "at higher salary bands", so it needs a
 * salary to be true of. This one is comfortably inside the 30% band with the
 * full cap usable, which is what the sentence means.
 */
export const PENSION_EXAMPLE_SALARY_KES = 150_000;

/**
 * What maxing the pension relief is actually worth, per month.
 *
 * MEASURED, not multiplied. The tempting version is cap x marginal rate, and
 * it is right only while the whole relief sits inside one band — it silently
 * overstates the saving for anyone the relief drags across a boundary. Running
 * the engine twice costs nothing and cannot be wrong about where the bands are.
 */
export function pensionReliefSavingMonthly(salary = PENSION_EXAMPLE_SALARY_KES): number {
  const without = calculateNetPay(salary).netMonthly;
  const withRelief = calculateNetPay(salary, {
    pensionContribution: PENSION_RELIEF_CAP_MONTHLY,
  }).netMonthly;
  /* netMonthly is pay after statutory deductions and does NOT subtract the
   * pension contribution itself, so this difference already IS the PAYE no
   * longer paid. Adding the contribution back would count it twice — which is
   * what I did first, and it produced Ksh 39,000 a month, a number absurd
   * enough to catch immediately. A subtler double-count would not have been. */
  return round2(withRelief - without);
}

export function pensionReliefSavingAnnual(salary = PENSION_EXAMPLE_SALARY_KES): number {
  return round2(pensionReliefSavingMonthly(salary) * 12);
}

/**
 * What a raise is worth after deductions — measured, not modelled.
 *
 * Runs both salaries through the same net-pay engine and takes the difference,
 * rather than multiplying the raise by a combined rate. That ordering is
 * exactly what the previous figure got wrong.
 */
export function raiseWorthAnnual(
  base = EXAMPLE_BASE_SALARY_KES,
  raise = EXAMPLE_RAISE_KES
): number {
  const before = calculateNetPay(base).netMonthly;
  const after = calculateNetPay(base + raise).netMonthly;
  return round2((after - before) * 12);
}
