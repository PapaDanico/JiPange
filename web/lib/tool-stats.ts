import { calculateNetPay, PENSION_RELIEF_CAP_MONTHLY } from "./tax";
import { futureValue, DEFAULT_WITH_PLAN_RETURN_RATE } from "./projections";
import { assumedMmfYield } from "./mmf-assumption";
import { calculateLandPurchase } from "./land";
import { calculateFulizaCost } from "./fuliza";
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

/** The salary the headline deduction rate is quoted at. */
export const DEDUCTION_RATE_EXAMPLE_SALARY_KES = 100_000;

/**
 * Share of gross taken by PAYE, NSSF, SHIF and the housing levy.
 *
 * The salary hub claimed "≈37%" of a Ksh 100,000 salary, sourced to "JiPange
 * tax engine". The engine says 29.56%. It overstated what a reader loses by a
 * quarter of the true figure — and on a page whose job is to show them where
 * their money goes, that is the error that makes the product feel wrong when
 * they check it against their own payslip.
 *
 * I first wrote here that 37% was unreachable at any salary. That was wrong,
 * and the test below caught it: 37.04% arrives at Ksh 5,000,000 a month. I had
 * forgotten that Kenya's bands do not stop at 30% — there is 32.5% from
 * 500,000 and 35% above 800,000 — so the rate climbs to an asymptote near
 * 37.7%, not 34%.
 *
 * Which makes the original figure a subtler mistake than "invented". It is a
 * real rate, for a salary fifty times the one it is printed beside. Worth
 * remembering next time a number looks impossible: check the bands before
 * calling it impossible, because the confident version of that claim is
 * exactly what I had just finished criticising elsewhere in this file.
 */
export function statutoryShareOfGrossPct(
  salary = DEDUCTION_RATE_EXAMPLE_SALARY_KES
): number {
  const t = calculateNetPay(salary);
  const statutory = t.nssf.total + t.shif + t.ahl + t.paye;
  return round2((statutory / salary) * 100);
}

/* ── Projection headlines ───────────────────────────────────────────────────
 *
 * Same rule as the tax figures above: a number credited to a JiPange
 * projection has to come from the projection engine. These three were typed,
 * and two of the three were wrong — in opposite directions, which is worth
 * noticing. An error that flatters the product and an error that undersells it
 * are equally errors, and only one of them would ever have been reported by a
 * reader.
 */

/** The worked example on the savings-goal page. */
export const SAVINGS_GOAL_MONTHLY_KES = 2_000;
export const SAVINGS_GOAL_YEARS = 3;
/**
 * The MMF return these projections assume.
 *
 * NOT a constant. I first wrote `= 0.11` here and rate-anchoring.test.ts
 * rejected it — correctly, and with the exact reasoning I had spent the day
 * applying to other people's numbers. lib/mmf-assumption.ts exists because
 * four hand-typed MMF yields once drifted apart and then stayed put while
 * bills fell from 16% to 9%. Typing a fifth would have restarted that.
 */
export const mmfAssumedReturn = () => assumedMmfYield();

/**
 * What a small monthly habit reaches in three years.
 *
 * The page claimed "Ksh 100,000+". It is Ksh 84,846 — an 18% overstatement of
 * a figure whose entire job is to be checkable, next to the sentence "not Ksh
 * 72,000 flat. Compounding is the difference." The point stands: compounding
 * really does add Ksh 12,846 to the Ksh 72,000 you put in. It just does not
 * add twenty-eight thousand.
 */
export function savingsGoalFutureValueKES(): number {
  return Math.round(
    futureValue(0, SAVINGS_GOAL_MONTHLY_KES, mmfAssumedReturn(), SAVINGS_GOAL_YEARS)
  );
}

/** Flat contributions, for the comparison the page draws. */
export function savingsGoalContributedKES(): number {
  return SAVINGS_GOAL_MONTHLY_KES * SAVINGS_GOAL_YEARS * 12;
}

export const EARLY_START_AGE = 28;
export const LATE_START_AGE = 38;
export const RETIRE_AT_AGE = 55;
export const EARLY_START_MONTHLY_KES = 3_000;
/** The long-run return the retirement projections already assume. */
export const EARLY_START_RETURN = DEFAULT_WITH_PLAN_RETURN_RATE;

/**
 * How much more wealth ten earlier years buy.
 *
 * The page said "2× more". It is 3.09×, so the claim understated the single
 * biggest lever the tool exists to demonstrate — the one error today that cost
 * the argument rather than inflating it, and therefore the one nobody would
 * ever have complained about.
 */
export function earlyStartMultiple(): number {
  const early = futureValue(0, EARLY_START_MONTHLY_KES, EARLY_START_RETURN, RETIRE_AT_AGE - EARLY_START_AGE);
  const late = futureValue(0, EARLY_START_MONTHLY_KES, EARLY_START_RETURN, RETIRE_AT_AGE - LATE_START_AGE);
  return Math.round((early / late) * 10) / 10;
}

export const EMERGENCY_FUND_TARGET_KES = 30_000;
export const EMERGENCY_FUND_MONTHLY_KES = 2_000;

/**
 * Months to a three-month cushion, saving flat.
 *
 * This one was already right at 15. Derived anyway — a correct number with
 * nothing holding it there is a number waiting to drift.
 */
