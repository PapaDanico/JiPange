import { futureValue } from "./projections";

export interface ChamaMerryGoRoundResult {
  mode: "merry-go-round";
  monthlyPool: number;
  rotationPayout: number;
  cycleMonths: number;
  emergencyFundPerCycle: number;
  netGainFirstReceiver: number;
  netGainLastReceiver: number;
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

  return {
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
