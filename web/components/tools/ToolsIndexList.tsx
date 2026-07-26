"use client";

import { useMemo, useRef, useState } from "react";
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

const ALL_LABEL = "All";

export default function ToolsIndexList({ groups }: { groups: ToolGroup[] }) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState(ALL_LABEL);
  const inputRef = useRef<HTMLInputElement>(null);

  const categoryLabels = [ALL_LABEL, ...groups.map((g) => g.label)];

  const filteredGroups = useMemo(() => {
    const categoryFiltered =
      activeCategory === ALL_LABEL
        ? groups
        : groups.filter((g) => g.label === activeCategory);

    const q = query.trim().toLowerCase();
    if (!q) return categoryFiltered;

    return categoryFiltered
      .map((group) => ({
        ...group,
        calculators: group.calculators.filter(
          (calc) =>
            calc.title.toLowerCase().includes(q) ||
            calc.description.toLowerCase().includes(q)
        ),
      }))
      .filter((group) => group.calculators.length > 0);
  }, [groups, query, activeCategory]);

  const totalVisible = filteredGroups.reduce((sum, g) => sum + g.calculators.length, 0);
  const totalAll = groups.reduce((sum, g) => sum + g.calculators.length, 0);
  const isFiltered = query.trim() !== "" || activeCategory !== ALL_LABEL;

  function clearSearch() {
    setQuery("");
    inputRef.current?.focus();
  }

  return (
    <div className="mt-8 w-full max-w-5xl space-y-5">
      <div className="max-w-2xl space-y-5">
        {/* Search */}
        <div className="relative">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search calculators…"
            aria-label="Search calculators"
            className="h-12 w-full rounded-lg border border-border bg-white pl-10 pr-10 text-base focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {query && (
            <button
              type="button"
              onClick={clearSearch}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-border text-xs text-ink-soft hover:bg-[#D4CEC5]"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category chips */}
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          {categoryLabels.map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => setActiveCategory(label)}
              aria-pressed={activeCategory === label}
              className={`inline-flex min-h-11 items-center justify-center rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${
                activeCategory === label
                  ? "border-primary bg-primary text-white"
                  : "border-border bg-white text-ink-soft hover:bg-canvas"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Result count when filtering */}
        {isFiltered && (
          <p className="text-xs text-muted">
            {totalVisible === 0 ? (
              <>
                No calculators match —{" "}
                <button
                  type="button"
                  onClick={() => { setQuery(""); setActiveCategory(ALL_LABEL); }}
                  className="underline hover:text-primary"
                >
                  clear filters
                </button>
              </>
            ) : (
              `${totalVisible} of ${totalAll} calculators`
            )}
          </p>
        )}
      </div>

      {/* Tool groups */}
      <div className="space-y-8">
        {filteredGroups.map((group) => (
          <div key={group.label}>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-soft">
              {group.label}
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.calculators.map((calc) => (
                <Link
                  key={calc.href}
                  href={calc.href}
                  className="group flex items-center gap-3 rounded-2xl border border-transparent bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-accent hover:shadow-md lg:h-full lg:items-start lg:flex-col"
                >
                  <span className="text-2xl">{calc.icon}</span>
                  <span className="flex-1">
                    <span className="flex items-center gap-2">
                      <span className="block text-sm font-semibold text-primary">{calc.title}</span>
                      {calc.isNew && (
                        <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase text-ink">
                          New
                        </span>
                      )}
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-ink-soft">{calc.description}</span>
                  </span>
                  <span className="text-primary transition-transform group-hover:translate-x-0.5 lg:self-end">→</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
