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
          {/* THE SHIELD IS NOT SQUARE, AND THIS DECLARED THAT IT WAS.
            *
            * logo-icon.webp is 973x833 — ratio 1.168. The declared dimensions
            * said 512x512 and the classes forced `h-9 w-9`, so under the
            * default `object-fit: fill` the mark rendered at exactly 36x36,
            * compressed about 17% horizontally on every page of the site.
            * `rounded-xl` then clipped the shield's own corners.
            *
            * Measured rather than eyeballed:
            *
            *   header  rendered 36x36    ratio 1.000  vs natural 1.2    WRONG
            *   hero    rendered 224x192  ratio 1.169  vs natural 1.168  right
            *
            * The declared 512x512 is what kept it invisible: Next was told the
            * source was square, so nothing downstream could notice. Meanwhile
            * PrintLetterhead already had it right — true dimensions and
            * `h-7 w-auto` — which made the header the single outlier.
            *
            * Reported as "transparent/PNG background artifacts". That is a
            * different mechanism from the one actually at fault, but it named
            * exactly the right element. The alpha channel is clean; worth
            * knowing that its transparent pixels are white-matted
            * (255,255,255,0), so the mark WOULD halo on a dark surface.
            * Neither usage is dark today, so that is latent, not live. */}
          <Image
            src="/logo-icon.webp"
            alt=""
            width={973}
            height={833}
            sizes="36px"
            className="h-9 w-auto"
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
