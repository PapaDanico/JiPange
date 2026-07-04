"use client";

import { useEffect, useState } from "react";
import { getProfileDraft, getStoredProfile } from "@/lib/storage";

/**
 * Surfaces an in-progress deep-wizard draft (auto-saved to localStorage on
 * every change by ProfileForm) so landing surfaces can offer a resume toast.
 * Returns null while a completed profile exists — the welcome-back card
 * already covers that case.
 */
export function useProfileCache() {
  const [draft, setDraft] = useState<{ step: number } | null>(null);

  useEffect(() => {
    if (getStoredProfile()) return;
    const stored = getProfileDraft();
    if (!stored) return;
    const step =
      typeof stored.currentStep === "number" && stored.currentStep >= 1 ? stored.currentStep : 1;
    setDraft({ step });
  }, []);

  return draft;
}
