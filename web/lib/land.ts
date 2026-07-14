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

export function calculateLandPurchase(input: LandPurchaseInput): LandCostBreakdown {
  const { plotPriceKes: price, landType, usesAgent } = input;

  const stampDutyRatePct = landType === "agricultural" ? 2 : 4;
  const stampDuty = Math.round(price * (stampDutyRatePct / 100));

  // Conveyancing: simplified Advocates Remuneration Order scale.
  let legalFees: number;
  let legalFeesRatePct: number;
  if (price <= 500_000) {
    legalFees = Math.max(3_000, Math.round(price * 0.02));
    legalFeesRatePct = 2;
  } else if (price <= 2_000_000) {
    legalFees = Math.round(price * 0.015);
    legalFeesRatePct = 1.5;
  } else if (price <= 10_000_000) {
    legalFees = Math.round(price * 0.01);
    legalFeesRatePct = 1;
  } else {
    legalFees = Math.round(price * 0.0075);
    legalFeesRatePct = 0.75;
  }

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
  const hiddenCostPct = Math.round((totalTransactionCosts / price) * 1000) / 10;

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
