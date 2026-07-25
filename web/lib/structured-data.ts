import { SITE_URL } from "@/lib/site-config";

/**
 * schema.org JSON-LD builders. Pure functions returning plain objects (not
 * JSX) so they're trivial to unit test — rendering happens in
 * components/seo/JsonLd.tsx. Every builder here draws its name/description
 * from data the page already declares for something else (the on-page H1,
 * the visible intro paragraph, an existing config object) rather than a new
 * hand-typed copy — the same anti-drift discipline as the OG card system.
 */

export interface BreadcrumbItem {
  name: string;
  path: string;
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "JiPange",
    url: SITE_URL,
    logo: `${SITE_URL}/icon.png`,
    description: "Free, anonymous financial planning tools built for how Kenyans actually live.",
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "JiPange",
    url: SITE_URL,
  };
}

/** A free calculator/planner tool — every /tools and /planners leaf page. */
export function softwareApplicationJsonLd({
  name,
  description,
  path,
}: {
  name: string;
  description: string;
  path: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name,
    description,
    url: `${SITE_URL}${path}`,
    applicationCategory: "FinanceApplication",
    operatingSystem: "Any (web browser)",
    offers: { "@type": "Offer", price: "0", priceCurrency: "KES" },
    provider: { "@type": "Organization", name: "JiPange", url: SITE_URL },
  };
}

/** Home → Calculators/Planners → this page. */
export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}

/** A hub page (/tools, /planners) listing its leaf pages. */
export function collectionPageJsonLd({
  name,
  description,
  path,
  items,
}: {
  name: string;
  description: string;
  path: string;
  items: { name: string; path: string }[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description,
    url: `${SITE_URL}${path}`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        url: `${SITE_URL}${item.path}`,
      })),
    },
  };
}
