/**
 * Kenya land purchase total cost calculator.
 *
 * Buyers routinely underestimate transaction costs stacked on top of the quoted plot price.
 * This module computes every significant cost so users plan for the real total.
 *
 * Stamp duty rates: Stamp Duty Act Cap 480 (Kenya).
 *   Urban / non-agricultural: 4% of market value
 *   Agricultural / rural:     2% of market value
 *
 * Conveyancing fees: Advocates Remuneration Order (simplified to flat %).
 * Valuation, survey, and title fees: market rates sourced from ISK/RICS Kenya 2025.
 */

export type LandType = "urban_residential" | "agricultural";

export interface LandPurchaseInput {
  plotPriceKes: number;
  landType: LandType;
  usesAgent: boolean;
}

export interface LandCostBreakdown {
  plotPrice: number;
  stampDuty: number;
  stampDutyRatePct: number;
  legalFees: number;
  legalFeesRatePct: number;
  valuationFee: number;
  titleTransferFee: number;
  landSearchFee: number;
  surveyFee: number;
  agentCommission: number;
  totalTransactionCosts: number;
  grandTotal: number;
  hiddenCostPct: number;
}


/** VAT on legal services in Kenya. */
export const LEGAL_FEES_VAT_RATE = 0.16;

/** The ARO will not go below this, however small the transaction. */
export const CONVEYANCING_MINIMUM_FEE = 35_000;

/**
 * The Advocates Remuneration Order scale fee, before VAT.
 *
 * Cumulative by band, the way the Order reads: 2% of the first Ksh 5m (or the
 * minimum, whichever is greater), 1.5% of the next 95m, 1.25% thereafter.
 *
 * The minimum makes this REGRESSIVE, which is worth understanding rather than
 * smoothing away — on a Ksh 300,000 plot the fixed 35,000 is nearly 12% of the
 * price, while on a 10m plot the whole scale is 1.75%. The buyers least able
 * to absorb transaction costs pay the highest share of them, and a tool for
 * first-time buyers should show that rather than average it out.
 */
export function conveyancingScaleFee(price: number): number {
  if (price <= 0) return 0;
  let fee = 0;
  const firstBand = Math.min(price, 5_000_000);
  fee += firstBand * 0.02;
  if (price > 5_000_000) fee += Math.min(price - 5_000_000, 95_000_000) * 0.015;
  if (price > 100_000_000) fee += (price - 100_000_000) * 0.0125;
  return Math.max(CONVEYANCING_MINIMUM_FEE, Math.round(fee));
}

export function calculateLandPurchase(input: LandPurchaseInput): LandCostBreakdown {
  const { plotPriceKes: price, landType, usesAgent } = input;

  const stampDutyRatePct = landType === "agricultural" ? 2 : 4;
  const stampDuty = Math.round(price * (stampDutyRatePct / 100));

  /* Conveyancing, on the Advocates Remuneration Order scale.
   *
   * The previous version of this was wrong in four ways at once, and all four
   * ran the same direction — understating what the buyer pays, on a tool whose
   * entire purpose is warning them about costs they have not budgeted for. A
   * reader who trusted it arrived at closing short.
   *
   *   minimum fee     Ksh 3,000  ->  35,000   an order of magnitude
   *   2% band ceiling  500,000   ->  5,000,000
   *   floor rate       0.75%     ->  1.25%    the scale never goes that low
   *   VAT              absent    ->  16%      legal services are vatable
   *
   * On a Ksh 10m plot the old scale returned Ksh 100,000. Practitioners quote
   * a minimum of 150,000-180,000 for exactly that transaction, and this scale
   * produces 175,000 before VAT — which is how the structure below was
   * confirmed: it reproduces an independently published worked example.
   *
   * TWO THINGS TO KEEP IN MIND
   *
   * The ARO sets a MINIMUM. An advocate may not charge below it and routinely
   * charges above it, so this is a floor on the buyer's cost, not an estimate
   * of it. Under-promising the buyer's obligation is the safe direction here;
   * over-promising is how someone loses a deposit.
   *
   * The band boundaries carry some residual uncertainty — the primary Order is
   * behind sources this project could not fetch directly, so the structure is
   * corroborated rather than quoted. If a definitive copy is obtained, check
   * these thresholds first. What is NOT in doubt is that the old figures were
   * far too low.
   */
  const legalFees = Math.round(conveyancingScaleFee(price) * (1 + LEGAL_FEES_VAT_RATE));
  const legalFeesRatePct = price > 0 ? Math.round((legalFees / price) * 10_000) / 100 : 0;

  // Valuation fee: tiered by plot value (ISK scale, approximate).
  let valuationFee: number;
  if (price <= 1_000_000) valuationFee = 15_000;
  else if (price <= 5_000_000) valuationFee = 25_000;
  else if (price <= 20_000_000) valuationFee = 50_000;
  else valuationFee = 80_000;

  // Title deed transfer at Lands Registry.
  const titleTransferFee = price <= 5_000_000 ? 5_000 : 15_000;

  // Land search at Lands Registry.
  const landSearchFee = 500;

  // Survey / beaconing (required for most raw plot transactions).
  let surveyFee: number;
  if (price <= 1_000_000) surveyFee = 10_000;
  else if (price <= 5_000_000) surveyFee = 20_000;
  else surveyFee = 35_000;

  // Agent commission (standard 3% if using a real estate agent).
  const agentCommission = usesAgent ? Math.round(price * 0.03) : 0;

  const totalTransactionCosts =
    stampDuty +
    legalFees +
    valuationFee +
    titleTransferFee +
    landSearchFee +
    surveyFee +
    agentCommission;

  const grandTotal = price + totalTransactionCosts;
  const hiddenCostPct = price > 0 ? Math.round((totalTransactionCosts / price) * 1000) / 10 : 0;

  return {
    plotPrice: price,
    stampDuty,
    stampDutyRatePct,
    legalFees,
    legalFeesRatePct,
    valuationFee,
    titleTransferFee,
    landSearchFee,
    surveyFee,
    agentCommission,
    totalTransactionCosts,
    grandTotal,
    hiddenCostPct,
  };
}
