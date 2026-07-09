import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found — JiPange",
};

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <p className="text-5xl">🔍</p>
      <h1 className="mt-4 text-2xl font-semibold text-primary">Page not found</h1>
      <p className="mt-2 max-w-xs text-sm text-[#4B4238]">
        That link doesn&apos;t exist. Try one of the calculators below.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/tools"
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90"
        >
          Browse all calculators
        </Link>
        <Link
          href="/"
          className="rounded-xl border border-[#E5E0D8] bg-white px-5 py-2.5 text-sm font-medium text-primary hover:bg-[#F1ECE3]"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
