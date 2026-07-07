"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TOOL_META, getRecentTools } from "@/lib/tool-meta";

export default function RecentToolsBar() {
  const [recents, setRecents] = useState<string[]>([]);

  useEffect(() => {
    setRecents(getRecentTools());
  }, []);

  if (recents.length === 0) return null;

  const tools = recents.map((href) => TOOL_META[href]).filter(Boolean);
  if (tools.length === 0) return null;

  return (
    <div className="mb-6 w-full max-w-md">
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#9A8B80]">
        Recently used
      </p>
      <div className="flex flex-wrap gap-2">
        {tools.map((tool) => (
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
  );
}
