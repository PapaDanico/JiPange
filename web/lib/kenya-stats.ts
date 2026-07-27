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

import { SOURCES, figure, fulizaPerUserKsh, mmfShareOfDepositsPct } from "./sources";

// ── FinAccess Household Survey 2024 (CBK / KNBS / FSD Kenya) ──
export const FINACCESS_FORMAL_INCLUSION_PCT = figure("finaccessFormalInclusionPct");
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

export { SOURCES };
