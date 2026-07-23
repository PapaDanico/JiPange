"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 animate-rise flex-col items-center justify-center px-6 py-24 text-center">
      <span
        aria-hidden="true"
        className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-soft"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-8 w-8 text-accent-ink"
        >
          <path d="M12 3 2.5 20h19L12 3Z" />
          <path d="M12 10v4" />
          <path d="M12 17.5h.01" />
        </svg>
      </span>
      <h1 className="mt-4 text-2xl font-semibold text-primary">Something went wrong</h1>
      <p className="mt-2 max-w-xs text-sm text-ink-soft">
        An unexpected error occurred. Your data is still saved locally — try refreshing.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90"
        >
          Try again
        </button>
        <Link
          href="/tools"
          className="rounded-xl border border-border bg-white px-5 py-2.5 text-sm font-medium text-primary hover:bg-canvas"
        >
          Go to calculators
        </Link>
      </div>
    </div>
  );
}
