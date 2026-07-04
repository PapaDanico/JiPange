"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getStoredJourneyAnswers, getStoredProfile } from "@/lib/storage";

const DESKTOP_LINKS = [
  { href: "/planners", label: "Planners" },
  { href: "/tools", label: "Calculators" },
];

export default function AppHeader() {
  const pathname = usePathname();
  // Read after mount so the server render matches the client's first paint.
  const [hasProfile, setHasProfile] = useState(false);
  const [hasJourney, setHasJourney] = useState(false);

  useEffect(() => {
    setHasProfile(Boolean(getStoredProfile()));
    setHasJourney(Boolean(getStoredJourneyAnswers()));
  }, [pathname]);

  const cta = hasProfile
    ? { href: "/picture", label: "My plan" }
    : hasJourney
      ? { href: "/dashboard", label: "My plan" }
      : { href: "/profile", label: "Start my plan" };

  // Segment-aware prefix match so e.g. "/plan" can never claim "/planners".
  const underPath = (base: string) => pathname === base || pathname.startsWith(`${base}/`);

  return (
    <header className="sticky top-0 z-40 border-b border-[#E5E0D8] bg-background/95 backdrop-blur print:hidden">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2" aria-label="JiPange home">
          <Image
            src="/logo-icon.webp"
            alt=""
            width={973}
            height={833}
            className="h-8 w-auto"
          />
          <span className="text-sm font-semibold text-primary">JiPange</span>
        </Link>

        <nav className="flex items-center gap-4" aria-label="Primary">
          {DESKTOP_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={underPath(link.href) ? "page" : undefined}
              className={`hidden text-sm font-medium sm:block ${
                underPath(link.href)
                  ? "text-primary underline underline-offset-4"
                  : "text-[#4B4238] hover:text-primary"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href={cta.href}
            className="inline-flex h-9 items-center justify-center rounded-full bg-accent px-4 text-sm font-medium text-[#171717] transition-colors hover:bg-[#d6961f]"
          >
            {cta.label}
          </Link>
        </nav>
      </div>
    </header>
  );
}
