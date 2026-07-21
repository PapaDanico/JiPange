"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getStoredProfile, getStoredJourneyAnswers } from "@/lib/storage";

export default function ToolLayoutCTA() {
  const pathname = usePathname();
  const [state, setState] = useState<"new" | "journey" | "plan">("new");

  useEffect(() => {
    if (getStoredProfile()) {
      setState("plan");
    } else if (getStoredJourneyAnswers()) {
      setState("journey");
    } else {
      setState("new");
    }
  }, [pathname]);

  if (state === "plan") {
    return (
      <div className="w-full rounded-2xl bg-white p-6 text-center shadow-sm print:hidden">
        <p className="text-sm font-medium text-primary">Your financial picture is ready</p>
        <p className="mt-1 text-xs text-[#4B4238]">
          See how this calculator result fits into your full plan.
        </p>
        <Link
          href="/picture"
          className="mt-3 inline-flex h-10 items-center justify-center rounded-full bg-accent px-5 text-sm font-medium text-[#171717] transition-colors hover:bg-[#d6961f]"
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
        <p className="mt-1 text-xs text-[#4B4238]">
          Finish your profile to get a personalised action plan built around your whole picture.
        </p>
        <Link
          href="/dashboard"
          className="mt-3 inline-flex h-10 items-center justify-center rounded-full bg-accent px-5 text-sm font-medium text-[#171717] transition-colors hover:bg-[#d6961f]"
        >
          Complete my plan
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl bg-white p-6 text-center shadow-sm print:hidden">
      <p className="text-sm font-medium text-primary">Want a full plan, not just one number?</p>
      <p className="mt-1 text-xs text-[#4B4238]">
        Get a personalised 3-step action plan built around your whole financial picture.
      </p>
      <Link
        href="/profile"
        className="mt-3 inline-flex h-10 items-center justify-center rounded-full bg-accent px-5 text-sm font-medium text-[#171717] transition-colors hover:bg-[#d6961f]"
      >
        Build my free plan
      </Link>
    </div>
  );
}
