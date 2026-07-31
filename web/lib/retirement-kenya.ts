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
 * This paragraph used to say the headline barely moved — "20.7x and 19.8x
 * against a flat 20x" — and that the rework changed only what the total was
 * FOR. That was true until July 2026, when LIVING_REPLACEMENT_AT_RETIREMENT
 * was added and the model stopped assuming a retiree keeps spending what they
 * spend now. The headline now lands near 0.62x of the flat 20x rule.
 *
 * The composition point still stands and is still the reason this module
 * exists: medical is a rising stream inside a falling one, and
 * `medicalShareOfCapital` against `medicalShareOfSpendingToday` is the
 * comparison nothing else makes. But it is no longer true that the total is
 * unchanged, so this no longer says so. The old flat rule is shown beside the
 * answer precisely so a reader can see the gap rather than be told there
 * isn't one.
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
 * How much of today's LIVING costs a household still needs the day it retires.
 *
 * THE SINGLE SOURCE OF TRUTH for that judgement, shared with the retirement
 * planner (components/planners/GoalPlanner.tsx). It exists because the two
 * tools silently disagreed by a factor of 1.79.
 *
 * This model had no replacement rate at all: livingAtRetirement was today's
 * living cost UNCHANGED, declining 1%/yr afterwards to a 75% floor — so it
 * implicitly assumed a retiree needs ~89% of their working spending across the
 * plan. The planner assumed 50% from day one. Both were defensible readings and
 * nobody had noticed they were different readings, because neither wrote the
 * number down as a number.
 *
 * 50% is the operator's read for Kenya: no commute, no school fees, usually no
 * mortgage. It sits below the Western 70-80% replacement band, deliberately,
 * for a market where those three are a larger share of working-age spending.
 *
 * APPLIED TO LIVING ONLY. Medical is NOT reduced — you need the same cover the
 * day after you retire as the day before, and MEDICAL_REAL_ESCALATION already
 * has it rising from there. That asymmetry is why this model and the planner
 * still differ slightly: the planner takes one combined figure and cannot tell
 * the two apart. The difference is now small, stated, and asserted by
 * lib/__tests__/retirement-models-agree.test.ts rather than left to be
 * discovered by a reader running both tools.
 */
export const LIVING_REPLACEMENT_AT_RETIREMENT = 0.5;

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
 * The age past which retiree medical cover gets materially harder and dearer
 * to buy new — NOT the age at which it becomes impossible.
 *
 * CORRECTED, July 2026, by research that contradicted this app. It read 65 and
 * the header said insurers "commonly refuse NEW entrants past their
 * mid-sixties", which is too absolute: Britam's Bima ya Mwananchi Senior
 * admits new members to 75, Jubilee's J-Senior to 79, and Britam's Milele plan
 * admits from 55 with NO maximum exit age. The door narrows and the price
 * climbs; it does not shut.
 *
 * Kept at 65 as the point where the decision gets expensive, and kept as a
 * WARNING rather than arithmetic, because it is still a door rather than a
 * cost. But the wording it drives no longer tells a 68-year-old that nothing
 * is available to them, which was false and is the kind of false that stops
 * somebody looking.
 */
export const PRIVATE_COVER_ENTRY_LIMIT_AGE = 65;

/**
 * The better structure for retiree medical, which this model does not itself
 * assume — and the reason it does not.
 *
 * Kenya's Post-Retirement Medical Funds are RBA-regulated, contributions are
 * tax-deductible up to Ksh 15,000 a month and withdrawals for medical costs
 * are tax-exempt (Tax Laws (Amendment) Act 2024, in force 27 December 2024).
 * Pre-funding medical through one is cheaper than paying for it out of a taxed
 * drawdown, and it is the answer to the problem MEDICAL_REAL_ESCALATION
 * describes rather than merely a way of describing it.
 *
 * This model still prices medical INSIDE the retirement pot, deliberately. A
 * PRMF is a choice the household has to actually make, and modelling it as
 * though they had would understate the pot for everyone who has not. The
 * honest treatment is to price the unfunded case and TELL the reader the
 * funded one exists — which the warnings now do.
 *
 * See lib/retirement-evidence.ts for the sources.
 */
