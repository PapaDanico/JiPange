import type { Metadata } from "next";
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
  },
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
        <AppHeader />
        {children}
        <Footer />
        <BottomNav />
      </body>
    </html>
  );
}
