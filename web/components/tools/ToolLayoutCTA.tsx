"use client";

import Link from "next/link";
import { getStoredProfile, getStoredJourneyAnswers } from "@/lib/storage";
import { useStorageValue } from "@/lib/hooks";

function computeState(): "new" | "journey" | "plan" {
  if (getStoredProfile()) return "plan";
  if (getStoredJourneyAnswers()) return "journey";
  return "new";
}

export default function ToolLayoutCTA() {
  const state = useStorageValue(computeState, () => "new" as const);

  if (state === "plan") {
    return (
      <div className="w-full rounded-2xl bg-white p-6 text-center shadow-sm print:hidden">
        <p className="text-sm font-medium text-primary">Your financial picture is ready</p>
        <p className="mt-1 text-xs text-ink-soft">
          See how this calculator result fits into your full plan.
        </p>
        <Link
          href="/picture"
          className="mt-3 inline-flex h-11 items-center justify-center rounded-full bg-accent px-5 text-sm font-medium text-ink transition-colors hover:bg-accent-deep"
        >
          View my plan →
        </Link>
      </div>
    );
  }

  if (state === "journey") {
    return (
      <div className="w-full rounded-2xl bg-white p-6 text-center shadow-sm print:hidden">
        <p className="text-sm font-medium text-primary">You&apos;re almost there</p>
        <p className="mt-1 text-xs text-ink-soft">
          Finish your profile to get a personalised action plan built around your whole picture.
        </p>
        <Link
          href="/dashboard"
          className="mt-3 inline-flex h-11 items-center justify-center rounded-full bg-accent px-5 text-sm font-medium text-ink transition-colors hover:bg-accent-deep"
        >
          Complete my plan
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl bg-white p-6 text-center shadow-sm print:hidden">
      <p className="text-sm font-medium text-primary">Want a full plan, not just one number?</p>
      <p className="mt-1 text-xs text-ink-soft">
        Get a personalised 3-step action plan built around your whole financial picture.
      </p>
      <Link
        href="/profile"
        className="mt-3 inline-flex h-11 items-center justify-center rounded-full bg-accent px-5 text-sm font-medium text-ink transition-colors hover:bg-accent-deep"
      >
        Build my free plan
      </Link>
    </div>
  );
}
