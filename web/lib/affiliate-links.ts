export type ProductType = "mmf" | "tbill" | "sacco" | "bank";
export type Regulator = "CMA" | "CBK" | "SASRA" | "CBK+CMA";

export interface ProductLink {
  slug: string;
  name: string;
  shortName: string;
  type: ProductType;
  url: string;
  isAffiliate: boolean;
  yieldPct?: number;    // approximate current annualised yield
  minKes?: number;      // minimum investment in KES
  regulator: Regulator;
}

export const PRODUCT_LINKS: ProductLink[] = [
  // ── Money Market Funds (CMA-regulated) ─────────────────────────────
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
  },
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
  },
  // ── Treasury Bills (CBK) ───────────────────────────────────────────
  {
    slug: "dhowcsd",
    name: "CBK DhowCSD T-Bills",
    shortName: "DhowCSD",
    type: "tbill",
    url: "https://dhowcsd.centralbank.go.ke",
    isAffiliate: false,
    yieldPct: 10.8,
    minKes: 50000,
    regulator: "CBK",
  },
];

export const MMF_LINKS = PRODUCT_LINKS.filter((p) => p.type === "mmf");
export const TBILL_LINKS = PRODUCT_LINKS.filter((p) => p.type === "tbill");
export const MMF_AND_TBILL_LINKS = PRODUCT_LINKS.filter(
  (p) => p.type === "mmf" || p.type === "tbill"
);

export function getProductLink(slug: string): ProductLink | undefined {
  return PRODUCT_LINKS.find((p) => p.slug === slug);
}

export const HAS_AFFILIATE_LINKS = PRODUCT_LINKS.some((p) => p.isAffiliate);
