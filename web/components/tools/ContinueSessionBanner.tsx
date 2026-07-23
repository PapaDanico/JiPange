"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TOOL_META, findResumableTool } from "@/lib/tool-meta";
import { useStorageValue } from "@/lib/hooks";

const DISMISSED_KEY = "jipange:continue-banner-dismissed";

export default function ContinueSessionBanner() {
  const href = useStorageValue(findResumableTool, () => null);

  // Session-dismissal is a one-directional, click-driven flag (it only ever
  // goes false → true, never back) scoped to this component instance, not
  // something other components need to react to — unlike `href` above,
  // this doesn't fit useSyncExternalStore's "continuously synced" model.
  // Still needs a mount effect to read it without a hydration mismatch
  // (sessionStorage doesn't exist during SSR).
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time, one-directional mount check; see comment above
      if (sessionStorage.getItem(DISMISSED_KEY)) setDismissed(true);
    } catch {
      // sessionStorage unavailable — no-op.
    }
  }, []);

  function handleDismiss() {
    try {
      sessionStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // sessionStorage unavailable — no-op.
    }
    setDismissed(true);
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
            className="inline-flex h-9 items-center justify-center rounded-full bg-primary px-4 text-xs font-semibold text-white transition-colors hover:bg-primary-deep"
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
