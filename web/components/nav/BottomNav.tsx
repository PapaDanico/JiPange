"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getStoredProfile } from "@/lib/storage";

/**
 * Mobile-only bottom tab bar — the navigation pattern Kenyan users already
 * know from M-Pesa and local savings apps. Hidden from sm: upward, where the
 * header links take over.
 */
export default function BottomNav() {
  const pathname = usePathname();
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    setHasProfile(Boolean(getStoredProfile()));
  }, [pathname]);

  const planTab = hasProfile
    ? { href: "/picture", label: "My Plan" }
    : { href: "/profile", label: "Get Plan" };

  const tabs = [
    { href: "/", label: "Home", emoji: "🏠", exact: true },
    { href: "/planners", label: "Planners", emoji: "🎯", exact: false },
    { href: "/tools", label: "Tools", emoji: "🧮", exact: false },
    {
      href: planTab.href,
      label: planTab.label,
      emoji: "📊",
      // The plan journey spans three routes; highlight the tab on any of them.
      activePaths: ["/profile", "/picture", "/plan"],
      exact: false,
    },
  ];

  // Segment-aware prefix match: "/plan" must match "/plan/x" but not "/planners".
  const underPath = (base: string) => pathname === base || pathname.startsWith(`${base}/`);

  const isActive = (tab: (typeof tabs)[number]) => {
    if ("activePaths" in tab && tab.activePaths) {
      return tab.activePaths.some(underPath);
    }
    return tab.exact ? pathname === tab.href : underPath(tab.href);
  };

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E5E0D8] bg-white pb-[env(safe-area-inset-bottom)] sm:hidden print:hidden"
    >
      <div className="mx-auto flex h-16 max-w-md items-stretch">
        {tabs.map((tab) => {
          const active = isActive(tab);
          return (
            <Link
              key={tab.label}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${
                active ? "text-primary" : "text-[#6f6e69]"
              }`}
            >
              <span aria-hidden="true" className={`text-xl ${active ? "" : "grayscale opacity-70"}`}>
                {tab.emoji}
              </span>
              {tab.label}
              <span
                aria-hidden="true"
                className={`h-0.5 w-8 rounded-full ${active ? "bg-accent" : "bg-transparent"}`}
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
