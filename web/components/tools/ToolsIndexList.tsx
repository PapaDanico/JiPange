"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

export interface ToolCard {
  href: string;
  icon: string;
  title: string;
  description: string;
  insight: string;
  isNew?: boolean;
}

export interface ToolGroup {
  label: string;
  calculators: ToolCard[];
}

export default function ToolsIndexList({ groups }: { groups: ToolGroup[] }) {
  const [query, setQuery] = useState("");

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups;

    return groups
      .map((group) => ({
        ...group,
        calculators: group.calculators.filter(
          (calc) =>
            calc.title.toLowerCase().includes(q) ||
            calc.description.toLowerCase().includes(q)
        ),
      }))
      .filter((group) => group.calculators.length > 0);
  }, [groups, query]);

  return (
    <div className="mt-8 w-full max-w-md space-y-8">
      <input
        type="text"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="What do you want to calculate?"
        className="h-12 w-full rounded-lg border border-[#E5E0D8] bg-white px-4 text-base focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      />

      {filteredGroups.length === 0 && (
        <p className="text-center text-sm text-[#4B4238]">No calculators match &ldquo;{query}&rdquo;.</p>
      )}

      {filteredGroups.map((group) => (
        <div key={group.label}>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#4B4238]">
            {group.label}
          </h2>
          <div className="space-y-3">
            {group.calculators.map((calc) => (
              <Link
                key={calc.href}
                href={calc.href}
                className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm transition-colors hover:bg-[#F1ECE3]"
              >
                <span className="text-2xl">{calc.icon}</span>
                <span className="flex-1">
                  <span className="flex items-center gap-2">
                    <span className="block text-sm font-semibold text-primary">{calc.title}</span>
                    {calc.isNew && (
                      <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase text-[#171717]">
                        New
                      </span>
                    )}
                  </span>
                  <span className="block text-xs text-[#4B4238]">{calc.description}</span>
                  <span className="mt-1 block text-xs italic text-[#4B4238]">{calc.insight}</span>
                </span>
                <span className="text-primary">→</span>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
