/**
 * Retiring in Kenya, costed the way it actually happens.
 *
 * The FIRE calculator this replaces did what almost every retirement tool
 * does: took today's expenses, grew them at CPI for thirty years, and
 * multiplied by 20. Three things are wrong with that here, and each one is a
 * Western default being applied to a country it was not written for.
 *
 * 1. IT INFLATES EXPENSES AND CALLS THAT PRUDENCE
 * -----------------------------------------------
 * Growing today's spending at CPI for thirty years and then dividing by a
 * nominal return double-counts inflation at one end and ignores it at the
 * other. The clean way to think about a retirement plan is entirely in TODAY'S
 * money, discounted at a REAL return. Inflation then appears exactly once,
 * where it belongs — inside the real return — instead of inflating a headline
 * number into the tens of millions and frightening people out of starting.
 *
 * Everything below is in today's shillings.
 *
 * 2. IT ASSUMES SPENDING IS FLAT FOREVER
 * ---------------------------------------
 * It is not. School fees end. Children become independent. The commute goes.
 * A house that was being paid for is paid for, or the household moves upcountry
 * where the same life costs less. Retirement spending falls in real terms.
 *
 * But NOT as far as the Western literature assumes, and the reason is
 * specifically Kenyan: extended-family obligation does not retire. A parent who
 * has been the one others turn to remains that person at seventy. So this
 * models a modest real decline with a floor, rather than the steeper glide the
 * US "retirement spending smile" would give. The floor is the point: this is
 * one of the places where copying the foreign model would understate the
 * target, not overstate it.
 *
 * 3. IT TREATS MEDICAL COVER AS A LINE ITEM
 * ------------------------------------------
 * It is not a line item. In a country with a public system that is a floor
 * rather than a plan, and private cover that re-bands by age, medical is the
 * single largest financial risk of a Kenyan retirement and the one that
 * behaves least like everything else: every other cost falls in real terms and
 * this one climbs. Modelling it inside a flat expense figure hides the whole
 * shape of the problem.
 *
 * So it is modelled as its own stream, and the finding that falls out is not
 * the one expected. Medical does NOT usually overtake ordinary living costs
 * inside a normal lifespan — starting from a few per cent of the budget, 3%
 * real escalation cannot close that gap in thirty years. Something sharper
 * happens instead:
 *
 *   MEDICAL TAKES A FAR LARGER SHARE OF THE CAPITAL THAN OF THE BUDGET.
 *
 * Measured on the defaults: a household spending 6% of its budget on cover
 * today must set aside 19% of its retirement capital for it. One spending 16%
 * today must set aside 31%. By the final year modelled, medical is 30–43% of
 * everything being spent.
 *
 * That amplification is what nobody sees coming. It is invisible in a monthly
 * budget and appears only once the spending is discounted over a lifetime,
 * because every other cost is shrinking in real terms while this one compounds.
 * `medicalShareOfCapital` against `medicalShareOfSpendingToday` is the
 * comparison this module exists to make.
 *
 * Note what is NOT claimed. The headline capital lands close to the old flat
 * rule — 20.7x and 19.8x against a flat 20x. This rework barely moves the
 * total. It moves what the total is FOR, and it is the composition rather than
 * the headline that decides whether a plan survives contact with a hospital.
 *
 * There is also a deadline nothing else in this app surfaces: Kenyan insurers
 * commonly refuse NEW entrants past their mid-sixties and price on continuous
 * membership. The decision about retirement medical cover therefore expires
 * BEFORE retirement does. A plan that only tells you the number, and not that
 * the door closes, has left out the part that cannot be fixed later.
 *
 * ON THE RETURN ASSUMPTION
 * ------------------------
 * See REAL_RETURN_DEFAULT. Short version: the old model justified a 5%
 * withdrawal rate with an 11.5% money-market yield, which is 3.16% REAL at the
 * published CPI — so its own arithmetic contradicted its multiplier.
 */

import { currentInflation, tbillRate } from "./rates-feed";

