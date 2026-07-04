import type { Metadata, Viewport } from "next";
import Footer from "@/components/Footer";
import AppHeader from "@/components/nav/AppHeader";
import BottomNav from "@/components/nav/BottomNav";
import "./globals.css";

const SITE_URL = "https://jipangefinance.netlify.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
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
    images: [{ url: "/logo-lockup.webp", width: 1131, height: 609, alt: "JiPange — jipange kabla pesa ikupange" }],
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#6B5B4D",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      {/* pb-16 clears the fixed mobile bottom nav; sm:pb-0 removes it where the bar is hidden. */}
      <body className="min-h-full flex flex-col bg-background pb-16 text-[#171717] antialiased sm:pb-0 print:pb-0">
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
