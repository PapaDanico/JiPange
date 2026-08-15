import type { Metadata, Viewport } from "next";
import { Figtree, Source_Serif_4 } from "next/font/google";
import Footer from "@/components/Footer";
import AppHeader from "@/components/nav/AppHeader";
import BottomNav from "@/components/nav/BottomNav";
import JsonLd from "@/components/seo/JsonLd";
import { SITE_URL } from "@/lib/site-config";
import { organizationJsonLd, websiteJsonLd } from "@/lib/structured-data";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  /* Self-referencing canonical, resolved per route against metadataBase.
     The tool pages accept query parameters — /tools/salary?gross=120000 is the
     same page as /tools/salary — and without this each parameterised URL is a
     separate document to a crawler, splitting ranking signals and risking a
     half-filled form appearing in results instead of the clean page.
     Verified against built HTML, not assumed: './' resolving to the site root
     rather than the current path would point all 44 routes at the homepage,
     which is worse than no canonical at all. */
  alternates: { canonical: "./" },
  title: {
    default: "JiPange — Kenya's Financial Planning Copilot",
    template: "%s | JiPange",
  },
  description:
    "The financial plan every Kenyan deserves — built for how we actually live.",
  openGraph: {
    siteName: "JiPange",
    type: "website",
    locale: "en_KE",
    // og:image comes from the opengraph-image.tsx file convention: a
    // site-wide card at app/opengraph-image.tsx plus per-route overrides.
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#6B5B4D",
};

// Signature pairing: a Tiempos-class serif for display type over a clean
// humanist sans for UI. Self-hosted by next/font (zero external requests,
// size-adjusted fallbacks against CLS); globals.css maps the variables to
// --font-sans / --font-display.
const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
  display: "swap",
});
const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full ${figtree.variable} ${sourceSerif.variable}`}>
      {/* pb-16 clears the fixed mobile bottom nav; sm:pb-0 removes it where the bar is hidden. */}
      <body className="min-h-full flex flex-col bg-background pb-16 font-sans text-ink antialiased sm:pb-0 print:pb-0">
        <JsonLd data={organizationJsonLd()} />
        <JsonLd data={websiteJsonLd()} />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:text-white"
        >
          Skip to content
        </a>
        <AppHeader />
        <main id="main" className="flex flex-1 flex-col">
          {children}
        </main>
        <Footer />
        <BottomNav />
      </body>
    </html>
  );
}
