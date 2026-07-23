"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getStoredJourneyAnswers, getStoredProfile } from "@/lib/storage";
import { useStorageValue } from "@/lib/hooks";

const DESKTOP_LINKS = [
  { href: "/planners", label: "Planners" },
  { href: "/tools", label: "Calculators" },
];

export default function AppHeader() {
  const pathname = usePathname();
  // The server render and the client's first paint both see `false` (via
  // getServerSnapshot); the real value swaps in once mounted, and stays
  // live afterward — e.g. right after the profile form saves, with no
  // separate reload or pathname-keyed re-check needed.
  const hasProfile = useStorageValue(() => Boolean(getStoredProfile()), () => false);
  const hasJourney = useStorageValue(() => Boolean(getStoredJourneyAnswers()), () => false);

  const cta = hasProfile
    ? { href: "/picture", label: "My plan" }
    : hasJourney
      ? { href: "/dashboard", label: "My plan" }
      : { href: "/profile", label: "Start my plan" };

  // Segment-aware prefix match so e.g. "/plan" can never claim "/planners".
  const underPath = (base: string) => pathname === base || pathname.startsWith(`${base}/`);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur print:hidden">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center" aria-label="JiPange home">
          <Image
            src="/logo-lockup.webp"
            alt="JiPange"
            width={1131}
            height={609}
            sizes="(max-width: 640px) 120px, 160px"
            className="h-9 w-auto"
            priority
          />
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
                  : "text-ink-soft hover:text-primary"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href={cta.href}
            className="inline-flex h-9 items-center justify-center rounded-full bg-accent px-4 text-sm font-medium text-ink transition-colors hover:bg-accent-deep"
          >
            {cta.label}
          </Link>
        </nav>
      </div>
    </header>
  );
}