export const PRMF_MONTHLY_TAX_RELIEF_CAP = 15_000;

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
  /** Share of today's LIVING costs still needed at retirement. Medical is not reduced. */
  livingReplacement?: number;
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
  /**
   * The same plan, split for a household that pre-funds medical separately.
   *
   * Not a different calculation — `medicalCapitalKes` is already the present
   * value of the medical stream, so this is the SAME number shown as its own
   * target rather than buried inside the pot. What changes is what a reader
   * can act on: a pension pot and a medical fund are bought from different
   * products, on different tax treatment, and a single combined figure hides
   * that the second one is cheaper to fund than the first.
   */
  prmf: {
    /** What the medical fund must hold at retirement, today's shillings. */
    targetKes: number;
    /** What the main pot drops to once medical is funded elsewhere. */
    livingOnlyCapitalKes: number;
    /** Level monthly contribution reaching targetKes by retirement. */
    monthlyContributionKes: number;
    /** Statutory cap on tax-deductible PRMF contributions, per month. */
    monthlyReliefCapKes: number;
    /** Whether the contribution above fits inside that cap. */
    withinReliefCap: boolean;
  };
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

  /* Living costs STEP DOWN at retirement, then decline further.
   *
   * This used to be `annualLivingNow` unchanged — no step at all — which meant
   * the model quietly assumed a retiree keeps spending what they spend now.
   * That is the assumption the planner had already rejected, and the gap
   * between the two tools was almost entirely this one line.
   *
   * Still in today's money, so no inflation is applied; the replacement rate
   * is a real reduction in what the household needs, not a price effect. */
  const replacement = input.livingReplacement ?? LIVING_REPLACEMENT_AT_RETIREMENT;
  const livingAtRetirement = annualLivingNow * replacement;
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
      `New cover at ${input.currentAge} is harder and dearer, but it exists — senior plans admit new members into the mid-seventies, and at least one has no maximum age. Price it now rather than assuming the door has shut, and ask about a post-retirement medical fund: contributions are tax-deductible to Ksh ${PRMF_MONTHLY_TAX_RELIEF_CAP.toLocaleString()} a month and withdrawals for treatment are tax-free.`
    );
  } else if (yearsLeftToBuyCover <= 10) {
    warnings.push(
      `About ${yearsLeftToBuyCover} years before new cover gets materially dearer. Past ${coverDeadlineAge} the choice narrows and continuous membership is priced better, so the decision is worth making early. A post-retirement medical fund is the cheaper route to the same place: contributions are tax-deductible to Ksh ${PRMF_MONTHLY_TAX_RELIEF_CAP.toLocaleString()} a month and withdrawals for treatment are tax-free.`
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

  /* Level monthly contribution reaching the medical target by retirement,
   * solved the same way the main plan solves its own: a real-return annuity.
   *
   * Uses realReturn rather than a fresh assumption. A medical fund and a
   * pension fund buy the same paper, and a PRMF quietly assuming a better
   * return than the pension beside it would be exactly the unexamined optimism
   * this codebase keeps deleting. */
  const prmfMonthly =
    yearsToRetirement <= 0
      ? medicalCapitalKes
      : realReturn === 0
        ? medicalCapitalKes / (yearsToRetirement * 12)
        : (medicalCapitalKes * realReturn) /
          (Math.pow(1 + realReturn, yearsToRetirement) - 1) /
          12;

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
    prmf: {
      targetKes: medicalCapitalKes,
      livingOnlyCapitalKes: Math.max(0, capitalRequiredKes - medicalCapitalKes),
      monthlyContributionKes: prmfMonthly,
      monthlyReliefCapKes: PRMF_MONTHLY_TAX_RELIEF_CAP,
      withinReliefCap: prmfMonthly <= PRMF_MONTHLY_TAX_RELIEF_CAP,
    },
  };
}
