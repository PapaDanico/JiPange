import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-config";

const ROUTES = [
  "", "/about", "/partners", "/profile", "/profile/full", "/picture", "/plan", "/dashboard",
  "/planners", "/planners/education", "/planners/home", "/planners/emergency",
  "/planners/business", "/planners/retirement", "/planners/hustle", "/tools",
  ...[
    // The take-home, budget-split, payday-router, tax-shield and salary-negotiation
    // addresses redirect to tabs of /tools/salary, so only the hub is listed.
    "savings-goal", "loan-repayment",
    "investment-returns", "fire-number", "dhowcsd", "money-runway",
    "sacco-vs-bank", "inflation-reality",
    "kplc-optimizer", "fuliza-cost", "one-third-rule", "guarantor-shield",
    "chama", "hustle-smoother", "20th-challenge", "debt-escape", "land-purchase",
    "salary", "sha-health", "school-fees-lifetime",
  ].map((t) => `/tools/${t}`),
  "/terms", "/privacy", "/faq", "/glossary", "/support",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map((route) => ({
    url: `${SITE_URL}${route}`,
    changeFrequency: "weekly",
    priority: route === "" ? 1 : route.startsWith("/tools/") ? 0.7 : 0.8,
  }));
}
