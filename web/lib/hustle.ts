/**
 * Volatile-income smoothing for cycle-based ventures (poultry, horticulture,
 * cash crops, gigs): the lump-sum payout parks in an MMF "smoothing tank"
 * and pays a steady monthly salary while next cycle's inputs stay protected.
 */

export const VENTURE_TYPES = [
  { value: "poultry", label: "Poultry / Livestock", emoji: "🐔", defaultCycleDays: 45 },
  { value: "horticulture", label: "Horticulture", emoji: "🥬", defaultCycleDays: 90 },
  { value: "cash_crops", label: "Cash Crops", emoji: "🌽", defaultCycleDays: 180 },
  { value: "gigs", label: "Consulting / Gigs", emoji: "💼", defaultCycleDays: 60 },
] as const;

export type VentureType = (typeof VENTURE_TYPES)[number]["value"];

/**
 * The spec's smoothing rule: net cycle profit spread across the cycle's
 * months is the most you can pay yourself without eating seed capital.
 */
export function maxSafeMonthlyDraw(params: {
  targetLumpSumPayout: number;
  inputCostsPerCycle: number;
  cycleLengthDays: number;
}): number {
  if (params.cycleLengthDays <= 0) return 0;
  const months = params.cycleLengthDays / 30;
  return Math.max(0, (params.targetLumpSumPayout - params.inputCostsPerCycle) / months);
}

export interface RunwayStatus {
  protected: boolean;
  shortfall: number;
}

/** Module A: is next cycle's seed capital already covered by active savings? */
export function nextCycleRunway(params: {
  activeSavings: number;
  inputCostsPerCycle: number;
}): RunwayStatus {
  const shortfall = Math.max(0, params.inputCostsPerCycle - params.activeSavings);
  return { protected: shortfall === 0, shortfall };
}
