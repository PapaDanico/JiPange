"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { TOOL_META, recordToolVisit } from "@/lib/tool-meta";

export default function ToolEnhancements() {
  const pathname = usePathname();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (pathname) recordToolVisit(pathname);
  }, [pathname]);

  const meta = TOOL_META[pathname ?? ""];
  const related = meta?.related
    .map((href) => TOOL_META[href])
    .filter(Boolean)
    .slice(0, 3);

  function handleShare() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      navigator.share({ title: meta?.name ?? "JiPange", url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }

  if (!meta) return null;

  return (
    <div className="w-full space-y-4 print:hidden">
      {meta.nextMove && (
        <Link
          href={meta.nextMove.href}
          className="flex h-12 w-full items-center justify-center rounded-full bg-primary text-center text-sm font-semibold text-white transition-colors hover:bg-[#584a3e]"
        >
          {meta.nextMove.label}
        </Link>
      )}

      {related && related.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted">
            Try next
          </p>
          <div className="flex flex-wrap gap-2">
            {related.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#E5E0D8] bg-white px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:border-accent hover:text-accent"
              >
                <span aria-hidden="true">{tool.icon}</span>
                {tool.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={handleShare}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted underline underline-offset-2 hover:text-primary"
      >
        {copied ? "Link copied!" : "Share this calculator"}
      </button>
    </div>
  );
}
