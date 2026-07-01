import { calculateNetPay } from "./tax";
import { round2 } from "./money";

/**
 * Solves for the gross salary that produces a given net take-home pay.
 * calculateNetPay's net-pay output is continuous and strictly increasing in
 * gross (every deduction's marginal rate is well under 100%), so bisection
 * converges reliably without needing a closed-form inverse of the tax bands.
 */
export function solveGrossForTargetNet(targetNet: number): number {
  if (targetNet <= 0) return 0;

  let low = targetNet;
  let high = Math.max(targetNet * 2, targetNet + 10_000);

  while (calculateNetPay(high).netMonthly < targetNet && high < 1e9) {
    high *= 2;
  }

  for (let i = 0; i < 100; i++) {
    const mid = (low + high) / 2;
    const netAtMid = calculateNetPay(mid).netMonthly;
    if (Math.abs(netAtMid - targetNet) < 0.5) {
      return round2(mid);
    }
    if (netAtMid < targetNet) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return round2((low + high) / 2);
}
