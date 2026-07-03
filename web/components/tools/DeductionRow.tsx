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
        className={`flex items-center justify-between text-sm ${bold ? "font-semibold text-primary" : "text-[#4B4238]"}`}
      >
        <span className="flex items-center gap-1.5">
          {label}
          {info && (
            <button
              type="button"
              onClick={() => setOpen((prev) => !prev)}
              aria-expanded={open}
              aria-label={`What is ${label}?`}
              className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-[#C9BFB2] text-[10px] font-semibold leading-none text-[#4B4238] focus:outline-none focus:ring-1 focus:ring-primary"
            >
              i
            </button>
          )}
        </span>
        <span>{value}</span>
      </div>
      {info && open && (
        <p className="mt-1 rounded-lg bg-[#F1ECE3] p-2.5 text-xs leading-relaxed text-[#4B4238]">
          {info}
        </p>
      )}
    </div>
  );
}
