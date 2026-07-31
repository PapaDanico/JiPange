import { tbillRate } from "./rates-feed";

export type ProductType = "mmf" | "tbill" | "sacco" | "pension" | "prmf";

/**
 * Whether a quoted yield is before or after withholding tax.
 *
 * This is not a detail. MMF and SACCO figures are published gross, Treasury
 * bill yields here are computed net, and listing them side by side without
 * saying which is which invites a reader to compare 11.8% against 8.45% and
 * conclude the wrong thing — the MMF is nearer 10.0% once 15% tax is taken.
 * Every card states its basis.
 */
export type YieldBasis = "gross" | "net";
export type Regulator = "CMA" | "CBK" | "SASRA" | "CBK+CMA" | "RBA";

/**
 * The observation date of the FIGURES, not the day somebody edited this file.
 *
 * The yields carried no date at all to begin with — the defect this codebase
 * keeps finding, a figure true once and quietly outrun. MMF yields move
 * monthly, faster than almost anything else quoted in either product, so an
 * undated 11.8% is a liability rather than information.
 *
 * The first fix was worse than the problem it named: this read 2026-07-27, the
 * day the constant was added, above yields that were still the inherited ~11%.
 * A market survey then put the same funds at 14.8-17.5%. Stamping today's date
 * on figures nobody had checked did not make them current — it made stale
 * numbers look fresh and disarmed the very guard built to catch them. The date
 * now belongs to the survey the numbers came from, and a fund with no figure
 * in that survey carries no figure at all.
 *
 * Past the window the yields stop being shown as current. The provider list
 * itself stays useful: which funds exist, who regulates them and how you
 * reach your money do not change monthly.
 *
 * ── Why no money market fund quotes a rate here right now ──────────────────
 *
 * An MMF holds Treasury bills and bank deposits, so its gross yield tracks the
 * short bill plus a thin spread, before management fees. That makes the live
 * 91-day rate a hard ceiling on what any fund can honestly claim — and it is
 * the one number in this system that cannot be typed in wrong.
 *
 * The survey these figures came from listed 14.8-18.2% and was labelled with a
 * recent date. The 91-day bill pays 9.30%. Both cannot be true: those rates
 * belong to the 2024-25 environment, when Kenyan bills were above 16%, and the
 * date on the table was newer than the numbers under it. Every one was removed
 * rather than shown, because a confident 18.2% beside a 9.30% bill does not
 * read as "stale" to anybody — it reads as a good deal.
 *
 * The irony is exact. Those figures replaced an inherited ~11% that was undated
 * and unsourced but roughly right, and the replacement was worse. Provenance
 * and accuracy are different virtues; this file has now failed at each while
 * satisfying the other.
 */
/* WHAT THIS DATE ACTUALLY GOVERNS, which its name gets wrong.
 *
 * Not fund yields. No money market fund in this file carries one — see the
 * Ziidi entry below for why that is a considered refusal rather than a gap.
 * The only yields here are the T-bill, read live from the rates feed and never
 * stale, and three SACCO dividends, dated separately by SACCO_RATES_AS_OF
 * because they are declared once a year at an AGM.
 *
 * So this dates the SURVEY: minimum entry, product terms, and which funds are
 * listed. Those age far more slowly than a yield, which is why a 120-day
 * window is reasonable for them and would not be for a rate.
 *
 * Worth stating because the staleness notice this drives originally warned
 * about "fund yields" and reassured the reader that "minimums are unaffected"
 * — precisely inverted. It disclaimed the one thing the page does not show and
 * vouched for the one thing this date is about.
 *
 * RENAMED FROM YIELDS_AS_OF, because keeping the wrong name cost real work.
 *
 * The paragraph above used to end "the name is kept for now" — and then
 * somebody reviewing the overdue notice read the identifier, believed it, and
 * proposed replacing "the hand-surveyed fund yields" with a published range.
 * A careful fix for a problem this file does not have: no fund here carries a
 * yield, and that refusal is deliberate and documented at the Ziidi entry.
 *
 * A comment reading "the name is wrong, here is what it really means" asks
 * every future reader to find the comment before trusting the identifier.
 * Most will not, because a name that looks unambiguous is not a name anyone
 * thinks to check. It now says what it governs: the survey of minimums, terms,
 * and which providers are listed. */
