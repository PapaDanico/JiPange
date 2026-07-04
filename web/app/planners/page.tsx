import type { Metadata } from "next";
import Link from "next/link";
import BrandHeader from "@/components/BrandHeader";
import { GOAL_CONFIGS, GOAL_TYPES } from "@/lib/goal-planner";

export const metadata: Metadata = {
  title: "Goal Planners — JiPange",
  description:
    "Start from your life goal and work backwards to a monthly plan: education, home deposit, emergency fund, and business capital planners for Kenya.",
};

export default function PlannersPage() {
  return (
    <div className="flex flex-1 flex-col items-center px-6 py-12">
      <div className="w-full max-w-md">
        <BrandHeader />
        <h1 className="text-2xl font-semibold text-primary">Goal Planners</h1>
        <p className="mt-1 text-sm text-[#4B4238]">
          Pick the goal. We reverse-engineer it into a monthly amount, check it against what you
          can actually afford, and show you where the money should live.
        </p>
      </div>

      <div className="mt-8 w-full max-w-md space-y-4">
        {GOAL_TYPES.map((type) => {
          const config = GOAL_CONFIGS[type];
          return (
            <Link
              key={type}
              href={`/planners/${type}`}
              className="block rounded-2xl bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{config.emoji}</span>
                <div>
                  <h2 className="text-base font-semibold text-primary">{config.title}</h2>
                  <p className="mt-0.5 text-sm text-[#4B4238]">{config.tagline}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-8 w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-sm">
        <p className="text-sm font-medium text-primary">Not sure where to start?</p>
        <p className="mt-1 text-xs text-[#4B4238]">
          Build your Pesa Picture first — it tells you how much you can put toward goals each
          month.
        </p>
        <Link
          href="/profile"
          className="mt-3 inline-flex h-10 items-center justify-center rounded-full bg-accent px-5 text-sm font-medium text-[#171717] transition-colors hover:bg-[#d6961f]"
        >
          Build my free plan
        </Link>
      </div>
    </div>
  );
}
