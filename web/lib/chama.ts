import { futureValue } from "./projections";
import { tbillRate } from "./rates-feed";

export interface ChamaMerryGoRoundResult {
  mode: "merry-go-round";
  monthlyPool: number;
  rotationPayout: number;
  cycleMonths: number;
  emergencyFundPerCycle: number;
  netGainFirstReceiver: number;
  netGainLastReceiver: number;
  /**
   * What each rotation slot is worth in today's money, slot 1 first.
   *
   * The nominal cash answer is that every slot is identical — everybody pays
   * X for N months and receives the same payout once, so the "net gain" is
   * minus the welfare buffer for every member regardless of position. The tool
   * reported that number twice under two labels and coloured one of them green.
   *
   * The real difference is timing, and timing has a price. Going first is an
   * interest-free loan from the group; going last is an interest-free loan TO
   * the group. This values both against the published 364-day Treasury bill
   * yield after tax — the risk-free thing a Kenyan saver could otherwise do
   * with the same shillings.
   */
  slotPresentValues: number[];
  /** PV of slot 1 minus PV of the last slot: the price of the queue. */
  firstVersusLastKES: number;
  /** Annual discount rate used, as a fraction. */
  discountRate: number;
  discountRateSource: string;
}

export interface ChamaInvestmentResult {
  mode: "investment";
  monthlyPool: number;
  value1Yr: number;
  value3Yr: number;
  value5Yr: number;
  perMemberShare1Yr: number;
  perMemberShare3Yr: number;
  perMemberShare5Yr: number;
}

export type ChamaResult = ChamaMerryGoRoundResult | ChamaInvestmentResult;

/**
 * Value every rotation slot in today's money.
 *
 * A member in slot k pays the contribution at the end of months 1..N and
 * receives the payout at the end of month k. Discounting both legs at a
 * monthly rate derived from the published 364-day T-bill yield after tax gives
 * the only honest statement of what the queue position is worth: the
 * opportunity cost of the shillings, measured against the risk-free
 * alternative that is actually available to a Kenyan saver.
 *
 * Slot 1 is worth the most and slot N the least, always, monotonically. That
 * is not a modelling choice — it falls out of money having a price.
 */
function rotationSlotValues(
  cycleMonths: number,
  contribution: number,
  payout: number
): { values: number[]; rate: number; source: string } {
  const bill = tbillRate(364);
  // No published rate means no time value we can defend, so the answer is a
  // flat zero-rate valuation — every slot equal — rather than a made-up rate.
  const annual = bill ? bill.netEAY / 100 : 0;
  const monthly = Math.pow(1 + annual, 1 / 12) - 1;
  const discount = (months: number) => 1 / Math.pow(1 + monthly, months);

  /* The contributions cost the same whatever slot you draw.
   *
   * This inner sum was recomputed for every slot, and it does not depend on
   * the slot — a member pays the same twelve instalments on the same dates
   * regardless of when they collect. So the loop was quadratic in the member
   * count for an answer that never changed, which at 999,999,999,999 members
   * (an extra digit, nothing more) locked the tab solid with nothing to
   * cancel. Hoisting it is not an optimisation of the maths; it is the maths.
   * Every value below is identical to what the nested version produced. */
  let contributionsPV = 0;
  for (let m = 1; m <= cycleMonths; m++) contributionsPV += contribution * discount(m);

  const values: number[] = [];
  for (let slot = 1; slot <= cycleMonths; slot++) {
    values.push(payout * discount(slot) - contributionsPV);
  }
  return {
    values,
    rate: annual,
    source: bill
      ? `364-day Treasury bill, ${bill.netEAY.toFixed(2)}% after tax`
      : "no published rate available",
  };
}

/**
 * The most members this will model.
 *
 * The member count is a cycle length and therefore an iteration count, taken
 * straight from a text box. A chama of two hundred is already far past what
 * the form is for — these are groups of friends, colleagues and neighbours,
 * typically ten to thirty — so this is generous rather than restrictive, and
 * it makes a mistyped digit harmless instead of fatal to the tab.
 */
export const MAX_CHAMA_MEMBERS = 200;

/**
 * Merry-go-round (rotation) chama:
 * Every month, all members contribute. One member receives the full pool
 * (minus an emergency buffer held back by the group). After N months every
 * member has had one rotation.
 */
export function calculateMerryGoRound(
  memberCount: number,
  monthlyContributionPerMember: number,
  emergencyBufferPercent: number
): ChamaMerryGoRoundResult {
  /* Enforced here, not only in the form.
   *
   * The cap started life as a constant next to a comment and a check in the
   * calculator — which bounds the one caller that exists today and nothing
   * else. Hoisting the inner sum made this linear rather than quadratic, but
   * linear in a trillion is still a frozen tab and an array nobody can hold,
   * so the guarantee has to live where the loop does. */
  const members = Math.min(Math.max(0, Math.floor(memberCount)), MAX_CHAMA_MEMBERS);
  const monthlyPool = members * monthlyContributionPerMember;
  const bufferAmount = monthlyPool * (emergencyBufferPercent / 100);
  const rotationPayout = monthlyPool - bufferAmount;
  const cycleMonths = members;
  const emergencyFundPerCycle = bufferAmount * cycleMonths;

  // Every member pays X for every month of the full cycle — the advantage of going
  // first is timing (earlier access to cash), not a different cash gain.
  // net = rotationPayout − X × N for both first and last receiver.
  const netGainFirstReceiver = rotationPayout - monthlyContributionPerMember * cycleMonths;
  const netGainLastReceiver = rotationPayout - monthlyContributionPerMember * cycleMonths;

  const { values: slotPresentValues, rate: discountRate, source: discountRateSource } =
    rotationSlotValues(cycleMonths, monthlyContributionPerMember, rotationPayout);
  const firstVersusLastKES =
    slotPresentValues.length > 1
      ? slotPresentValues[0] - slotPresentValues[slotPresentValues.length - 1]
      : 0;

  return {
    slotPresentValues,
    firstVersusLastKES,
    discountRate,
    discountRateSource,
    mode: "merry-go-round",
    monthlyPool,
    rotationPayout,
    cycleMonths,
    emergencyFundPerCycle,
    netGainFirstReceiver,
    netGainLastReceiver,
  };
}

/**
 * Investment chama: instead of rotating, the group pools contributions and
 * invests them (e.g. in a group MMF or SACCO). Distributes proceeds at
 * agreed checkpoints.
 */
export function calculateChamaInvestment(
  memberCount: number,
  monthlyContributionPerMember: number,
  annualReturnPercent: number
): ChamaInvestmentResult {
  if (memberCount <= 0) {
    return {
      mode: "investment",
      monthlyPool: 0,
      value1Yr: 0,
      value3Yr: 0,
      value5Yr: 0,
      perMemberShare1Yr: 0,
      perMemberShare3Yr: 0,
      perMemberShare5Yr: 0,
    };
  }

  const monthlyPool = memberCount * monthlyContributionPerMember;
  const annualRate = annualReturnPercent / 100;
  const value1Yr = futureValue(0, monthlyPool, annualRate, 1);
  const value3Yr = futureValue(0, monthlyPool, annualRate, 3);
  const value5Yr = futureValue(0, monthlyPool, annualRate, 5);

  return {
    mode: "investment",
    monthlyPool,
    value1Yr,
    value3Yr,
    value5Yr,
    perMemberShare1Yr: value1Yr / memberCount,
    perMemberShare3Yr: value3Yr / memberCount,
    perMemberShare5Yr: value5Yr / memberCount,
  };
}
