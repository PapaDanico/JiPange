import { calculateLoanAmortization, MAX_TERM_MONTHS } from "./loans";
import { MAX_AMOUNT, round2 } from "./money";
import { calculateFulizaCost, FULIZA_MAX_LIMIT } from "./fuliza";
import { SACCO_MONTHLY_RATE } from "./loan-assumptions";
export { SACCO_MONTHLY_RATE } from "./loan-assumptions";

/**
 * Borrowing compared the way Kenyan disclosure rules compare it, rebuilt
 * 27 Nov 2026 from docs/research/2026-11-27-credit-and-bond-engine-gaps in
 * PapaDanico/Mwangaza-Yield.
 *
 * WHAT CHANGED, AND WHY.
 * - The headline is the TOTAL COST in shillings for this amount (the Total
 *   Cost of Credit that CBK requires banks and digital lenders to disclose).
 * - One annualised figure for every row: the compounded effective annual rate
 *   on the cash actually received. The old "APR" column mixed five methods
 *   (SACCO compounded, bank nominal, a flat-to-reducing approximation, Fuliza
 *   simple x365, M-Shwari compounded), so the rows were not comparable.
 * - 30-day products (Fuliza, M-Shwari, app lenders) are shown for their own
 *   30-day term. Stretching their fees over a multi-year term described an
 *   instalment loan none of them offers. For a longer need, the only certain
 *   statement is a floor: rolling over costs at least one cycle's fee a month.
 * - Real pricing: M-Shwari's 7.5% facility fee plus the 20% excise on it,
 *   deducted at payout since 8 Mar 2024 (NCBA key facts); an app lender at
 *   Tala's own published 0.3-0.6% a day; a bank at CBK's average lending rate.
 * - No green/amber/red tiers. They were a judgement presented as a measure.
 *
 * Every figure is illustrative of a product type, not a lender's offer, and
 * excludes fees the reader can only get from the lender (processing,
 * insurance, appraisal). The page says so.
 */

/** CBK, commercial banks' average lending rate, May 2026 (Statistical Bulletin). */
export const BANK_ANNUAL_RATE = 0.145;
/** M-Shwari facility fee per 30-day loan (NCBA key facts, 2023-2026). */
export const MSHWARI_FEE = 0.075;
/** Excise duty on the facility fee, 20%, deducted from the loan at payout. */
export const MSHWARI_EXCISE_ON_FEE = 0.2;
/** Tala's own published daily rate range (tala.co.ke FAQ, read Nov 2026). */
export const APP_LENDER_DAILY_RATE = { low: 0.003, high: 0.006 } as const;
/** The cycle the short products are priced on. */
export const SHORT_TERM_DAYS = 30;

export type LoanKind = "term" | "short";

export interface LoanProductComparison {
  name: string;
  kind: LoanKind;
  /** The product's own term, in days: the reader's term for a term loan, 30 for a short product. */
  termDays: number;
  /** Equal monthly instalment for a term loan; null for a short product, repaid in one go. */
  monthlyPayment: number | null;
  /** What reaches the borrower: the loan less anything deducted at payout. */
  cashReceived: number;
  totalRepaid: number;
  /** Total cost of credit in shillings over `termDays`: everything paid beyond the cash received. */
  totalCost: number;
  /** Compounded effective annual rate on the cash received, from the actual cash flows. */
  effectiveAnnualRate: number;
  /** For a short product when the reader needs it longer: the least rolling over could cost. Null otherwise. */
  rolloverFloorCost: number | null;
  /** How the row was priced, in a sentence the page can show. */
  basis: string;
  estimated: true;
}

/** Effective annual rate of equal monthly payments on cash received. */
function earFromInstalments(cashReceived: number, payment: number, months: number): number {
  let lo = 1e-12, hi = 1;
  for (let i = 0; i < 200; i++) {
    const r = (lo + hi) / 2;
    const pv = (payment * (1 - Math.pow(1 + r, -months))) / r;
    if (pv > cashReceived) lo = r;
    else hi = r;
  }
  return Math.pow(1 + (lo + hi) / 2, 12) - 1;
}

