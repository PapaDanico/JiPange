"use client";

import { useState } from "react";
import Link from "next/link";
import { TOOL_META, findResumableTool } from "@/lib/tool-meta";
import { useStorageValue } from "@/lib/hooks";

const DISMISSED_KEY = "jipange:continue-banner-dismissed";

function readDismissed(): boolean {
  try {
    return sessionStorage.getItem(DISMISSED_KEY) !== null;
  } catch {
    return false; // sessionStorage unavailable
  }
}

export default function ContinueSessionBanner() {
  const href = useStorageValue(findResumableTool, () => null);

  // Dismissal is a one-directional flag (false → true, never back). What was
  // stored earlier in this session is read through the same external-store
  // hook as `href`, so the server render and first paint agree without a
  // mount effect; a click this render is local state, because storage may be
  // unavailable (private mode) and the banner must still go away.
  const dismissedEarlier = useStorageValue(readDismissed, () => false);
  const [dismissedNow, setDismissedNow] = useState(false);
  const dismissed = dismissedEarlier || dismissedNow;

  function handleDismiss() {
    try {
      sessionStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // sessionStorage unavailable — no-op.
    }
    setDismissedNow(true);
  }

  if (!href || dismissed) return null;
  const meta = TOOL_META[href];
  if (!meta) return null;

  return (
    <div className="mb-6 w-full rounded-2xl border border-accent bg-accent-soft p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-primary">Continue where you left off?</p>
          <p className="mt-0.5 truncate text-xs text-ink-soft">
            <span aria-hidden="true">{meta.icon}</span> {meta.name} has unfinished inputs
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={href}
            className="relative before:absolute before:-inset-y-1 before:inset-x-0 before:content-[''] inline-flex h-9 items-center justify-center rounded-full bg-primary px-4 text-xs font-semibold text-white transition-colors hover:bg-primary-deep"
          >
            Resume →
          </Link>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted hover:text-primary"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
