import type { Metadata } from "next";
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
      <body className="min-h-full flex flex-col bg-background text-[#171717] antialiased">
        {children}
      </body>
    </html>
  );
}