/**
 * The long-run real return this plans on, after tax and after inflation.
 *
 * Measured from the published feed on 2026-07-26, at 6.41% CPI:
 *
 *   364-day T-bill, net of WHT ............ 1.92% real
 *   Money market fund at 11.5% gross ...... 3.16% real
 *   Treasury bonds 7–12y, IFB (tax-free) .. 6.19% real
 *   Treasury bonds 20y+, IFB (tax-free) ... 7.00% real
 *
 * Today's Kenyan real yields are extraordinary, and that is precisely why a
 * thirty-year plan must not assume them. They are a fiscal moment, not a
 * constant — the same reason lib/projections.ts keeps a long-run inflation
 * assumption instead of quoting this month's print. Planning at 6% real is
 * planning on the government still needing to borrow this expensively in 2056.
 *
 * 3% is chosen to sit:
 *   - BELOW every long-bond real yield on the board today, so the plan does not
 *     depend on the current moment persisting;
 *   - AT the real yield of a money market fund, i.e. reachable with no skill,
 *     no timing and no lock-up;
 *   - ABOVE the T-bill real yield, acknowledging a retiree holds some longer
 *     paper alongside their liquid sleeve.
 *
 * If it turns out conservative, the plan finishes early. That is the direction
 * to be wrong in.
 */
export const REAL_RETURN_DEFAULT = 0.03;

/**
 * How fast ordinary living costs fall in real terms once retired.
 *
 * 1% a year is the cautious end of the range the retirement-spending
 * literature reports, and that literature is American. Applied here with a
 * floor, for the reason in the header: dependants do not stop being dependants.
 */
export const LIVING_REAL_DECLINE = 0.01;

/** Living costs never fall below this share of their level at retirement. */
export const LIVING_FLOOR_SHARE = 0.75;

/**
 * How fast medical costs rise in real terms — i.e. ON TOP of general inflation.
 *
 * Medical cost inflation running ahead of headline CPI is the normal condition
 * of health financing, and in Kenya it compounds with an age-banding effect:
 * private cover is repriced upward as the member ages, so a retiree faces
 * both a rising unit price and a rising band. 3% real is a single rate
 * standing in for both. It is an assumption, it is adjustable, and the results
 * label it as one.
 */
export const MEDICAL_REAL_ESCALATION = 0.03;

/**
 * The age past which Kenyan private medical insurers commonly decline new
 * members, admitting only those with continuous prior cover.
 *
 * Modelled as a warning rather than as arithmetic, because it is not a cost —
 * it is a door. Someone who plans to buy cover "when I retire at 65" may find
 * they cannot buy it at all.
 */
export const PRIVATE_COVER_ENTRY_LIMIT_AGE = 65;

/**
 * Default PLANNING HORIZON — deliberately not life expectancy.
 *
 * This matters more than it looks. The familiar 20× and 25× rules are
 * perpetuity rules: they size a pot that is never meant to be exhausted. This
 * model prices a finite stream instead, which is more honest about how people
 * actually retire and produces a smaller, more reachable number — but it means
 * the plan RUNS OUT on the last year modelled.
 *
 * So the horizon is set past life expectancy rather than at it. Living longer
 * than average is the good outcome, and a plan that treats it as the failure
 * case has the incentive backwards. `planExhaustedAtAge` is returned so the
 * reader is told plainly which year the money ends, instead of that fact being
 * buried in a modelling assumption.
 */
export const DEFAULT_PLANNING_HORIZON_AGE = 90;

export interface RetirementInputs {
  currentAge: number;
  retirementAge: number;
  /** Everything except medical, in today's shillings. */
  currentMonthlyExpenses: number;
  /** Today's monthly cost of the cover the household intends to hold. */
  currentMonthlyMedical: number;
  /** Capital already set aside, today's shillings. */
  currentCapital?: number;
  /** Monthly saving, today's shillings. */
  monthlyContribution?: number;
  /** Age the plan must last to. Not life expectancy — see the constant. */
  planningHorizonAge?: number;
  realReturn?: number;
  medicalRealEscalation?: number;
  livingRealDecline?: number;
}

export interface RetirementYear {
  age: number;
  /** Ordinary living costs that year, today's money. */
  livingKes: number;
  /** Medical costs that year, today's money. */
  medicalKes: number;
  totalKes: number;
  /** Share of that year's spending that is medical, 0–1. */
  medicalShare: number;
}

