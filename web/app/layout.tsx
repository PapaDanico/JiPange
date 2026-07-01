import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JiPange — Kenya's Financial Planning Copilot",
  description:
    "The financial plan every Kenyan deserves — built for how we actually live.",
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
