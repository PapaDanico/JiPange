"use client";

import Link from "next/link";
import { useProfileCache } from "@/hooks/useProfileCache";

/** Inline top-row toast: one tap back into the deep wizard at the saved step. */
export default function ResumeToast() {
  const draft = useProfileCache();
  if (!draft) return null;

  return (
    <div
      data-testid="resume-toast"
      className="mb-6 flex w-full max-w-md items-center justify-between gap-3 rounded-2xl border border-accent bg-accent-soft p-4 shadow-sm"
    >
      <p className="text-sm text-ink-soft">
        🔄 Resume your custom financial roadmap where you left off (step {draft.step} of 6).
      </p>
      <Link
        href="/profile/full"
        className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-primary px-5 text-sm font-medium text-white transition-colors hover:bg-primary-deep"
      >
        Resume
      </Link>
    </div>
  );
}
