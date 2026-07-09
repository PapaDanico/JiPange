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
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <p className="text-5xl">⚠️</p>
      <h1 className="mt-4 text-2xl font-semibold text-primary">Something went wrong</h1>
      <p className="mt-2 max-w-xs text-sm text-[#4B4238]">
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
          className="rounded-xl border border-[#E5E0D8] bg-white px-5 py-2.5 text-sm font-medium text-primary hover:bg-[#F1ECE3]"
        >
          Go to calculators
        </Link>
      </div>
    </div>
  );
}
