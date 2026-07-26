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

/**
 * An FAQ page, so the answers can surface directly in search results.
 *
 * Drawn from the same FAQS array the page renders — the anti-drift rule at the
 * top of this file applies with extra force here, because a structured-data
 * answer that has diverged from the visible one is a search engine quoting a
 * claim the site no longer makes.
 */
export function faqPageJsonLd(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

/** A glossary, expressed as the defined-term set schema.org has for exactly this. */
export function glossaryJsonLd({
  name,
  description,
  path,
  terms,
}: {
  name: string;
  description: string;
  path: string;
  terms: { term: string; meaning: string }[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "DefinedTermSet",
    name,
    description,
    url: `${SITE_URL}${path}`,
    hasDefinedTerm: terms.map((t) => ({
      "@type": "DefinedTerm",
      name: t.term,
      description: t.meaning,
      inDefinedTermSet: `${SITE_URL}${path}`,
    })),
  };
}
