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

  /* Flat links beside the two disclosures, the way Mwangaza does it.
   *
   * Kept to destinations a reader might want from anywhere and cannot reach
   * from a dropdown: the partner directory and the glossary. Anything more
   * competes with the two menus that carry 26 calculators between them, and
   * a nav that lists everything ranks nothing. */
  const flatLinks = [
    { href: "/partners", label: "Partners" },
    { href: "/glossary", label: "Glossary" },
  ];

  /* No display utility here, deliberately.
   *
   * It first read `inline-flex …` and the call site added `hidden md:inline-flex`
   * — two unconditional display utilities in one class list, where the plain
   * one wins. Partners and Glossary rendered on a 390px phone beside a CTA
   * that then had nowhere to go and wrapped onto two lines. Display belongs to
   * whoever decides where the link appears. */
  const linkClass = (isActive: boolean) =>
    `min-h-11 items-center whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
      isActive ? "bg-ink text-background" : "text-muted hover:bg-canvas hover:text-ink"
    }`;

  return (
    /* Mwangaza's header ground: a warm canvas tint rather than the page
     * background, so the bar reads as a distinct surface once the page
     * scrolls under it. On JiPange the header was background/95 over a
     * background page — the border was the only thing separating them, and it
     * vanished against a white hero section. */
    <header className="sticky top-0 z-40 border-b border-border bg-canvas/90 backdrop-blur print:hidden">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-2 px-4 sm:px-6 lg:gap-3">
        <Link
          href="/"
          className="flex min-h-11 shrink-0 items-center gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          aria-label="JiPange home"
        >
          {/* Mark plus a TEXT wordmark, the way Mwangaza builds its brand
            * block — not the lockup image.
            *
            * The lockup carries its own wordmark, but as a raster it rendered
            * at h-9 with the type inside it perhaps 11px and soft, so the
            * brand read as the smallest thing in its own header. Mwangaza
            * pairs a 36px mark with an 18px bold wordmark in live text, which
            * stays crisp at any zoom, is selectable and searchable, and gives
            * the accent somewhere deliberate to sit.
            *
            * The accent lands on "Pange" for the same reason Mwangaza puts it
            * on "Yield": it marks the half of the name that says what the
            * product does — kupanga, to plan. */}
          <Image
            src="/logo-icon.webp"
            alt=""
            width={512}
            height={512}
            sizes="36px"
            className="h-9 w-9 rounded-xl"
            priority
          />
          <span className="whitespace-nowrap font-display text-base font-bold tracking-tight text-ink lg:text-lg">
            Ji<span className="text-accent-ink">Pange</span>
          </span>
        </Link>

        <nav className="ml-1 flex items-center gap-0.5 lg:ml-6 lg:gap-1" aria-label="Primary">
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
          {flatLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`hidden md:inline-flex ${linkClass(underPath(href))}`}
            >
              {label}
            </Link>
          ))}
          <Link
            href={cta.href}
            className="ml-auto inline-flex min-h-11 shrink-0 items-center justify-center whitespace-nowrap rounded-full bg-accent px-4 text-sm font-semibold text-ink transition-colors hover:bg-accent-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ink"
          >
            {cta.label}
          </Link>
        </nav>
      </div>
    </header>
  );
}