/**
 * PROVIDER SURVEY - 31 July 2026. Nine of fourteen funds checked; five wrong.
 *
 * No page here was READ: every provider site returns 403 to this environment.
 * What worked was a search restricted to each provider's OWN domain, which
 * surfaces their indexed pages rather than a third party quoting them. Better
 * evidence than a blog, worse than the document - so the rule was corroborate,
 * never author. Agreement kept the figure; disagreement REMOVED it rather than
 * replacing it, because writing an unread number under a survey date is the
 * defect this file exists to prevent.
 *
 *   KEPT (corroborated against the provider's own domain)
 *     Ziidi 100 - Britam 1,000 - Old Mutual 1,000
 *     NCBA 1,000 - Cytonn 1,000 - Lofty-Corban 1,000
 *
 *   CORRECTED (the provider's own pages disagreed; the RIGHT figure now shows)
 *     CIC            1,000 -> 5,000 initial (1,000 was the TOP-UP)
 *     KCB            1,000 -> 5,000
 *     Etica          1,000 -> 100
 *     Zimele           500 -> 100, and no longer a money market fund
 *     Sanlam       (none) -> 2,500
 *
 *   These five sat blank for part of 31 July. Deleting a wrong figure was the
 *   right FIRST move — it stopped the harm at once, and correcting it needed a
 *   second pass against each provider's own domain, which is slower than
 *   deleting. Each is now confirmed at source, and the right number beats none:
 *   "min entry Ksh 5,000" tells a reader holding Ksh 2,000 not to bother, and a
 *   blank row tells them nothing at all.
 *
 *   STILL BLANK (could not be corroborated)
 *     Dry Associates - publishes NO minimum on its own site. The 1,000,000
 *       figure came from elsewhere, so the row stays empty even though it is
 *       probably right. Probably-right is the standard this column already
 *       failed once, and this is the entry it failed worst on.
 *     ICEA Lion, Nabo - no KES minimum published on their own sites.
 *
 * WHY THE UNVERIFIED ONES WENT TOO
 *
 * Five of the nine figures that could be checked were wrong. At that base rate
 * an unchecked figure in this column is closer to a coin flip than to
 * information, and the card renders it as "min entry" - a flat assertion with
 * no room to hedge. Showing a number we would not bet on, under a label that
 * admits no doubt, is worse than showing none. The render is guarded on
 * `minKes !== undefined`, so the row simply disappears.
 *
 * THE ERRORS DID NOT ALL RUN ONE WAY, AND THE WORST ONE IS THE POINT
 *
 * An earlier note here predicted a third disagreement would confirm a pattern
 * of understatement. Three more turned up and one broke it: Etica's real
 * minimum is LOWER than ours. So the story is not "minimums have risen" - it is
 * that this column was never sourced. Dry Associates is the case that matters:
 * listed at 1,000 against a real minimum of 1,000,000, a thousandfold error
 * pointing a retail saver at an institutional fund. It survived unexamined
 * precisely because 1,000 looks ordinary.
 *
 * THE DATE IS STILL NOT BUMPED
 *
 * Minimums are only part of what PRODUCT_SURVEY_AS_OF governs - it also covers
 * product terms and which funds are listed, and Zimele shows why that matters:
 * it may no longer be a money market fund at all. Liquidity strings, taglines
 * and the fund list itself remain unchecked, so the staleness notice stays up.
 *
 * THE NAMES WERE WRONG TOO, AND FOR A REGULATORY REASON
 *
 * NCBA and Zimele no longer run money market funds. CMA's October 2020 CIS
 * guidelines created a "fixed income fund" class — 60%+ of assets in fixed
 * income — and reserved "money market fund" for the shorter, near-cash
 * mandate. NCBA's minutes record the rename being approved by its trustee and
 * the Authority; Zimele documents the same transition for its Savings Plan.
 *
 * That is not a label change. A money market fund is defined to avoid duration;
 * a fixed income fund holds it, and therefore carries price risk. A directory
 * whose purpose is saying what a thing actually is cannot file the second under
 * the first. Both entries are renamed.
 *
 * IT ALSO MEANS THE REMAINING TWELVE ARE UNVERIFIED
 *
 * The rule is market-wide, so any fund here still labelled "money market" may
 * have reclassified without us noticing — the same way these two did. Two found
 * out of two looked at. `type: "mmf"` is left alone deliberately: it drives
 * native-plan.ts and the journey mapping, and re-typing funds on the strength
 * of a search index would push an unverified claim into the planning engine.
 * The names are corrected because a name is a statement; the type is left
 * because it is a behaviour.
 *
 * LIQUIDITY STRINGS — SETTLED 31 July 2026, AND "T+1" WAS WRONG BOTH WAYS
 *
 * Seven funds asserted "T+1 to M-Pesa". Nobody had sourced it, and checking
 * against the providers' own domains contradicted it in BOTH directions:
 *
 *   Britam      brochure: funds available within 48 HOURS — slower than T+1
 *   Old Mutual  self-service withdrawals to mobile money paid SAME DAY —
 *               faster than T+1
 *   KCB         "short notice (within 2 working days)" — slower
 *   CIC         "at short notice with no penalty" — no day count at all
 *   ICEA, Sanlam, Nabo    no Kenyan redemption timeline published
 *
 * Exactly the shape the minimums had: an unsourced column errs in both
 * directions, so a wrong figure there is not conservative, it is arbitrary.
 * And this column is worse than the minimums. A wrong minimum turns somebody
 * away at the door, where they find out immediately; a wrong settlement time
 * is discovered in the week they actually need the money.
 *
 * All seven now carry the honest hedge the other funds already used. The
 * provider figures above are deliberately NOT written in as new values — they
 * come from search summaries of provider pages, not from pages this
 * environment could read, and the rule that survived the minimums survey was
 * corroborate, never author.
 *
 * Ziidi keeps "Withdraw to M-PESA, no fee": corroborated against Safaricom's
 * own pages, which describe the fund as zero-rated both ways.
 *
 * CLASSIFICATION — SETTLED 31 July 2026, AND NOTHING MORE HAD MOVED
 *
 * All twelve funds still labelled "Money Market Fund" were checked against
 * their manager's own domain. Every one is still a money market fund, and two
 * settle it structurally: Nabo and ICEA each run a money market fund AND a
 * separate fixed income fund as distinct products, so the line the CMA drew in
 * 2020 is one their own product lines already make. CIC (13-month weighted
 * average tenure) and Dry Associates (maturities under 18 months) publish
 * mandates that are money-market by construction.
 *
 * NCBA and Zimele remain the only two that moved. That is a finding, not an
 * open question — worth stating plainly, because "checked, found nothing" is a
 * different and more useful answer than silence.
 *
 * STILL OPEN
 *   - Whether ODPC registration is required. It turns on Danico Ventures'
 *     turnover and headcount (see privacy-facts.ts) and is not answerable from
 *     any public source.
 */
