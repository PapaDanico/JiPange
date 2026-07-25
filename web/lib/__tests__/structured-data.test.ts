import { describe, expect, it } from "vitest";
import {
  breadcrumbJsonLd,
  collectionPageJsonLd,
  organizationJsonLd,
  softwareApplicationJsonLd,
  websiteJsonLd,
} from "@/lib/structured-data";
import { SITE_URL } from "@/lib/site-config";

describe("organizationJsonLd", () => {
  it("declares an Organization with an absolute logo URL", () => {
    const data = organizationJsonLd();
    expect(data["@type"]).toBe("Organization");
    expect(data.url).toBe(SITE_URL);
    expect(data.logo.startsWith(SITE_URL)).toBe(true);
  });
});

describe("websiteJsonLd", () => {
  it("declares a WebSite pointed at SITE_URL", () => {
    const data = websiteJsonLd();
    expect(data["@type"]).toBe("WebSite");
    expect(data.url).toBe(SITE_URL);
  });
});

describe("softwareApplicationJsonLd", () => {
  it("builds a free FinanceApplication at the given path", () => {
    const data = softwareApplicationJsonLd({
      name: "FIRE Number Calculator",
      description: "Find your FIRE number.",
      path: "/tools/fire-number",
    });
    expect(data["@type"]).toBe("SoftwareApplication");
    expect(data.name).toBe("FIRE Number Calculator");
    expect(data.url).toBe(`${SITE_URL}/tools/fire-number`);
    expect(data.applicationCategory).toBe("FinanceApplication");
    expect(data.offers).toEqual({ "@type": "Offer", price: "0", priceCurrency: "KES" });
  });
});

describe("breadcrumbJsonLd", () => {
  it("numbers positions from 1 and resolves absolute URLs", () => {
    const data = breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Calculators", path: "/tools" },
      { name: "FIRE Number Calculator", path: "/tools/fire-number" },
    ]);
    expect(data["@type"]).toBe("BreadcrumbList");
    expect(data.itemListElement).toHaveLength(3);
    expect(data.itemListElement[0]).toEqual({
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: `${SITE_URL}/`,
    });
    expect(data.itemListElement[2].item).toBe(`${SITE_URL}/tools/fire-number`);
  });
});

describe("collectionPageJsonLd", () => {
  it("builds a CollectionPage with a positioned ItemList", () => {
    const data = collectionPageJsonLd({
      name: "Free Financial Calculators",
      description: "Quick tools.",
      path: "/tools",
      items: [
        { name: "FIRE Number Calculator", path: "/tools/fire-number" },
        { name: "Savings Goal Calculator", path: "/tools/savings-goal" },
      ],
    });
    expect(data["@type"]).toBe("CollectionPage");
    expect(data.mainEntity["@type"]).toBe("ItemList");
    expect(data.mainEntity.itemListElement).toHaveLength(2);
    expect(data.mainEntity.itemListElement[1]).toEqual({
      "@type": "ListItem",
      position: 2,
      name: "Savings Goal Calculator",
      url: `${SITE_URL}/tools/savings-goal`,
    });
  });
});
