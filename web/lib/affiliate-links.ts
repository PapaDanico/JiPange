import { tbillRate } from "./rates-feed";

export type ProductType = "mmf" | "tbill" | "sacco" | "pension";

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
 * PROVIDER SURVEY — 31 July 2026, and what it could and could not establish.
 *
 * Every provider site returns 403 to the build environment, through the
 * sandbox proxy and through direct fetch alike, so no page here was READ. What
 * was possible was a search restricted to each provider's own domain, which
 * surfaces the provider's own indexed pages rather than a third party quoting
 * them. That is better evidence than a blog and worse than the document.
 *
 * So the rule applied was: corroborate, never author. Where the search agreed
 * with the stored figure, the figure stayed and is now dated. Where it
 * disagreed, the figure was REMOVED rather than replaced — writing an unread
 * number under a survey date is the defect this file was built to stop.
 *
 *   Ziidi           100    agreed (Safaricom: "from as low as KSH 100")
 *   Britam        1,000    agreed (initial 1,000, top-up 1,000)
 *   Old Mutual    1,000    agreed
 *   NCBA          1,000    agreed — but see the naming note below
 *   Cytonn        1,000    agreed
 *   CIC           1,000    DISAGREED: 5,000 initial, 1,000 top-up. Removed.
 *   KCB           1,000    DISAGREED: 5,000 for the shilling fund. Removed.
 *   ICEA Lion     1,000    not published anywhere on icealion.com. Unverified.
 *   Sanlam          500    not found on sanlam.com. Unverified.
 *   Nabo, Zimele, Etica, Lofty-Corban, Dry Associates — not searched.
 *
 * Both disagreements ran the same way: our figure was LOWER than the
 * provider's. That is the direction that costs a reader something. An
 * overstated minimum loses a customer we never had; an understated one sends
 * somebody to a provider that turns them away after they have compared funds
 * and chosen. If a third case turns up, assume the pattern rather than the
 * coincidence — these numbers were gathered when minimums across the market
 * were lower.
 *
 * NAMING: search suggests the NCBA Money Market Fund now trades as the NCBA
 * Fixed Income Fund. Not changed here, because a rename is exactly the kind of
 * claim that needs the page rather than an index.
 *
 * LINK ROT: the Britam and CIC URLs in this file point at www.britam.com and
 * www.cicinsurancegroup.com; search returns ke.britam.com and
 * ke.cicinsurancegroup.com and never returns ours. Not changed, because
 * swapping a link I cannot fetch for another I cannot fetch is a lateral move.
 * Two clicks from anyone with an unrestricted browser would settle it.
 */
export const PRODUCT_SURVEY_AS_OF = "2026-04-01";

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
   * liquidity string reads "T+1 to M-Pesa", so it matched the regex too, and
   * the real discriminator was the missing figure. The moment four more funds
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
    url: "https://www.britam.com/ke/personal/savings-investments/money-market-fund",
    isAffiliate: false,
    // No verified current figure. The survey number for this fund was from a
    // higher rate environment and could not be reconciled with the live
    // 91-day bill — see the coherence guard in the directory tests.
    minKes: 1000,
    regulator: "CMA",
    liquidity: "T+1 to M-Pesa",
    tagline: "Long-established fund; contribute via Paybill 500005",
  },
  {
    slug: "cic-mmf",
    name: "CIC Money Market Fund",
    shortName: "CIC MMF",
    type: "mmf",
    url: "https://www.cicinsurancegroup.com/personal/savings-and-investments/cic-money-market-fund",
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
    liquidity: "T+1 to M-Pesa",
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
    minKes: 5000,
    regulator: "CMA",
    liquidity: "T+1 to M-Pesa",
    tagline: "Sanlam-backed manager; higher entry minimum",
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
    minKes: 1000,
    regulator: "CMA",
    liquidity: "T+1 to M-Pesa",
    tagline: "Pan-Africa insurer; strong institutional credentials",
  },
  {
    slug: "sanlam-mmf",
    name: "Sanlam Money Market Fund",
    shortName: "Sanlam MMF",
    type: "mmf",
    url: "https://www.sanlam.co.ke/personal/investments/money-market",
    isAffiliate: false,
    // No verified current figure. The survey number for this fund was from a
    // higher rate environment and could not be reconciled with the live
    // 91-day bill — see the coherence guard in the directory tests.
    minKes: 500,
    regulator: "CMA",
    liquidity: "T+1 to M-Pesa",
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
    liquidity: "T+1 to M-Pesa",
    tagline: "Backed by one of Africa's largest insurers",
  },
  {
    slug: "zimele-mmf",
    name: "Zimele Money Market Fund",
    shortName: "Zimele MMF",
    type: "mmf",
    url: "https://www.zimele.net",
    isAffiliate: false,
    // No figure in the April 2026 survey. The inherited ~11% is dropped
    // rather than carried: leaving it in place would silently stamp it
    // with a survey date it was never part of, which is the same defect
    // as the undated yields this file was built to fix.
    minKes: 500,
    regulator: "CMA",
    liquidity: "T+1 to M-Pesa",
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
    isAffiliate: false,
    // No verified current figure. The survey number for this fund was from a
    // higher rate environment and could not be reconciled with the live
    // 91-day bill — see the coherence guard in the directory tests.
    minKes: 1000,
    regulator: "CMA",
    liquidity: "Confirm withdrawal terms with the manager",
    tagline: "Highest quoted rate in the April 2026 survey",
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
    tagline: "Consistently near the top of the yield tables",
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
    tagline: "Long-running high-yield fund",
  },
  {
    slug: "ncba-mmf",
    name: "NCBA Money Market Fund",
    shortName: "NCBA MMF",
    type: "mmf",
    isAffiliate: false,
    // No verified current figure. The survey number for this fund was from a
    // higher rate environment and could not be reconciled with the live
    // 91-day bill — see the coherence guard in the directory tests.
    minKes: 1000,
    regulator: "CMA",
    liquidity: "Confirm withdrawal terms with the manager",
    tagline: "Bank-backed; third largest unit trust by assets",
  },
  {
    slug: "kcb-mmf",
    name: "KCB Money Market Fund",
    shortName: "KCB MMF",
    type: "mmf",
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
    minKes: 1000,
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
    tagline: "Tax-free coupons — highest net yield for high earners",
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
];

export const MMF_LINKS = PRODUCT_LINKS.filter((p) => p.type === "mmf");
export const TBILL_LINKS = PRODUCT_LINKS.filter((p) => p.type === "tbill");
export const SACCO_LINKS = PRODUCT_LINKS.filter((p) => p.type === "sacco");
export const PENSION_LINKS = PRODUCT_LINKS.filter((p) => p.type === "pension");
export const MMF_AND_TBILL_LINKS = PRODUCT_LINKS.filter(
  (p) => p.type === "mmf" || p.type === "tbill"
);

export function getProductLink(slug: string): ProductLink | undefined {
  return PRODUCT_LINKS.find((p) => p.slug === slug);
}

export const HAS_AFFILIATE_LINKS = PRODUCT_LINKS.some((p) => p.isAffiliate);
