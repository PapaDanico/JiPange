"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TOOL_META, findResumableTool } from "@/lib/tool-meta";

export default function ContinueSessionBanner() {
  const [href, setHref] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setHref(findResumableTool());
  }, []);

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
            onClick={() => setDismissed(true)}
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
