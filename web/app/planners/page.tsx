import type { Metadata } from "next";
import Link from "next/link";
import { GOAL_CONFIGS, GOAL_TYPES } from "@/lib/goal-planner";

export const metadata: Metadata = {
  title: "Goal Planners — JiPange",
  description:
    "Start from your life goal and work backwards to a monthly plan: education, home deposit, emergency fund, and business capital planners for Kenya.",
};

export default function PlannersPage() {
  return (
    <div className="flex flex-1 flex-col items-center px-6 py-12">
      <div className="w-full max-w-5xl">
        <h1 className="text-2xl font-semibold text-primary lg:text-3xl">Goal Planners</h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-soft lg:text-base">
          Pick the goal. We reverse-engineer it into a monthly amount, check it against what you
          can actually afford, and show you where the money should live.
        </p>
      </div>

      <div className="mt-8 grid w-full max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                  <p className="mt-0.5 text-sm text-ink-soft">{config.tagline}</p>
                </div>
              </div>
            </Link>
          );
        })}
        <Link
          href="/planners/hustle"
          className="block rounded-2xl bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔄</span>
            <div>
              <h2 className="text-base font-semibold text-primary">Hustle Income Smoother</h2>
              <p className="mt-0.5 text-sm text-ink-soft">
                Turn lumpy poultry, farm or gig payouts into a steady monthly salary.
              </p>
            </div>
          </div>
        </Link>
      </div>

      <div className="mt-8 w-full max-w-2xl rounded-2xl bg-white p-6 text-center shadow-sm">
        <p className="text-sm font-medium text-primary">Not sure where to start?</p>
        <p className="mt-1 text-xs text-ink-soft">
          Build your Pesa Picture first — it tells you how much you can put toward goals each
          month.
        </p>
        <Link
          href="/profile/full"
          className="mt-3 inline-flex h-10 items-center justify-center rounded-full bg-accent px-5 text-sm font-medium text-ink transition-colors hover:bg-accent-deep"
        >
          Build my free plan
        </Link>
      </div>
    </div>
  );
}
