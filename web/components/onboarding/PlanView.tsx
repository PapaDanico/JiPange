"use client";

import Link from "next/link";
import { getStoredJourneyAnswers, getStoredPlan, getStoredProfile } from "@/lib/storage";
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
  const hasAiPlan = useStorageValue(() => Boolean(getStoredPlan()), () => false);

  // Print policy: the AI section gets its own clean page when it prints
  // alongside the journey roadmap — but if no AI plan is stored (still
  // loading, errored, or not yet generated), the whole section stays off
  // the report rather than printing a stray heading.
  const aiSectionPrintClass = answers
    ? hasAiPlan
      ? "print:break-before-page"
      : "print:hidden"
    : undefined;

  return (
    <div className="w-full max-w-2xl space-y-10">
      {answers && <JourneyActionPlan answers={answers} />}

      {(hasProfile || !answers) && (
        <div className={aiSectionPrintClass}>
          {answers && hasProfile && (
            <div className="mb-4 border-t border-border pt-8 print:border-t-0 print:pt-0">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-primary">Your AI action plan</h2>
                <Link
                  href="/profile/full"
                  className="text-xs font-medium text-primary underline print:hidden"
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