export interface KenyanRetirement {
  yearsToRetirement: number;
  yearsInRetirement: number;
  realReturn: number;
  /** Capital needed at retirement, in TODAY'S shillings. */
  capitalRequiredKes: number;
  /** The same number as a multiple of current total annual spending. */
  impliedMultiple: number;
  /** What the old flat "20× expenses" rule would have said, for comparison. */
  flatRuleKes: number;
  /** Of the capital required, how much exists solely to pay for medical care. */
  medicalCapitalKes: number;
  /** Medical as a share of the CAPITAL you must accumulate, 0-1. */
  medicalShareOfCapital: number;
  /** Medical as a share of what you spend TODAY, 0-1. The gap is the point. */
  medicalShareOfSpendingToday: number;
  /** The year the money runs out. Stated, never buried. */
  planExhaustedAtAge: number;
  /** Age at which medical spending overtakes ordinary living costs, or null. */
  medicalOvertakesAge: number | null;
  years: RetirementYear[];
  /** Projected capital at retirement from current savings, today's money. */
  projectedCapitalKes: number;
  surplusKes: number;
  onTrack: boolean;
  /** Extra monthly saving needed to close the gap, today's money. */
  additionalMonthlyNeededKes: number;
  /** Years left to buy private cover before insurers start refusing entry. */
  yearsLeftToBuyCover: number;
  coverDeadlineAge: number;
  warnings: string[];
}

/**
 * A conservative real return, and the evidence for it, straight from the feed.
 *
 * Exposed so the UI can show the reader what today's paper actually yields in
 * real terms beside what the plan assumes — the gap between the two IS the
 * conservatism, and hiding it would make the assumption look arbitrary.
 */
export function realReturnEvidence(): {
  planning: number;
  tbillRealNet: number | null;
  inflation: number;
} {
  const infl = currentInflation();
  const bill = tbillRate(364);
  const real = (nominal: number) => (1 + nominal) / (1 + infl) - 1;
  return {
    planning: REAL_RETURN_DEFAULT,
    tbillRealNet: bill ? real(bill.netEAY / 100) : null,
    inflation: infl,
  };
}

/** Present value of 1 received in `years` time, at a real rate. */
const discount = (rate: number, years: number) => 1 / Math.pow(1 + rate, years);

