"use client";

import Link from "next/link";
import { getStoredJourneyAnswers, getStoredProfile } from "@/lib/storage";
import { useStorageValue } from "@/lib/hooks";
import JourneyActionPlan from "@/components/journey/JourneyActionPlan";
import ActionPlan from "./ActionPlan";
import OnboardingStepIndicator from "./OnboardingStepIndicator";

/**
 * Composes /plan by what the visitor has shared: quiz answers → the
 * milestone/blueprint/share roadmap; a full profile → the AI plan too;
 * neither → ActionPlan's own invitation (never a redirect).
 */
export default function PlanView() {
  const answers = useStorageValue(getStoredJourneyAnswers, () => null);
  const hasProfile = useStorageValue(() => Boolean(getStoredProfile()), () => false);

  return (
    <div className="w-full max-w-2xl space-y-10">
      {answers && <JourneyActionPlan answers={answers} />}

      {(hasProfile || !answers) && (
        <div>
          {answers && hasProfile && (
            <div className="mb-4 border-t border-[#E5E0D8] pt-8">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-primary">Your AI action plan</h2>
                <Link
                  href="/profile/full"
                  className="text-xs font-medium text-primary underline"
                >
                  Update my plan
                </Link>
              </div>
            </div>
          )}
          {!answers && hasProfile && <OnboardingStepIndicator step={3} />}
          <div className="flex justify-center">
            <ActionPlan />
          </div>
        </div>
      )}
    </div>
  );
}
