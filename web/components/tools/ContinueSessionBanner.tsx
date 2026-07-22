"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TOOL_META, findResumableTool } from "@/lib/tool-meta";

const DISMISSED_KEY = "jipange:continue-banner-dismissed";

export default function ContinueSessionBanner() {
  const [href, setHref] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't show the banner in the same browser session after the user dismissed it.
    if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(DISMISSED_KEY)) {
      setDismissed(true);
      return;
    }
    setHref(findResumableTool());
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
    <div className="mb-6 w-full rounded-2xl border border-accent bg-[#FFF8EA] p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-primary">Continue where you left off?</p>
          <p className="mt-0.5 truncate text-xs text-[#4B4238]">
            <span aria-hidden="true">{meta.icon}</span> {meta.name} has unfinished inputs
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={href}
            className="inline-flex h-9 items-center justify-center rounded-full bg-primary px-4 text-xs font-semibold text-white transition-colors hover:bg-[#584a3e]"
          >
            Resume →
          </Link>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#9A8B80] hover:text-primary"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
