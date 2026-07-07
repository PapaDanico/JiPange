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

function futureValueAnnuity(monthlyContrib: number, monthlyRate: number, months: number): number {
  if (monthlyRate === 0) return monthlyContrib * months;
  return monthlyContrib * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
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

  // First receiver pays X once then receives: net gain = payout - X
  const netGainFirstReceiver = rotationPayout - monthlyContributionPerMember;
  // Last receiver pays X × N then receives: net gain = payout - (X × N) = -(N-1)×X + payout - X
  // = rotationPayout - monthlyContributionPerMember × cycleMonths
  const netGainLastReceiver =
    rotationPayout - monthlyContributionPerMember * cycleMonths;

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
  const monthlyPool = memberCount * monthlyContributionPerMember;
  const monthlyRate = annualReturnPercent / 100 / 12;

  const value1Yr = futureValueAnnuity(monthlyPool, monthlyRate, 12);
  const value3Yr = futureValueAnnuity(monthlyPool, monthlyRate, 36);
  const value5Yr = futureValueAnnuity(monthlyPool, monthlyRate, 60);

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
