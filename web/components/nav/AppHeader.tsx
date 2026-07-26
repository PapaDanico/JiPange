"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getStoredJourneyAnswers, getStoredProfile } from "@/lib/storage";
import { useStorageValue } from "@/lib/hooks";
import NavDropdown from "./NavDropdown";
import PlannersDropdownPanel from "./PlannersDropdownPanel";
import CalculatorsDropdownPanel from "./CalculatorsDropdownPanel";

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
          <div className="hidden sm:block">
            <NavDropdown label="Planners" active={underPath("/planners")}>
              <PlannersDropdownPanel />
            </NavDropdown>
          </div>
          <div className="hidden sm:block">
            <NavDropdown label="Calculators" active={underPath("/tools")}>
              <CalculatorsDropdownPanel />
            </NavDropdown>
          </div>
          <Link
            href={cta.href}
            className="relative before:absolute before:-inset-y-1 before:inset-x-0 before:content-[''] inline-flex h-9 items-center justify-center rounded-full bg-accent px-4 text-sm font-medium text-ink transition-colors hover:bg-accent-deep"
          >
            {cta.label}
          </Link>
        </nav>
      </div>
    </header>
  );
}