export function planKenyanRetirement(input: RetirementInputs): KenyanRetirement {
  const realReturn = input.realReturn ?? REAL_RETURN_DEFAULT;
  const medEsc = input.medicalRealEscalation ?? MEDICAL_REAL_ESCALATION;
  const decline = input.livingRealDecline ?? LIVING_REAL_DECLINE;
  const horizonAge = input.planningHorizonAge ?? DEFAULT_PLANNING_HORIZON_AGE;

  const yearsToRetirement = Math.max(0, input.retirementAge - input.currentAge);
  const yearsInRetirement = Math.max(0, horizonAge - input.retirementAge);

  const annualLivingNow = Math.max(0, input.currentMonthlyExpenses) * 12;
  const annualMedicalNow = Math.max(0, input.currentMonthlyMedical) * 12;

  // Living costs at the moment of retiring are today's, unchanged: we are in
  // today's money, so no inflation is applied. What changes is the SHAPE from
  // retirement onward.
  const livingAtRetirement = annualLivingNow;
  // Medical, by contrast, has already been climbing in real terms during the
  // working years — the member ages on the way to retirement too.
  const medicalAtRetirement = annualMedicalNow * Math.pow(1 + medEsc, yearsToRetirement);

  const years: RetirementYear[] = [];
  let medicalOvertakesAge: number | null = null;

  for (let t = 0; t < yearsInRetirement; t++) {
    const living = Math.max(
      livingAtRetirement * LIVING_FLOOR_SHARE,
      livingAtRetirement * Math.pow(1 - decline, t)
    );
    const medical = medicalAtRetirement * Math.pow(1 + medEsc, t);
    const total = living + medical;
    const age = input.retirementAge + t;
    if (medicalOvertakesAge === null && medical > living) medicalOvertakesAge = age;
    years.push({
      age,
      livingKes: living,
      medicalKes: medical,
      totalKes: total,
      medicalShare: total > 0 ? medical / total : 0,
    });
  }

  // Capital required is simply what it costs to buy that stream of spending,
  // discounted at the real return. No multiplier, no rule of thumb — the two
  // streams diverge, so no single multiple of today's spending can describe
  // them, which is exactly why the old 20x was wrong in both directions
  // depending on who was asking.
  let capitalRequiredKes = 0;
  let medicalCapitalKes = 0;
  years.forEach((y, t) => {
    const d = discount(realReturn, t);
    capitalRequiredKes += y.totalKes * d;
    medicalCapitalKes += y.medicalKes * d;
  });

  const currentTotalAnnual = annualLivingNow + annualMedicalNow;
  const impliedMultiple =
    currentTotalAnnual > 0 ? capitalRequiredKes / currentTotalAnnual : 0;

  // Growth of what is already saved, plus contributions, in real terms.
  const capital = Math.max(0, input.currentCapital ?? 0);
  const monthly = Math.max(0, input.monthlyContribution ?? 0);
  const growth = Math.pow(1 + realReturn, yearsToRetirement);
  const annualContribution = monthly * 12;
  const contributionsFV =
    realReturn === 0
      ? annualContribution * yearsToRetirement
      : annualContribution * ((growth - 1) / realReturn);
  const projectedCapitalKes = capital * growth + contributionsFV;

  const surplusKes = projectedCapitalKes - capitalRequiredKes;
  const shortfall = Math.max(0, -surplusKes);
  const additionalMonthlyNeededKes =
    shortfall === 0 || yearsToRetirement === 0
      ? 0
      : realReturn === 0
        ? shortfall / yearsToRetirement / 12
        : (shortfall * realReturn) / (growth - 1) / 12;

  const coverDeadlineAge = PRIVATE_COVER_ENTRY_LIMIT_AGE;
  const yearsLeftToBuyCover = Math.max(0, coverDeadlineAge - input.currentAge);

  const warnings: string[] = [];
  if (annualMedicalNow <= 0) {
    warnings.push(
      "No medical cover budgeted. SHA is a floor, not a plan — it is built around accredited public hospitals, and a retirement plan that assumes no private cover is assuming a level of care rather than forgetting a cost."
    );
  }
  if (input.currentAge >= coverDeadlineAge) {
    warnings.push(
      `Most Kenyan insurers will not accept a NEW member at ${input.currentAge}. Cover is generally available past ${coverDeadlineAge} only to those who have held it continuously, so this is a plan to price now, not later.`
    );
  } else if (yearsLeftToBuyCover <= 10) {
    warnings.push(
      `About ${yearsLeftToBuyCover} years left to take out private cover. Kenyan insurers commonly decline new entrants past ${coverDeadlineAge} and admit older members only on continuous membership — the decision expires before retirement does.`
    );
  }
  if (medicalOvertakesAge !== null) {
    warnings.push(
      `On these assumptions medical spending overtakes every other cost combined at age ${medicalOvertakesAge}. That crossover, not the headline number, is what a Kenyan retirement plan has to survive.`
    );
  }
  warnings.push(
    `This plan is priced to last to age ${horizonAge} and is exhausted at that point — it is a finite stream, not a pot that lives forever. The familiar 20x and 25x rules size a perpetuity instead, which is why they give a bigger number for the same life.`
  );
  if (input.retirementAge <= input.currentAge) {
    warnings.push("Retirement age is not in the future, so there is nothing left to accumulate — this prices the spending only.");
  }

  return {
    yearsToRetirement,
    yearsInRetirement,
    realReturn,
    capitalRequiredKes,
    impliedMultiple,
    flatRuleKes: currentTotalAnnual * 20,
    medicalCapitalKes,
    medicalShareOfCapital:
      capitalRequiredKes > 0 ? medicalCapitalKes / capitalRequiredKes : 0,
    medicalShareOfSpendingToday:
      currentTotalAnnual > 0 ? annualMedicalNow / currentTotalAnnual : 0,
    planExhaustedAtAge: horizonAge,
    medicalOvertakesAge,
    years,
    projectedCapitalKes,
    surplusKes,
    onTrack: surplusKes >= 0,
    additionalMonthlyNeededKes,
    yearsLeftToBuyCover,
    coverDeadlineAge,
    warnings,
  };
}
