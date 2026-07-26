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

  const values: number[] = [];
  for (let slot = 1; slot <= cycleMonths; slot++) {
    let pv = payout * discount(slot);
    for (let m = 1; m <= cycleMonths; m++) pv -= contribution * discount(m);
    values.push(pv);
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
  const monthlyPool = memberCount * monthlyContributionPerMember;
  const bufferAmount = monthlyPool * (emergencyBufferPercent / 100);
  const rotationPayout = monthlyPool - bufferAmount;
  const cycleMonths = memberCount;
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
