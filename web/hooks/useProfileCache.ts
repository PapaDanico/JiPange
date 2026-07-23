"use client";

import { useMemo } from "react";
import { getProfileDraft, getStoredProfile } from "@/lib/storage";
import { useStorageValue } from "@/lib/hooks";

/**
 * Surfaces an in-progress deep-wizard draft (auto-saved to localStorage on
 * every change by ProfileForm) so landing surfaces can offer a resume toast.
 * Returns null while a completed profile exists — the welcome-back card
 * already covers that case.
 */
export function useProfileCache() {
  const hasProfile = useStorageValue(() => Boolean(getStoredProfile()), () => false);
  const draft = useStorageValue(getProfileDraft, () => null);

  return useMemo(() => {
    if (hasProfile || !draft) return null;
    const step =
      typeof draft.currentStep === "number" && draft.currentStep >= 1 ? draft.currentStep : 1;
    return { step };
  }, [hasProfile, draft]);
}
