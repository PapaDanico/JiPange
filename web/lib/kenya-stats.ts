/**
 * Kenya research constants, under the names the app already imports.
 *
 * The numbers no longer live here. They live in sources.ts, each attached to
 * the publication it came from and the date it must be re-checked. This module
 * remains because a constant with a familiar name reads better at a call site
 * than a lookup, and because moving the values should not have meant touching
 * every page that shows one.
 *
 * Anything derived — a complement, a share, a per-user average — is COMPUTED
 * here rather than typed. The pair that used to read
 *
 *     FINACCESS_LITERACY_PASS_PCT = 42.1
 *     FINACCESS_LITERACY_FAIL_PCT = 57.9
 *
 * could be corrected one at a time, and for as long as anyone left it that way
 * they would have summed to something other than 100 with nothing to say so.
 */

import {
  SOURCES,
  cbkAvgDigitalLoanKsh,
  cbkDigitalCreditGrowthPct,
  cbkHouseholdNplRatioPct,
  cbkInsuredShareOfDepositsPct,
  figure,
  fulizaPerUserKsh,
  mmfShareOfDepositsPct,
} from "./sources";
import { WHT_ON_INTEREST } from "./mmf-vs-tbill";

// ── FinAccess Household Survey 2024 (CBK / KNBS / FSD Kenya) ──
export const FINACCESS_FORMAL_INCLUSION_PCT = figure("finaccessFormalInclusionPct");
/** Gap in formal access between men and women, 2024 and 2021 (§2.5). */
export const FINACCESS_GENDER_GAP_PTS = figure("finaccessGenderGapFormalPts");
export const FINACCESS_GENDER_GAP_PRIOR_PTS = figure("finaccessGenderGapFormalPriorPts");
/** Passed all three questions: inflation, INTEREST RATES, risk diversification. */
export const FINACCESS_LITERACY_PASS_PCT = figure("finaccessLiteracyPassPct");
/** The complement, derived — never a second number to keep in step by hand. */
export const FINACCESS_LITERACY_FAIL_PCT =
  Math.round((100 - FINACCESS_LITERACY_PASS_PCT) * 10) / 10;

// ── Retirement Benefits Authority ──
export const RBA_NO_PENSION_PCT = figure("rbaNoPensionPct");
export const RBA_COVERAGE_OF_WORKING_AGE_PCT = figure("rbaCoverageOfWorkingAgePct");
/** Retirees whose income covers daily needs, and the majority for whom it does not. */
export const RBA_INCOME_MEETS_NEEDS_PCT = figure("rbaIncomeMeetsNeedsPct");
export const RBA_INCOME_FALLS_SHORT_PCT =
  Math.round((100 - RBA_INCOME_MEETS_NEEDS_PCT) * 10) / 10;

// ── KNBS Economic Survey ──
export const INFORMAL_WORKERS_MILLIONS = figure("informalWorkersMillions");

// ── Safaricom FY2026 ──
export const FULIZA_USERS_MILLIONS = figure("fulizaUsersMillions");
export const FULIZA_VOLUME_TRILLION_KSH = figure("fulizaVolumeTrillionKsh");
/** Borrowed per user across the year. Not a per-transaction ticket — see sources.ts. */
export const FULIZA_PER_USER_KSH = Math.round(fulizaPerUserKsh());

// ── Where the money sits: CBK banking aggregates, CMA's quarterly CIS report ──
export const BANK_DEPOSITS_TRILLION_KSH = figure("bankDepositsTrillionKsh");
export const MMF_AUM_BILLION_KSH = figure("mmfAumBillionKsh");
/** Share of bank deposits held in MMFs instead, to one decimal. */
export const MMF_SHARE_OF_DEPOSITS_PCT = Math.round(mmfShareOfDepositsPct() * 10) / 10;
/** The remainder, sitting in accounts that pay below inflation. Ksh trillion. */
export const BANK_SAVINGS_EARNING_BELOW_INFLATION_TRILLION =
  Math.round((BANK_DEPOSITS_TRILLION_KSH - MMF_AUM_BILLION_KSH / 1000) * 10) / 10;

// ── CBK Bank Supervision Annual Report 2025 (year to 31 December 2025) ──
export const CBK_MORTGAGE_AVG_RATE_PCT = figure("cbkMortgageAvgRatePct");
export const CBK_MORTGAGE_AVG_RATE_PRIOR_PCT = figure("cbkMortgageAvgRatePriorPct");
export const CBK_MORTGAGE_AVG_TERM_YEARS = figure("cbkMortgageAvgTermYears");
export const CBK_AVG_LENDING_RATE_PCT = figure("cbkAvgLendingRatePct");
export const CBK_AVG_DEPOSIT_RATE_PCT = figure("cbkAvgDepositRatePct");
/**
 * The average deposit rate after the 15% withholding tax — the number to set
 * beside a T-bill's net yield, since both are then what the saver keeps.
 */
export const CBK_AVG_DEPOSIT_RATE_NET_PCT =
  Math.round(CBK_AVG_DEPOSIT_RATE_PCT * (1 - WHT_ON_INTEREST) * 100) / 100;
/** Insured share of bank customer deposits by value, to one decimal. */
export const CBK_INSURED_SHARE_OF_DEPOSITS_PCT =
  Math.round(cbkInsuredShareOfDepositsPct() * 10) / 10;
export const CBK_SECTOR_NPL_RATIO_PCT = figure("cbkSectorNplRatioPct");
/** Non-performing share of household lending, to one decimal. Derived, not stated. */
export const CBK_HOUSEHOLD_NPL_RATIO_PCT = Math.round(cbkHouseholdNplRatioPct() * 10) / 10;
export const CBK_DIGITAL_CREDIT_BILLION_KSH = figure("cbkDigitalCreditBillionKsh");
/** Growth in digital lending over 2025, whole percent. */
export const CBK_DIGITAL_CREDIT_GROWTH_PCT = Math.round(cbkDigitalCreditGrowthPct());
export const CBK_DIGITAL_CREDIT_LOANS_MILLIONS = figure("cbkDigitalCreditLoansMillions");
export const CBK_DIGITAL_LENDERS_LICENSED = figure("cbkDigitalLendersLicensed");
/** Average digital loan outstanding, to the nearest hundred shillings. */
export const CBK_AVG_DIGITAL_LOAN_KSH = Math.round(cbkAvgDigitalLoanKsh() / 100) * 100;
export const CBK_MOBILE_MONEY_SUBSCRIPTIONS_MILLIONS = figure("cbkMobileMoneySubscriptionsMillions");
/** The report's own date and name, for a citation line beside any of these. */
export const CBK_BSAR_2025_CITE = "CBK Bank Supervision Annual Report 2025";

// ── IMF World Economic Outlook, April 2026 ──
/**
 * Projections, not measurements — calendar-2026 annual figures IMF staff
 * expect, re-checked on the WEO's April/October cadence. Use these where a
 * page looks FORWARD (a plan, a projection, an assumption). Where a page
 * states what Kenya's inflation or growth IS, use the KNBS/CBK outturns the
 * rates feed carries instead; the note on each registry entry explains why
 * the two kinds of number are not interchangeable.
 */
export const IMF_WEO_REAL_GDP_GROWTH_2026_PCT = figure("imfWeoRealGdpGrowth2026Pct");
export const IMF_WEO_INFLATION_2026_PCT = figure("imfWeoInflation2026Pct");
export const IMF_WEO_GROSS_DEBT_PCT_GDP_2026 = figure("imfWeoGrossDebtPctGdp2026");

export { SOURCES };
