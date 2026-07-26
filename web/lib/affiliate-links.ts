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

export interface ProductLink {
  slug: string;
  name: string;
  shortName: string;
  type: ProductType;
  url: string;
  isAffiliate: boolean;
  /** Approximate annualised yield or dividend rate — verify live before committing. */
  yieldPct?: number;
  /** Whether yieldPct is before or after withholding tax. Defaults to gross. */
  yieldBasis?: YieldBasis;
  /** Minimum entry in KES. */
  minKes?: number;
  regulator: Regulator;
  /** Short liquidity description shown on product cards. */
  liquidity: string;
  /** One-liner on what makes this product distinctive. */
  tagline: string;
}

export const PRODUCT_LINKS: ProductLink[] = [
  // ── Money Market Funds (CMA-regulated) ─────────────────────────────────
  {
    slug: "britam-mmf",
    name: "Britam Money Market Fund",
    shortName: "Britam MMF",
    type: "mmf",
    url: "https://www.britam.com/ke/personal/savings-investments/money-market-fund",
    isAffiliate: false,
    yieldPct: 11.8,
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
    yieldPct: 11.5,
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
    yieldPct: 11.6,
    minKes: 5000,
    regulator: "CMA",
    liquidity: "T+1 to M-Pesa",
    tagline: "Competitive yield; Sanlam-backed stability",
  },
  {
    slug: "icea-mmf",
    name: "ICEA Lion Money Market Fund",
    shortName: "ICEA Lion MMF",
    type: "mmf",
    url: "https://www.icealion.com/products/money-market-fund",
    isAffiliate: false,
    yieldPct: 11.2,
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
    yieldPct: 11.0,
    minKes: 1000,
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
    yieldPct: 10.9,
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
    yieldPct: 11.0,
    minKes: 500,
    regulator: "CMA",
    liquidity: "T+1 to M-Pesa",
    tagline: "Lowest minimum entry — ideal for beginners",
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
