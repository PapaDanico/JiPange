"use client";

import Link from "next/link";
import { getStoredGoals, getStoredJourneyAnswers, getStoredProfile } from "@/lib/storage";
import { useStorageValue } from "@/lib/hooks";
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
  const answers = useStorageValue(getStoredJourneyAnswers, () => null);
  const hasProfile = useStorageValue(() => Boolean(getStoredProfile()), () => false);
  const hasGoals = useStorageValue(() => getStoredGoals().length > 0, () => false);

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
        <p className="mt-1 text-sm text-ink-soft">
          Take the anonymous 90-second check and we&apos;ll diagnose your money&apos;s health —
          leaks, inflation drag, and where it should live.
        </p>
        <Link
          href="/profile"
          className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-accent px-6 text-sm font-medium text-ink transition-colors hover:bg-accent-deep"
        >
          Start the 90-second check →
        </Link>
        <p className="mt-4 text-xs text-faint">
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
            <h2 className="mb-4 border-t border-border pt-8 text-lg font-semibold text-primary">
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
        <p className="text-center text-xs text-faint">
          Want the shilling-exact version — real take-home pay, budget split, wealth projection?{" "}
          <Link href="/profile/full" className="font-medium text-primary underline">
            Take the deep profile
          </Link>
        </p>
      )}
    </div>
  );
}
