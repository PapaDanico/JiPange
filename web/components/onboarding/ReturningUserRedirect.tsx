"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getStoredJourneyAnswers, getStoredProfile } from "@/lib/storage";

/**
 * Welcomes a returning visitor with a continue link instead of forcing a
 * redirect — the homepage stays explorable (the bottom-nav Home tab must
 * never bounce), while one tap resumes the journey.
 *
 * Reads the device and nothing else. It used to fall back to a Supabase
 * session — fetching the signed-in reader's profile and plan rows and
 * rehydrating them into local storage — which was removed in July 2026 along
 * with the rest of the sign-in path. Nothing is lost for anybody who has used
 * this device before, which was always the overwhelming majority: the two
 * storage reads above were tried first and answered nearly every case.
 */
export default function ReturningUserRedirect() {
  const [destination, setDestination] = useState<{ href: string; label: string } | null>(null);

  useEffect(() => {
    function check() {
      if (getStoredProfile()) {
        setDestination({ href: "/plan", label: "Continue to my action plan" });
        return;
      }
      if (getStoredJourneyAnswers()) {
        setDestination({ href: "/dashboard", label: "Continue to my dashboard" });
        return;
      }
    }

    check();
  }, []);

  if (!destination) return null;

  return (
    <div className="mb-6 w-full max-w-md rounded-2xl border border-border bg-white p-4 text-center shadow-sm">
      <p className="text-sm text-ink-soft">
        <span aria-hidden="true">👋 </span>Welcome back — pick up where you left off.
      </p>
      <Link
        href={destination.href}
        className="mt-2 inline-flex h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-medium text-white transition-colors hover:bg-primary-deep"
      >
        {destination.label} →
      </Link>
    </div>
  );
}