/**
 * BUMPED to 31 July 2026 — and product-directory.test.ts warns, correctly, that
 * this is one keystroke and can turn the suite green with no provider looked
 * at. So here is the audit trail for the bump, to be read sceptically.
 *
 * WALKED on 31 July 2026, each against the provider's own domain:
 *   Minimums    all 14. Eleven now corroborated (five of them CORRECTED after
 *               being found wrong); three left blank — Dry Associates, ICEA
 *               and Nabo publish none.
 *   Liquidity   all 14. Seven "T+1 to M-Pesa" claims were unsourced and
 *               contradicted in both directions; all seven replaced with the
 *               hedge. Guarded by liquidity-corroborated.test.ts.
 *   Names       the 12 still labelled "money market fund", re-checked against
 *               the CMA's 2020 class split. All 12 confirmed; NCBA and Zimele
 *               had already been renamed.
 *   Taglines    all. Five made claims this file cannot support, one of them
 *               flatly false ("Sanlam-backed" — Nabo is Centum/Rock). Guarded
 *               by tagline-claims.test.ts.
 *
 * WHAT THE DATE NO LONGER CLAIMS, which is why it can move at all.
 *
 * The staleness notice used to vouch for "which funds are listed at all". It
 * never could. Kenya had 285 funds across 62 approved schemes by March 2026;
 * this list is FOURTEEN, and was always a selection of widely-available retail
 * funds rather than the register. A date cannot certify the completeness of a
 * list that was never trying to be complete, and implying otherwise told the
 * reader that a fund's absence here meant something. The notice now covers
 * minimums and terms — what was actually surveyed.
 *
 * So: not a keystroke. If you are bumping this again, the list above is the
 * work the date stands for.
 */
export const PRODUCT_SURVEY_AS_OF = "2026-07-31";

/**
 * SACCO dividends are dated separately, because they move on a different
 * clock: declared once a year at an AGM, not repriced monthly like a fund.
 *
 * Sector context from SASRA's supervisory data to Q4 2025 — interest on member
 * deposits commonly 8-12%, dividends on share capital commonly 10-15% among
 * the stronger societies. The figures below sit inside that range.
 */
export const SACCO_RATES_AS_OF = "2025-12-31";
export const SACCO_RATES_SOURCE =
  "SASRA Supervision Annual Report and Quarterly Statistical & Soundness Reports to Q4 2025";
/** The sector range SASRA reports for dividends on share capital. */
export const SACCO_DIVIDEND_RANGE_PCT = { low: 8, high: 15 } as const;

/**
 * The Deposit Guarantee Fund provided for under the Sacco Societies Act — up
 * to Ksh 100,000 per member on deposits, not on shares — is NOT yet
 * operational. The Sacco Societies (Amendment) Bill 2025 seeks to activate it,
 * possibly within the KDIC structure. Until then a SACCO deposit carries no
 * live statutory guarantee, which is a fact a reader comparing it against a
 * Treasury bill needs and cannot get from a yield.
 */
export const SACCO_DEPOSIT_GUARANTEE_OPERATIONAL = false;
export const PRODUCT_SURVEY_MAX_AGE_DAYS = 120;

export function productSurveyIsStale(now = new Date()): boolean {
  const asOf = new Date(PRODUCT_SURVEY_AS_OF);
  return (now.getTime() - asOf.getTime()) / 86_400_000 > PRODUCT_SURVEY_MAX_AGE_DAYS;
}

