/**
 * What is actually known about Kenyan retirement adequacy and retiree medical
 * cover, with sources, so the model's assumptions can be argued with rather
 * than merely believed.
 *
 * WHY THIS FILE EXISTS
 *
 * The replacement rate — how much of pre-retirement money a household still
 * needs — is the single biggest lever in the retirement tools, and it had been
 * set three different ways in one day by intuition alone: implicitly ~89% in
 * the stream model, 50% in the planner, and a proposed 25%. Intuition is not a
 * source, and a number this load-bearing should not rest on one.
 *
 * The research below settles part of the argument and, honestly, contradicts
 * part of it. Both halves are recorded. A file that only wrote down the
 * evidence agreeing with the operator would be worse than no file.
 */

import { LIVING_REPLACEMENT_AT_RETIREMENT } from "./retirement-kenya";

export interface Evidence {
  claim: string;
  source: string;
  /** What it means for the model, including where it cuts against us. */
  implication: string;
}

/**
 * REPLACEMENT RATE — the regulator's position is far ABOVE ours, not below.
 *
 * This is the uncomfortable finding. The proposal on the table was that a
 * quarter of pre-retirement income should be enough. Kenya's own regulator
 * treats twice that as a crisis.
 */
export const REPLACEMENT_EVIDENCE: Evidence[] = [
  {
    claim:
      "The RBA's recommended income replacement ratio for Kenya is 75% of final salary.",
    source: "Retirement Benefits Authority, sector reviews",
    implication:
      "This is a policy aspiration, not an observation, and it is a replacement of INCOME rather than of spending — but it is the regulator's own benchmark and it sits far above anything this app assumes.",
  },
  {
    claim:
      "Kenya's actual income replacement ratio is below 40%, with middle-income earners averaging about 43%.",
    source: "Retirement Benefits Authority; Strathmore University, retirement income adequacy research",
    implication:
      "The RBA frames sub-40% as an ADEQUACY GAP to be closed, not as evidence that retirees need less. Anyone arguing for a lower target is arguing against the regulator's reading of the same market.",
  },
  {
    claim:
      "Replacement of INCOME and replacement of SPENDING are different quantities, and the gap is the savings rate.",
    source: "Arithmetic, stated here because the two are routinely conflated",
    implication:
      "A household saving 25% of income spends 75% of it. The app's 25%-of-SPENDING default is therefore about 19% of INCOME — well under half Kenya's observed 43% and about a quarter of the RBA's 75% target. The app is not being conservative on this lever; it is taking a deliberate position against the benchmarks, and the page says so rather than presenting it as neutral.",
  },
];

/**
 * MEDICAL — here the operator's thesis is CORRECT, current, and materially
 * better than what the model was doing.
 *
 * The argument was that retiree medical should be pre-funded through a
 * dedicated scheme rather than carried as an ordinary living cost. Kenya built
 * exactly that vehicle and gave it tax relief, and the model had not noticed.
 */
export const MEDICAL_EVIDENCE: Evidence[] = [
  {
    claim:
      "Post-Retirement Medical Funds are RBA-regulated vehicles for pre-funding retiree healthcare.",
    source: "Retirement Benefits Authority; National Retirement Benefits Policy",
    implication:
      "Medical need not be a rising stream inside the main pot. It can be a separate, purpose-built fund — which is a better structure than the one this app modelled.",
  },
  {
    claim:
      "Contributions to a post-retirement medical fund are tax-deductible up to Ksh 15,000 a month, and withdrawals for medical expenses are tax-exempt.",
    source: "Tax Laws (Amendment) Act 2024, in force 27 December 2024",
    implication:
      "Pre-funding medical is cheaper than funding it from taxed income inside the drawdown. This is a real and recent change, and it is the strongest single argument for separating medical from the living-cost calculation.",
  },
  {
    claim:
      "A single-premium immediate annuity converts one lump sum into a lifetime income stream.",
    source: "Jubilee Insurance, Single Premium Immediate Annuity",
    implication:
      "The one-off arrangement is real. It also transfers longevity risk to the insurer, which is precisely the risk a self-managed drawdown cannot diversify away.",
  },
  {
    claim:
      "Senior medical cover is sold well past 65: Britam's Milele plan admits from 55 with NO maximum exit age, Britam's Bima ya Mwananchi Senior admits to 75, and Jubilee's J-Senior to 79.",
    source: "Britam; Jubilee Insurance product literature",
    implication:
      "CORRECTS THIS APP. The model warned that the door closes in the mid-sixties. It narrows and it gets dearer, but products admitting new entrants at 75 and 79 exist, and one has no exit age at all. The warning was too absolute.",
  },
];

/**
 * The honest summary, for a reader deciding what to believe.
 *
 * Deliberately not phrased as a recommendation. Both numbers below are
 * defensible readings of the same market by people who are not idiots, and the
 * app's job is to show the reader where their own assumption sits rather than
 * to pick for them.
 */
/**
 * The savings rate used to convert a share of SPENDING into a share of INCOME.
 *
 * A household saving 25% of income spends the other 75%, so a replacement rate
 * quoted against spending is 0.75x the same rate quoted against income. This is
 * the one number that makes the app's default comparable to the RBA's, and it
 * is an assumption rather than an observation — stated as a constant so it can
 * be argued with, instead of being buried inside a multiplication.
 */
export const ASSUMED_SAVINGS_RATE = 0.25;

/** A share of spending, restated as the share of income the benchmarks use. */
export const asShareOfIncome = (shareOfSpending: number): number =>
  shareOfSpending * (1 - ASSUMED_SAVINGS_RATE);

export const REPLACEMENT_BENCHMARKS = [
  { label: "RBA target", shareOfIncome: 0.75, note: "The regulator's stated goal for Kenya." },
  { label: "Kenya today", shareOfIncome: 0.43, note: "Observed average for middle-income earners." },
  {
    /* DERIVED, not typed. This entry read 0.19 as a literal, which was correct
     * only for as long as LIVING_REPLACEMENT_AT_RETIREMENT stayed at 25% — and
     * that constant had already been changed twice in a day. A benchmark table
     * that silently stops describing the app is worse than no benchmark table,
     * because its whole purpose is to be trusted at a glance. */
    label: "This app's default",
    shareOfIncome: asShareOfIncome(LIVING_REPLACEMENT_AT_RETIREMENT),
    note: `${Math.round(LIVING_REPLACEMENT_AT_RETIREMENT * 100)}% of spending, at a ${Math.round(
      ASSUMED_SAVINGS_RATE * 100
    )}% savings rate — set by the operator with the two figures above in view, and paired with medical pre-funded separately.`,
  },
] as const;
