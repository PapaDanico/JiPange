"use client";

/** Screen-only affordance for the one-page report flow. */
export default function PrintButton({ label = "Print / Save as PDF" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="h-11 w-full rounded-full border border-border text-sm font-medium text-ink-soft transition-colors hover:bg-canvas print:hidden"
    >
      {label}
    </button>
  );
}