export function emergencyFundMonths(): number {
  return Math.ceil(EMERGENCY_FUND_TARGET_KES / EMERGENCY_FUND_MONTHLY_KES);
}

/* ── Land transaction costs ─────────────────────────────────────────────── */

/** Prices the land headline contrasts: a modest plot against a large one. */
export const LAND_SMALL_PLOT_KES = 300_000;
export const LAND_LARGE_PLOT_KES = 10_000_000;

/**
 * Transaction costs as a share of price, at two ends of the market.
 *
 * The page claimed a flat "8–12%". There is no flat figure: the Advocates
 * Remuneration Order carries a fixed Ksh 35,000 minimum, so the cost is
 * REGRESSIVE. A Ksh 300,000 plot pays about 28% on top; a Ksh 10m one pays 7%.
 * The buyers least able to absorb transaction costs pay much the largest share
 * of them, and a band of "8–12%" concealed exactly that — understating the
 * burden on the small buyer by a factor of three while overstating it for
 * everyone else.
 */
export function landCostSharePct(priceKes: number): number {
  return calculateLandPurchase({
    plotPriceKes: priceKes,
    landType: "urban_residential",
    usesAgent: false,
  }).hiddenCostPct;
}

/* ── Fuliza ─────────────────────────────────────────────────────────────── */

/** A small borrowing, where the flat fee bites hardest. */
export const FULIZA_SMALL_BORROW_KES = 150;
/** A large one, at the top of the same flat band. */
export const FULIZA_LARGE_BORROW_KES = 10_000;
/** The worked example the debt page uses. */
export const FULIZA_EXAMPLE_KES = 1_000;
export const FULIZA_EXAMPLE_DAYS = 30;

/**
 * Fuliza's annualised cost at a given balance.
 *
 * There is no single Fuliza APR, and publishing one was the old error. Because
 * the maintenance fee is a flat sum per band, the annualised cost collapses as
 * the principal rises — about 730% on Ksh 150 against 110% on Ksh 10,000. The
 * page said "~400%", which is true at roughly Ksh 550 and nowhere else, and it
 * concealed that the smallest borrowers pay the most.
 */
export function fulizaAprAt(principal: number): number {
  return calculateFulizaCost(principal, 30).annualisedApr;
}

/**
 * What a month on the example borrowing really costs, as a share of it.
 *
 * The debt page claimed 32% a month on Ksh 1,000. On the real tariff — one
 * access fee, three free days, then Ksh 5 a day plus excise — it is 17.4%.
 * Still ruinous; roughly half what we were telling people.
 */
export function fulizaMonthlyCostPct(): number {
  return calculateFulizaCost(FULIZA_EXAMPLE_KES, FULIZA_EXAMPLE_DAYS).percentOfPrincipal;
}

/* ── The last three, decided on research rather than left unverified ────── */

/** Days a month an overdraft is typically carried before payday clears it. */
export const FULIZA_CARRIED_DAYS = 20;
/** A standing M-PESA float big enough to stop reaching for Fuliza. */
export const FULIZA_FLOAT_KES = 3_000;

/**
 * What a standing float is worth per year, at the real tariff.
 *
 * The page claimed "saves Ksh 2,000–4,000/year". Carrying Ksh 3,000 for twenty
 * days a month costs Ksh 636 a month — Ksh 7,632 a year. The old range
 * UNDERSTATED the saving by about half, which is the rarer direction and the
 * one nobody complains about: it undersold the very behaviour the page is
 * recommending.
 */
export function fulizaFloatAnnualSavingKES(): number {
  return calculateFulizaCost(FULIZA_FLOAT_KES, FULIZA_CARRIED_DAYS).totalFee * 12;
}

/**
 * Senior school fees, as the government published them for 2026.
 *
 * The education page was built around "Junior Secondary", where under CBC the
 * state now pays a capitation and most families face no tuition bill. The fee
 * shock moved to SENIOR school — Grades 10 to 12 — and the Ministry set it
 * uniformly: Ksh 53,554 a year boarding, Ksh 9,374 day.
 *
 * So the page was pointing parents at the wrong stage AND quoting Ksh 165,000
 * a year for it. These are official, uniform and checkable, which is the whole
 * reason to prefer them to a plausible-sounding market figure.
 */
export const SENIOR_SCHOOL_BOARDING_ANNUAL_KES = 53_554;
export const SENIOR_SCHOOL_DAY_ANNUAL_KES = 9_374;
export const SENIOR_SCHOOL_YEARS = 3;
/* EDUCATION_SAVING_MONTHLY_KES / _YEARS and the two functions derived from
 * them lived here solely for /tools/education-savings, which was retired in
 * favour of /tools/school-fees-lifetime. They described a saving habit aimed
 * at one CBC transition; the successor models the whole liability and derives
 * its own figures from lib/education-plan.ts.
 *
 * The Ministry constants below stay: they are the anchor for the public-track
 * fee presets in education-plan.ts, and a test asserts the two agree. */

export function seniorSchoolBoardingTotalKES(): number {
  return SENIOR_SCHOOL_BOARDING_ANNUAL_KES * SENIOR_SCHOOL_YEARS;
}

