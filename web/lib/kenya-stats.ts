/**
 * Kenya financial research constants — sourced from publicly available surveys and reports.
 * Used on the landing page and throughout the app for contextual education.
 */

// ── FinAccess Household Survey 2024 (CBK / FSD Kenya / KNBS) ──
export const FINACCESS_FORMAL_INCLUSION_PCT = 84.8; // % with access to formal financial services
export const FINACCESS_LITERACY_PASS_PCT = 42.1;    // % who passed all 3 literacy questions (inflation, compound interest, risk)
export const FINACCESS_LITERACY_FAIL_PCT = 57.9;    // complement — majority couldn't pass

// ── RBA Pensioners Survey 2024 / RBA Statistical Digest 2024 ──
export const RBA_NO_PENSION_PCT = 81;                // % of Kenya workforce with no active pension contribution
export const RBA_PENSIONER_DISSATISFIED_PCT = 65;   // % of retirees dissatisfied with what they receive

// ── Kenya Informal Sector (KIPPRA 2024 / Pension Policy International) ──
export const INFORMAL_WORKERS_MILLIONS = 18.1;       // million Kenyans in informal sector
export const INFORMAL_PENSION_COVERAGE_PCT = 2.5;   // % with any pension coverage

// ── Safaricom FY2026 (Techweez / Nation Africa) ──
export const FULIZA_USERS_MILLIONS = 17.7;           // million Kenyans who used Fuliza in the year
export const FULIZA_VOLUME_TRILLION_KSH = 1.46;     // KSh trillion borrowed through Fuliza
export const FULIZA_AVG_TICKET_KSH = 254;           // average Fuliza borrow per transaction

// ── CMA Collective Investment Schemes, July 2026 / Business Daily Africa ──
export const BANK_DEPOSITS_TRILLION_KSH = 5;        // KSh trillion in Kenyan bank accounts
export const MMF_AUM_BILLION_KSH = 370;             // KSh billion in money market funds
// Gap: 5T − 0.37T = 4.63T (rounds to 4.6T in copy)
export const BANK_SAVINGS_EARNING_BELOW_INFLATION_TRILLION = 4.6;