export interface ProductLink {
  slug: string;
  name: string;
  shortName: string;
  type: ProductType;
  /**
   * Provider page. OPTIONAL, because a guessed URL is worse than no URL.
   *
   * The top-yielding funds were added from a market survey that carried rates
   * and minimums but no links, and this environment cannot reach provider sites
   * to check one. A plausible-looking address on a financial product is not a
   * small mistake: it sends somebody looking to move money to a page nobody has
   * opened. Cards without a URL render as facts rather than as a button.
   */
  url?: string;
  isAffiliate: boolean;
  /** Approximate annualised yield or dividend rate — verify live before committing. */
  yieldPct?: number;
  /** Whether yieldPct is before or after withholding tax. Defaults to gross. */
  yieldBasis?: YieldBasis;
  /** Minimum entry in KES. */
  minKes?: number;
  /**
   * Reachable from the M-PESA menu itself, with no separate account opening.
   *
   * An explicit fact, because the code that needed it was inferring it from
   * `/M-PESA/i.test(liquidity) && yieldPct === undefined` — which worked only
   * while exactly one fund happened to lack a yield. Every other fund's
   * liquidity string then read "T+1 to M-Pesa" (those are since gone, as
   * unsourced), so it matched the regex too, and the real discriminator was
   * the missing figure. The moment four more funds
   * lost their yields, the wallet-native set silently grew from one to five and
   * the advice would have described ordinary funds as reachable from the M-PESA
   * app. A product fact inferred from an unrelated gap is a coincidence waiting
   * to be corrected.
   */
  walletNative?: boolean;
  /**
   * What the quoted rate is actually paid ON.
   *
   * A SACCO card showed "13% dividends p.a." beside "min entry Ksh 1,000",
   * which reads as 13% on everything you put in. It is not: the dividend is
   * declared on SHARE CAPITAL, while member deposits earn a separate and
   * lower interest rate — around 8-12% against 10-15% on shares, per SASRA's
   * sector data. A member's actual return depends on how their money splits
   * between the two, and quoting only the higher number is the same class of
   * error as quoting a gross yield beside a net one.
   */
  yieldApplies?: string;
  /**
   * What happens to the money if the institution fails.
   *
   * Left unsaid, every card implied the same answer. They do not have the same
   * answer: a Treasury bill is a sovereign obligation, an MMF is a
   * CMA-regulated fund whose value can fall, and a SACCO deposit is covered by
   * a Deposit Guarantee Fund that the Act provides for but which is NOT yet
   * operational. That last one is a live gap, not a technicality, and a reader
   * comparing a 13% SACCO against a 9% bill is owed it.
   */
  protection?: string;
  regulator: Regulator;
  /** Short liquidity description shown on product cards. */
  liquidity: string;
  /** One-liner on what makes this product distinctive. */
  tagline: string;
}

