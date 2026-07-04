"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatKES } from "@/lib/budget";
import { getStoredGoals, removeStoredGoal, type SavedGoal } from "@/lib/storage";

/**
 * Saved goals from the planners, shown on the Pesa Picture so the monthly
 * commitments live next to the savings capacity they draw from.
 */
export default function MyGoals({ savingsCapacity }: { savingsCapacity: number }) {
  const [goals, setGoals] = useState<SavedGoal[]>([]);

  // Read after mount — localStorage isn't available during SSR.
  useEffect(() => {
    setGoals(getStoredGoals());
  }, []);

  function handleRemove(goalType: string) {
    removeStoredGoal(goalType);
    setGoals(getStoredGoals());
  }

  if (goals.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-primary">My goals</h2>
        <p className="mt-1 text-sm text-[#4B4238]">
          Turn this capacity into commitments — plan school fees, a home deposit, an emergency
          fund, retirement or business capital.
        </p>
        <Link
          href="/planners"
          className="mt-3 inline-flex h-10 items-center justify-center rounded-full bg-accent px-5 text-sm font-medium text-[#171717] transition-colors hover:bg-[#d6961f]"
        >
          Open the goal planners →
        </Link>
      </div>
    );
  }

  const totalMonthly = goals.reduce((sum, goal) => sum + goal.requiredMonthly, 0);
  const overCommitted = savingsCapacity > 0 && totalMonthly > savingsCapacity;

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-primary">My goals</h2>
        <Link href="/planners" className="text-xs font-medium text-primary underline">
          + Add a goal
        </Link>
      </div>

      <ul className="mt-4 space-y-3">
        {goals.map((goal) => (
          <li
            key={goal.goalType}
            className="flex items-center justify-between gap-3 rounded-xl bg-[#FAF7F0] p-3"
          >
            <Link href={`/planners/${goal.goalType}`} className="flex min-w-0 items-center gap-3">
              <span className="text-xl" aria-hidden="true">
                {goal.emoji}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-primary">
                  {goal.title}
                </span>
                <span className="block text-xs text-[#4B4238]">
                  {formatKES(goal.requiredMonthly)}/mo · {formatKES(goal.nominalTarget)} in{" "}
                  {goal.years} {goal.years === 1 ? "yr" : "yrs"}
                </span>
              </span>
            </Link>
            <button
              type="button"
              onClick={() => handleRemove(goal.goalType)}
              aria-label={`Remove ${goal.title} goal`}
              className="shrink-0 rounded-full border border-[#E5E0D8] px-2.5 py-1 text-xs text-[#6f6e69] hover:bg-[#F1ECE3]"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-4 border-t border-[#E5E0D8] pt-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-[#4B4238]">Total monthly commitment</span>
          <span className={`font-semibold ${overCommitted ? "text-danger" : "text-success"}`}>
            {formatKES(totalMonthly)}/mo
          </span>
        </div>
        {savingsCapacity > 0 && (
          <p className={`mt-1 text-xs ${overCommitted ? "text-danger" : "text-[#4B4238]"}`}>
            {overCommitted
              ? `That's ${formatKES(totalMonthly - savingsCapacity)} above your ${formatKES(
                  savingsCapacity
                )}/mo capacity — revisit a goal's timeline or target.`
              : `${Math.round((totalMonthly / savingsCapacity) * 100)}% of your ${formatKES(
                  savingsCapacity
                )}/mo savings capacity.`}
          </p>
        )}
      </div>
    </div>
  );
}
