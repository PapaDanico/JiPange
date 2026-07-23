"use client";

import { useState } from "react";

export default function DeductionRow({
  label,
  value,
  bold = false,
  info,
}: {
  label: string;
  value: string;
  bold?: boolean;
  info?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="py-1.5">
      <div
        className={`flex items-center justify-between text-sm ${bold ? "font-semibold text-primary" : "text-ink-soft"}`}
      >
        <span className="flex items-center gap-1.5">
          {label}
          {info && (
            <button
              type="button"
              onClick={() => setOpen((prev) => !prev)}
              aria-expanded={open}
              aria-label={`What is ${label}?`}
              className="print:hidden relative inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-border-strong text-[10px] font-semibold leading-none text-ink-soft before:absolute before:-inset-3.5 before:content-[''] focus:outline-none focus:ring-1 focus:ring-primary"
            >
              i
            </button>
          )}
        </span>
        <span>{value}</span>
      </div>
      {info && open && (
        <p className="mt-1 rounded-lg bg-canvas p-2.5 text-xs leading-relaxed text-ink-soft">
          {info}
        </p>
      )}
    </div>
  );
}
