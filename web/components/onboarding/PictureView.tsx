"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { JourneyAnswers } from "@/lib/journey";
import { getStoredGoals, getStoredJourneyAnswers, getStoredProfile } from "@/lib/storage";
import PesaDiagnostic from "@/components/journey/PesaDiagnostic";
import MoneyPicture from "./MoneyPicture";
import MyGoals from "./MyGoals";
import OnboardingStepIndicator from "./OnboardingStepIndicator";

/**
 * Composes the /picture page by what the visitor has shared:
 * quiz answers → the diagnostic dashboard; a full profile → the
 * shilling-exact Pesa Picture; both → both; neither → an invitation
 * (never a forced redirect).
 */
export default function PictureView() {
  const [answers, setAnswers] = useState<JourneyAnswers | null>(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [hasGoals, setHasGoals] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setAnswers(getStoredJourneyAnswers());
    setHasProfile(Boolean(getStoredProfile()));
    setHasGoals(getStoredGoals().length > 0);
    setChecked(true);
  }, []);

  if (!checked) {
    return <p className="text-center text-[#4B4238]">Loading your Pesa Picture...</p>;
  }

  if (!answers && !hasProfile) {
    return (
      <div className="w-full max-w-2xl space-y-6">
        {hasGoals && <MyGoals savingsCapacity={0} />}
        <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
        <p className="text-2xl" aria-hidden="true">
          🖼️
        </p>
        <h2 className="mt-2 text-lg font-semibold text-primary">
          Your Pesa Picture starts with five taps
        </h2>
        <p className="mt-1 text-sm text-[#4B4238]">
          Take the anonymous 90-second check and we&apos;ll diagnose your money&apos;s health —
          leaks, inflation drag, and where it should live.
        </p>
        <Link
          href="/profile"
          className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-accent px-6 text-sm font-medium text-[#171717] transition-colors hover:bg-[#d6961f]"
        >
          Start the 90-second check →
        </Link>
        <p className="mt-4 text-xs text-[#6f6e69]">
          Or explore freely:{" "}
          <Link href="/tools" className="font-medium text-primary underline">
            calculators
          </Link>{" "}
          ·{" "}
          <Link href="/planners" className="font-medium text-primary underline">
            goal planners
          </Link>
        </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl space-y-10">
      {answers && <PesaDiagnostic answers={answers} />}
      {hasProfile && (
        <div>
          {answers && (
            <h2 className="mb-4 border-t border-[#E5E0D8] pt-8 text-lg font-semibold text-primary">
              Your shilling-exact numbers
            </h2>
          )}
          {!answers && <OnboardingStepIndicator step={2} />}
          <div className="flex justify-center">
            <MoneyPicture />
          </div>
        </div>
      )}
      {answers && !hasProfile && hasGoals && <MyGoals savingsCapacity={0} />}
      {answers && !hasProfile && (
        <p className="text-center text-xs text-[#6f6e69]">
          Want the shilling-exact version — real take-home pay, budget split, wealth projection?{" "}
          <Link href="/profile/full" className="font-medium text-primary underline">
            Take the deep profile
          </Link>
        </p>
      )}
    </div>
  );
}
