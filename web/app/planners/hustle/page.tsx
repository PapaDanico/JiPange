import type { Metadata } from "next";
import Link from "next/link";
import HustleSmoother from "@/components/planners/HustleSmoother";

export const metadata: Metadata = {
  title: "Cycle Venture Planner — JiPange",
  description:
    "Turn lumpy cycle payouts from poultry, farming or agribusiness into a steady monthly salary — with next cycle's seed capital always protected.",
};

export default function HustlePlannerPage() {
  return (
    <div className="flex flex-1 flex-col items-center px-6 py-12">
      <div className="w-full max-w-md">
        <Link href="/planners" className="text-xs font-medium text-primary underline">
          ← All planners
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-primary">🌾 Cycle Venture Planner</h1>
        <p className="mt-1 text-sm text-[#4B4238]">
          Lumpy cycle payouts in, steady monthly salary out — seed capital protected for the next round.
        </p>
      </div>
      <div className="mt-8 w-full max-w-md">
        <HustleSmoother />
      </div>
    </div>
  );
}