/** Effective annual rate of one repayment after `days` on cash received. */
function earFromBullet(cashReceived: number, repaid: number, days: number): number {
  return Math.pow(repaid / cashReceived, 365 / days) - 1;
}

function termLoan(name: string, principal: number, annualRate: number, months: number, basis: string): LoanProductComparison {
  const a = calculateLoanAmortization({ principal, annualRate, termMonths: months });
  return {
    name,
    kind: "term",
    termDays: Math.round((months * 365) / 12),
    monthlyPayment: a.monthlyPayment,
    cashReceived: principal,
    totalRepaid: a.totalPaid,
    totalCost: round2(a.totalPaid - principal),
    effectiveAnnualRate: earFromInstalments(principal, a.monthlyPayment, months),
    rolloverFloorCost: null,
    basis,
    estimated: true,
  };
}

function shortLoan(
  name: string,
  principal: number,
  deductedAtPayout: number,
  repaid: number,
  months: number,
  basis: string,
): LoanProductComparison {
  const cashReceived = round2(principal - deductedAtPayout);
  const cycleCost = round2(repaid - cashReceived);
  // A floor, so one cycle per month needed: each month needs at least one
  // 30-day cycle, and every cycle costs at least the first one.
  const cycles = months;
  return {
    name,
    kind: "short",
    termDays: SHORT_TERM_DAYS,
    monthlyPayment: null,
    cashReceived,
    totalRepaid: round2(repaid),
    totalCost: cycleCost,
    effectiveAnnualRate: earFromBullet(cashReceived, repaid, SHORT_TERM_DAYS),
    rolloverFloorCost: cycles > 1 ? round2(cycleCost * cycles) : null,
    basis,
    estimated: true,
  };
}

export function compareLoanProducts(principal: number, termMonths: number): LoanProductComparison[] {
  if (!Number.isFinite(principal) || principal <= 0 || principal > MAX_AMOUNT ||
      !Number.isSafeInteger(termMonths) || termMonths <= 0 || termMonths > MAX_TERM_MONTHS) return [];

  const mshwariFee = principal * MSHWARI_FEE;
  const appMid = (APP_LENDER_DAILY_RATE.low + APP_LENDER_DAILY_RATE.high) / 2;
  const fuliza = calculateFulizaCost(principal, SHORT_TERM_DAYS);

  return [
    termLoan("SACCO loan", principal, SACCO_MONTHLY_RATE * 12, termMonths,
      "1% a month on the reducing balance, the usual SACCO headline rate. Some SACCOs charge 1% flat, which costs about twice as much; ask which."),
    termLoan("Bank personal loan", principal, BANK_ANNUAL_RATE, termMonths,
      "14.5% a year on the reducing balance, CBK's average bank lending rate (May 2026). Your bank prices you individually; ask for its Total Cost of Credit."),
    shortLoan("App lender (e.g. Tala)", principal, 0, principal * (1 + appMid * SHORT_TERM_DAYS), termMonths,
      "0.45% a day for 30 days, the middle of Tala's published 0.3-0.6% a day. Repaid in one go; not an instalment loan."),
    // Fuliza only appears when it could actually be drawn — see FULIZA_MAX_LIMIT.
    ...(principal <= FULIZA_MAX_LIMIT
      ? [shortLoan("Fuliza", principal, 0, fuliza.totalRepaid, termMonths,
          "The 1% access fee plus the banded daily fee with excise, for 30 days. An overdraft on M-PESA, repaid from incoming money.")]
      : []),
    shortLoan("M-Shwari", principal, mshwariFee * MSHWARI_EXCISE_ON_FEE, principal + mshwariFee, termMonths,
      "7.5% facility fee for 30 days, plus excise of 20% on that fee taken off the loan when it is paid out. Unpaid on day 31, it rolls over with a new fee."),
  ];
}
