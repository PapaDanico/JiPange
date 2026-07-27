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
 */
export const YIELDS_AS_OF = "2026-04-01";
export const YIELDS_MAX_AGE_DAYS = 120;

export function yieldsAreStale(now = new Date()): boolean {
  const asOf = new Date(YIELDS_AS_OF);
  return (now.getTime() - asOf.getTime()) / 86_400_000 > YIELDS_MAX_AGE_DAYS;
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
    yieldPct: 15.5,
    minKes: 1000,
    regulator: "CMA",
    liquidity: "T+1 to M-Pesa",
    tagline: "Consistent top-tier yield; Paybill 500005",
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
    minKes: 1000,
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
    yieldPct: 14.8,
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
    yieldPct: 15.5,
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
    yieldPct: 18.2,
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
    yieldPct: 17.5,
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
    yieldPct: 16.9,
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
    yieldPct: 16.2,
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
    yieldPct: 15.8,
    minKes: 1000,
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
    yieldPct: 15.2,
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
    // Infrastructure bond coupons are withholding-tax exempt, so this gross
    // figure IS the net one. Left as an approximate benchmark rather than
    // wired to the feed: the published bond bands blend taxable and tax-free
    // paper, so quoting a band median as "the IFB yield" would be a guess
    // wearing a live number's clothes.
    yieldPct: 14.0,
    yieldBasis: "net",
    minKes: 50000,
    regulator: "CBK",
    liquidity: "Locked to term; secondary market available",
    tagline: "Tax-free coupons — highest net yield for high earners",
  },
  // ── SACCOs (SASRA-regulated) ─────────────────────────────────────────────
  {
    slug: "stima-sacco",
    name: "Stima Sacco",
    shortName: "Stima Sacco",
    type: "sacco",
    url: "https://www.stimasacco.com",
    isAffiliate: false,
    yieldPct: 13,
    minKes: 1000,
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
