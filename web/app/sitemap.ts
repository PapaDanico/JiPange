import type { MetadataRoute } from "next";

const SITE_URL = "https://jipangefinance.netlify.app";

const ROUTES = [
  "", "/profile", "/profile/full", "/picture", "/plan", "/dashboard", "/planners",
  "/planners/education", "/planners/home", "/planners/emergency", "/planners/business",
  "/planners/retirement", "/planners/hustle", "/tools",
  ...[
    "take-home-pay", "savings-goal", "budget-split", "payday-router", "loan-repayment",
    "tax-shield", "investment-returns", "fire-number", "dhowcsd", "money-runway",
    "education-savings", "salary-negotiation", "sacco-vs-bank", "inflation-reality",
    "kplc-optimizer", "fuliza-cost", "one-third-rule", "guarantor-shield",
  ].map((t) => `/tools/${t}`),
  "/terms", "/privacy",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map((route) => ({
    url: `${SITE_URL}${route}`,
    changeFrequency: "weekly",
    priority: route === "" ? 1 : route.startsWith("/tools/") ? 0.7 : 0.8,
  }));
}