export const PRODUCT_LINKS: ProductLink[] = [
  // ── Money Market Funds (CMA-regulated) ─────────────────────────────────
  {
    // Listed first because reach, not yield, is what decides whether somebody
    // actually starts. A fund reachable from the M-PESA menu removes the
    // onboarding step that ends most saving plans before they begin.
    //
    // minKes is confirmed at 100 — the lowest entry of any fund listed here,
    // and the whole point of the product.
    //
    // yieldPct stays ABSENT, and that is now a considered refusal rather than
    // a gap. Two candidate figures exist and neither can be used:
    //
    //   9.50%  — Ziidi's own quoted rate, but from February 2025. Older than
    //            this file's staleness window by more than a year.
    //   18.20% — from a current survey, but it belongs to ETICA CAPITAL's MMF,
    //            listed there as "Zidi". One 'i' apart from this fund and a
    //            different manager entirely. Attributing it to Safaricom's
    //            Ziidi would overstate the largest fund in the market by nearly
    //            nine points, on the strength of a spelling.
    //
    // Ziidi is also known to trail the market on yield while leading it on
    // reach, so borrowing a top-quartile number would be wrong in the exact
    // direction a reader would be harmed by.
    slug: "ziidi-mmf",
    name: "Ziidi Money Market Fund",
    shortName: "Ziidi MMF",
    type: "mmf",
    // Deliberately the root, not a deep link I have not opened. You do not
    // sign up for this fund on the web at all — you reach it from the M-PESA
    // menu or *334# — so a plausible-looking product URL would be a guess
    // pointing at a page that may not exist. The tagline carries the real
    // route in.
    url: "https://www.safaricom.co.ke/",
    isAffiliate: false,
    minKes: 100,
    walletNative: true,
    regulator: "CMA",
    liquidity: "Withdraw to M-PESA, no fee",
    tagline: "M-PESA app or *334# — from Ksh 100, no separate onboarding",
  },
  {
    slug: "britam-mmf",
    name: "Britam Money Market Fund",
    shortName: "Britam MMF",
    type: "mmf",
    url: "https://ke.britam.com/save-and-invest/personal/invest/unit-trust-funds/money-market-fund",
    isAffiliate: false,
    // No verified current figure. The survey number for this fund was from a
    // higher rate environment and could not be reconciled with the live
    // 91-day bill — see the coherence guard in the directory tests.
    minKes: 1000,
    regulator: "CMA",
    liquidity: "Confirm withdrawal terms with the manager",
    tagline: "Long-established fund; contribute via Paybill 500005",
  },
  {
    slug: "cic-mmf",
    name: "CIC Money Market Fund",
    shortName: "CIC MMF",
    type: "mmf",
    /* Corroborated on the provider's own domain, 31 July 2026. CIC's own fact sheet and unit-trust pages: Ksh 5,000 initial, Ksh 1,000 top-up. The 1,000 this file used to show was the TOP-UP, which is why it looked plausible. */
    minKes: 5000,
    url: "https://ke.cicinsurancegroup.com/mmf/",
    isAffiliate: false,
    // No figure in the April 2026 survey. The inherited ~11% is dropped
    // rather than carried: leaving it in place would silently stamp it
    // with a survey date it was never part of, which is the same defect
    // as the undated yields this file was built to fix.
    //
    // minKes REMOVED, July 2026. This read 1000 and the card renders it as
    // "min entry". CIC's own pages describe a minimum INITIAL investment of
    // Ksh 5,000 with Ksh 1,000 as the top-up minimum — so 1,000 was the wrong
    // one of the two numbers, and the error points the dangerous way: a reader
    // with Ksh 1,000 is told they can open this fund, and cannot.
    //
    // Not corrected to 5,000, because I could not read CIC's page myself —
    // every provider site returns 403 to this environment, and the figure
    // above comes from a search index rather than the document. Writing an
    // unread number under a survey date is the exact defect the comment above
    // describes. Dropped rather than carried, as with the yield; the card
    // simply shows no minimum until somebody opens the page and confirms it.
    regulator: "CMA",
    liquidity: "Confirm withdrawal terms with the manager",
    tagline: "Large, established co-operative-linked fund",
  },
  {
    slug: "nabo-mmf",
    name: "Nabo Capital Money Market Fund",
    shortName: "Nabo MMF",
    type: "mmf",
    url: "https://www.nabocapital.com/products/nabo-money-market-fund",
    isAffiliate: false,
    // No figure in the April 2026 survey. The inherited ~11% is dropped
    // rather than carried: leaving it in place would silently stamp it
    // with a survey date it was never part of, which is the same defect
    // as the undated yields this file was built to fix.
    // minKes removed - 31 Jul 2026 survey.
    // nabocapital.com publishes a USD minimum only; the KES figure is not
    // stated. Unverifiable, same reasoning.
    regulator: "CMA",
    liquidity: "Confirm withdrawal terms with the manager",
    /* Was "Sanlam-backed manager; higher entry minimum". Both halves wrong.
      * Nabo has never been Sanlam's — it launched as Centum Asset Managers in
      * 2012, and Centum sold 60% to Rock Investment Bank, leaving Nabo an
      * associate rather than a subsidiary. And "higher entry minimum" asserted
      * a comparison in the very column this file blanked for Nabo, because the
      * provider publishes no KES minimum at all. */
    tagline: "Formerly Centum Asset Managers; now majority-owned by Rock Investment Bank",
  },
  {
    slug: "icea-mmf",
    name: "ICEA Lion Money Market Fund",
    shortName: "ICEA Lion MMF",
    type: "mmf",
    url: "https://www.icealion.com/products/money-market-fund",
    isAffiliate: false,
    // No verified current figure. The survey number for this fund was from a
    // higher rate environment and could not be reconciled with the live
    // 91-day bill — see the coherence guard in the directory tests.
    // minKes removed - 31 Jul 2026 survey.
    // No minimum published anywhere on icealion.com. Unverifiable, and the
    // column it sits in was wrong 5 times in 9.
    regulator: "CMA",
    liquidity: "Confirm withdrawal terms with the manager",
    tagline: "Pan-Africa insurer; strong institutional credentials",
  },
  {
    slug: "sanlam-mmf",
    name: "Sanlam Money Market Fund",
    shortName: "Sanlam MMF",
    type: "mmf",
    /* Corroborated on the provider's own domain, 31 July 2026. invest.sanlameastafrica.com states investing can start at Ksh 2,500. */
    minKes: 2500,
    url: "https://www.sanlam.co.ke/personal/investments/money-market",
    isAffiliate: false,
    // No verified current figure. The survey number for this fund was from a
    // higher rate environment and could not be reconciled with the live
    // 91-day bill — see the coherence guard in the directory tests.
    // minKes removed - 31 Jul 2026 survey.
    // Not found on sanlam.com. Unverifiable, same reasoning.
    regulator: "CMA",
    liquidity: "Confirm withdrawal terms with the manager",
    tagline: "USSD access makes it easy from any phone",
  },
  {
    slug: "old-mutual-mmf",
    name: "Old Mutual Money Market Fund",
    shortName: "Old Mutual MMF",
    type: "mmf",
    url: "https://www.oldmutual.co.ke/personal/investments/money-market-fund",
    isAffiliate: false,
    // No figure in the April 2026 survey. The inherited ~11% is dropped
    // rather than carried: leaving it in place would silently stamp it
    // with a survey date it was never part of, which is the same defect
    // as the undated yields this file was built to fix.
    minKes: 1000,
    regulator: "CMA",
    liquidity: "Confirm withdrawal terms with the manager",
    tagline: "Backed by one of Africa's largest insurers",
  },
  {
    slug: "zimele-mmf",
    // RENAMED for the same reason as NCBA — see that entry. Zimele's own site
    // documents the transition of its Savings Plan from money market to fixed
    // income.
    name: "Zimele Fixed Income Fund (Savings Plan)",
    shortName: "Zimele FIF",
    type: "mmf",
    /* Corroborated on the provider's own domain, 31 July 2026. zimele.co.ke states Ksh 100 initial and Ksh 100 top-up. */
    minKes: 100,
    url: "https://www.zimele.co.ke/savings-plan/",
    isAffiliate: false,
    // No figure in the April 2026 survey. The inherited ~11% is dropped
    // rather than carried: leaving it in place would silently stamp it
    // with a survey date it was never part of, which is the same defect
    // as the undated yields this file was built to fix.
    // minKes removed - 31 Jul 2026 survey.
    // zimele.co.ke gives KES 100, not 500 - and the fund has TRANSITIONED from
    // money market to fixed income, so the name above may no longer describe
    // it. Two unverified claims, not one.
    regulator: "CMA",
    liquidity: "Confirm withdrawal terms with the manager",
    tagline: "Low minimum entry; long-standing retail fund",
  },
  // ── Funds added from the April 2026 yield survey ────────────────────────
  //
  // These lead the market on rate, and their absence quietly biased every
  // recommendation toward the mid-tier funds that happened to be listed first
  // — the same defect as Ziidi's absence, one rung up: the directory decides
  // what the advice can say, so a gap in it is a gap in the advice.
  //
  // No `url` on any of them. The survey carried rates and minimums, not links,
  // and a guessed provider address is the one kind of wrong that sends a reader
  // somewhere to move money. Liquidity is stated as unconfirmed for the same
  // reason: T+1 is the sector norm, but a norm is not this fund's terms.
  {
    slug: "etica-mmf",
    name: "Etica Capital Money Market Fund",
    shortName: "Etica MMF",
    type: "mmf",
    /* Corroborated on the provider's own domain, 31 July 2026. Etica's own Key Investor Information Document for the KES fund states Ksh 100. */
    minKes: 100,
    isAffiliate: false,
    // No verified current figure. The survey number for this fund was from a
    // higher rate environment and could not be reconciled with the live
    // 91-day bill — see the coherence guard in the directory tests.
    // minKes removed - 31 Jul 2026 survey.
    // eticacap.com offers entry from KES 100; this read 1,000. Overstated
    // rather than under, but wrong either way, and unread.
    regulator: "CMA",
    liquidity: "Confirm withdrawal terms with the manager",
    /* Was "Highest quoted rate in the April 2026 survey" — a ranking derived
      * from the yields this file DELETED as untrustworthy. Deleting the data
      * and keeping the conclusion drawn from it is the worst of both. Replaced
      * with terms from Etica's own KIID, which do not move monthly. */
    tagline: "No lock-in period; interest compounds daily",
  },
  {
    slug: "lofty-corban-mmf",
    name: "Lofty-Corban Money Market Fund",
    shortName: "Lofty-Corban MMF",
    type: "mmf",
    isAffiliate: false,
    // No verified current figure. The survey number for this fund was from a
    // higher rate environment and could not be reconciled with the live
    // 91-day bill — see the coherence guard in the directory tests.
    minKes: 1000,
    regulator: "CMA",
    liquidity: "Confirm withdrawal terms with the manager",
    /* Was "Consistently near the top of the yield tables" — an unsourced
      * performance claim, and a comparative one, about tables this file does
      * not publish and cannot vouch for. */
    tagline: "Independent manager; CMA-licensed",
  },
  {
    slug: "cytonn-mmf",
    name: "Cytonn Money Market Fund",
    shortName: "Cytonn MMF",
    type: "mmf",
    isAffiliate: false,
    // No verified current figure. The survey number for this fund was from a
    // higher rate environment and could not be reconciled with the live
    // 91-day bill — see the coherence guard in the directory tests.
    minKes: 1000,
    regulator: "CMA",
    liquidity: "Confirm withdrawal terms with the manager",
    /* Was "Long-running high-yield fund". "High-yield" is a performance claim
      * this file quotes no figure to support, and it is a particularly loaded
      * one for this manager given its history with separately-branded
      * high-yield products. How long it has run is checkable; how well it pays
      * is not, from here. */
    tagline: "Long-running fund from an independent manager",
  },
  {
    slug: "ncba-mmf",
    // RENAMED by the manager under CMA's October 2020 CIS guidelines, which
    // created a "fixed income fund" class (60%+ of AUM in fixed income) and
    // reserved "money market fund" for the shorter, near-cash mandate. NCBA's
    // trustee and the Authority approved the change. Not cosmetic: a fixed
    // income fund carries duration and therefore price risk that a money market
    // fund is defined to avoid, and this directory exists to say what a thing
    // actually is.
    name: "NCBA Fixed Income Fund (Shilling)",
    shortName: "NCBA FIF",
    type: "mmf",
    isAffiliate: false,
    // No verified current figure. The survey number for this fund was from a
    // higher rate environment and could not be reconciled with the live
    // 91-day bill — see the coherence guard in the directory tests.
    minKes: 1000,
    regulator: "CMA",
    liquidity: "Confirm withdrawal terms with the manager",
    /* Was "Bank-backed; third largest unit trust by assets" — an unsourced
      * league-table position that ages every quarter, on a fund that has since
      * been reclassified out of the money market category entirely. */
    tagline: "Bank-backed; reclassified as a fixed income fund",
  },
  {
    slug: "kcb-mmf",
    name: "KCB Money Market Fund",
    shortName: "KCB MMF",
    type: "mmf",
    /* Corroborated on the provider's own domain, 31 July 2026. ke.kcbgroup.com states a Ksh 5,000 minimum. */
    minKes: 5000,
    isAffiliate: false,
    // No verified current figure. The survey number for this fund was from a
    // higher rate environment and could not be reconciled with the live
    // 91-day bill — see the coherence guard in the directory tests.
    //
    // minKes REMOVED, July 2026, for the same reason as CIC. This read 1,000
    // and the card renders it as "min entry"; KCB's own pages give KES 5,000
    // for the shilling fund. Understating a minimum is the harmful direction —
    // a reader arrives with 1,000 and is refused, having already chosen.
    //
    // Not corrected to 5,000: KCB's site returns 403 to this environment, so
    // the figure is from a search index rather than the page. Dropped rather
    // than carried, and the card shows no minimum until somebody reads it.
    regulator: "CMA",
    liquidity: "Confirm withdrawal terms with the manager",
    tagline: "Bank-backed, with branch support countrywide",
  },
  {
    slug: "dry-associates-mmf",
    name: "Dry Associates Money Market Fund",
    shortName: "Dry Associates MMF",
    type: "mmf",
    isAffiliate: false,
    // No verified current figure. The survey number for this fund was from a
    // higher rate environment and could not be reconciled with the live
    // 91-day bill — see the coherence guard in the directory tests.
    // minKes removed - 31 Jul 2026 survey.
    // dryassociates.com gives a minimum of KES 1,000,000. This read 1,000 - a
    // thousandfold understatement pointing a retail reader at an institutional
    // fund.
    regulator: "CMA",
    liquidity: "Confirm withdrawal terms with the manager",
    tagline: "Independent manager with a long fixed-income record",
  },
  // ── Treasury Bills & Bonds (CBK) ────────────────────────────────────────
  {
    slug: "dhowcsd",
    name: "CBK DhowCSD T-Bills",
    shortName: "DhowCSD T-Bills",
    type: "tbill",
    url: "https://dhowcsd.centralbank.go.ke",
    isAffiliate: false,
    // Live, and NET of the 15% withholding tax — the 364-day bill from the
    // published feed. It was hardcoded at 10.8%, which was neither current nor
    // net, and sat directly beneath a ladder card quoting the correct 8.4%.
    yieldPct: tbillRate(364)?.netEAY ?? undefined,
    yieldBasis: "net",
    minKes: 50000,
    regulator: "CBK",
    liquidity: "91 / 182 / 364-day terms",
    tagline: "Government-backed; competitive sovereign yield",
  },
  {
    slug: "dhowcsd-ifb",
    name: "CBK Infrastructure Bond (IFB)",
    shortName: "DhowCSD IFB",
    type: "tbill",
    url: "https://dhowcsd.centralbank.go.ke",
    isAffiliate: false,
    // Infrastructure bond coupons are withholding-tax exempt, so the tax
    // advantage is structural and worth stating. The NUMBER is not: this read
    // 14.0% "as an approximate benchmark" while the 364-day bill pays 9.94%
    // gross and 8.45% net. A tax-free 14% against that is not a benchmark, it
    // is the best trade in the market — and it was a figure from the 2024-25
    // rate environment, exactly like the MMF yields removed alongside it.
    //
    // Old IFBs really do carry coupons that high, but a reader meeting "~14%"
    // on a card headed "highest net yield" reads it as what they can buy today.
    // The advantage stays described; the number waits for a real issue.
    yieldBasis: "net",
    minKes: 50000,
    regulator: "CBK",
    liquidity: "Locked to term; secondary market available",
    /* Was "Tax-free coupons — highest net yield for high earners". The first
      * half is a fact of tax law; the second is arithmetic that depends on
      * rates and is stated as if it were not. An IFB paying 10% tax-free nets
      * 10%; a taxed bond paying 12% gross nets 10.2% and beats it. Whether the
      * IFB wins depends on the spread on the day, so the card states the
      * exemption and lets the calculators do the comparison — which is what
      * they are for. */
    tagline: "Coupons are free of withholding tax",
  },
  // ── SACCOs (SASRA-regulated) ─────────────────────────────────────────────
  //
  // The T-bill ceiling that governs the MMF figures above does NOT apply here,
  // and the difference is worth stating so nobody "corrects" these downward.
  // A SACCO dividend is a share of the society's annual surplus — lending
  // income, not money-market income — declared once a year at an AGM. It is
  // not the short bill plus a spread, so double-digit dividends can coexist
  // with single-digit bills.
  //
  // These now carry their date and their source. They sit inside the range
  // SASRA reports for the sector, and they are indicative of recent
  // declarations rather than a promise: a dividend is voted at an AGM out of
  // a surplus that has not been earned yet.
  {
    slug: "stima-sacco",
    name: "Stima Sacco",
    shortName: "Stima Sacco",
    type: "sacco",
    url: "https://www.stimasacco.com",
    isAffiliate: false,
    yieldPct: 13,
    minKes: 1000,
    yieldApplies: "share capital — member deposits earn a separate, lower rate",
    protection: "No operational deposit guarantee — see the directory notes",
    regulator: "SASRA",
    liquidity: "30–60 day notice on withdrawals",
    tagline: "3× deposit multiplier; strong dividend history",
  },
  {
    slug: "safaricom-sacco",
    name: "Safaricom Sacco",
    shortName: "Safaricom Sacco",
    type: "sacco",
    url: "https://www.safaricomsacco.com",
    isAffiliate: false,
    yieldPct: 11,
    minKes: 500,
    yieldApplies: "share capital — member deposits earn a separate, lower rate",
    protection: "No operational deposit guarantee — see the directory notes",
    regulator: "SASRA",
    liquidity: "30-day notice on withdrawals",
    tagline: "Low entry; telco-sector membership open to many",
  },
  {
    slug: "mwalimu-sacco",
    name: "Mwalimu National Sacco",
    shortName: "Mwalimu Sacco",
    type: "sacco",
    url: "https://www.mwalimunationale.co.ke",
    isAffiliate: false,
    yieldPct: 10,
    minKes: 1000,
    yieldApplies: "share capital — member deposits earn a separate, lower rate",
    protection: "No operational deposit guarantee — see the directory notes",
    regulator: "SASRA",
    liquidity: "30–60 day notice on withdrawals",
    tagline: "Kenya's largest Sacco by deposits; educators and beyond",
  },
  // ── Pension / Retirement (RBA-regulated) ────────────────────────────────
  {
    slug: "enwealth",
    name: "Enwealth Financial Services",
    shortName: "Enwealth",
    type: "pension",
    url: "https://www.enwealth.co.ke",
    isAffiliate: false,
    regulator: "RBA",
    liquidity: "Preserved until retirement (tax advantages)",
    tagline: "Individual pension plan with flexible contributions",
  },
  {
    slug: "cpf",
    name: "CPF Financial Services",
    shortName: "CPF",
    type: "pension",
    url: "https://www.cpfafrica.com",
    isAffiliate: false,
    regulator: "RBA",
    liquidity: "Preserved until retirement (tax advantages)",
    tagline: "One of Kenya's oldest independent pension administrators",
  },

  /* POST-RETIREMENT MEDICAL FUNDS — added 31 July 2026.
   *
   * A PRMF pre-funds retiree healthcare inside the retirement-benefits system
   * rather than paying for it out of a taxed drawdown. Contributions are
   * tax-deductible up to Ksh 15,000 a month and withdrawals for treatment are
   * tax-exempt, under the Tax Laws (Amendment) Act 2024 in force since
   * 27 December 2024. That relief is the whole point: it is the one retirement
   * product where the tax treatment does real work.
   *
   * ELIGIBILITY, WHICH IS NOT OBVIOUS. A PRMF is normally a sub-fund of an
   * RBA-registered scheme, so it usually rides on a pension a member already
   * has. CPF's is the exception worth naming for this audience: it admits the
   * self-employed directly, which matters in a market where most people are.
   *
   * ONLY TWO ARE LISTED, and that is deliberate. KPPF, MURBS, KPA and the TSC
   * scheme all run PRMFs, but they are closed to their own sectors — Kenya
   * Power, Maseno, the ports, teachers. Listing a fund a reader cannot join is
   * worse than listing nothing, so they are named here in the comment and not
   * on a card.
   *
   * NO AFFILIATE ARRANGEMENT EXISTS, here or anywhere in this file, and
   * isAffiliate stays false. These are providers whose own domains describe
   * these products, not partners. */
  {
    slug: "britam-afya-pension",
    name: "Britam Afya Pension",
    shortName: "Britam Afya",
    type: "prmf",
    url: "https://ke.britam.com/pension/business/retirement-benefits-plans/afya-pension",
    isAffiliate: false,
    regulator: "RBA",
    liquidity: "Preserved for medical costs in retirement; withdrawals for treatment are tax-exempt",
    tagline: "Post-retirement medical savings from an established insurer",
  },
  {
    slug: "cpf-prmf",
    name: "CPF Post-Retirement Medical Scheme",
    shortName: "CPF Medical",
    type: "prmf",
    url: "https://cpf.or.ke/post-retirement-medical-scheme/",
    isAffiliate: false,
    regulator: "RBA",
    liquidity: "Preserved for medical costs in retirement; withdrawals for treatment are tax-exempt",
    tagline: "Open to the self-employed, not only to employees",
  },
];

export const MMF_LINKS = PRODUCT_LINKS.filter((p) => p.type === "mmf");
export const TBILL_LINKS = PRODUCT_LINKS.filter((p) => p.type === "tbill");
export const SACCO_LINKS = PRODUCT_LINKS.filter((p) => p.type === "sacco");
export const PRMF_LINKS = PRODUCT_LINKS.filter((p) => p.type === "prmf");
export const PENSION_LINKS = PRODUCT_LINKS.filter((p) => p.type === "pension");
export const MMF_AND_TBILL_LINKS = PRODUCT_LINKS.filter(
  (p) => p.type === "mmf" || p.type === "tbill"
);

export function getProductLink(slug: string): ProductLink | undefined {
  return PRODUCT_LINKS.find((p) => p.slug === slug);
}

export const HAS_AFFILIATE_LINKS = PRODUCT_LINKS.some((p) => p.isAffiliate);
