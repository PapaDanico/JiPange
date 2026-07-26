"use client";

import Link from "next/link";
import { formatKES } from "@/lib/budget";
import { EMPTY_GOALS, getStoredGoals, removeStoredGoal } from "@/lib/storage";
import { useStorageValue } from "@/lib/hooks";

/**
 * Saved goals from the planners, shown on the Pesa Picture so the monthly
 * commitments live next to the savings capacity they draw from.
 */
export default function MyGoals({ savingsCapacity }: { savingsCapacity: number }) {
  const goals = useStorageValue(getStoredGoals, () => EMPTY_GOALS);

  // removeStoredGoal's write already notifies subscribers, so `goals` above
  // re-renders with the fresh list on its own — no manual re-fetch needed.
  function handleRemove(goalType: string) {
    removeStoredGoal(goalType);
  }

  if (goals.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-primary">My goals</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Turn this capacity into commitments — plan school fees, a home deposit, an emergency
          fund, retirement or business capital.
        </p>
        <Link
          href="/planners"
          className="mt-3 inline-flex h-11 items-center justify-center rounded-full bg-accent px-5 text-sm font-medium text-ink transition-colors hover:bg-accent-deep"
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
        <Link href="/planners" className="inline-flex min-h-11 items-center text-xs font-medium text-primary underline">
          + Add a goal
        </Link>
      </div>

      <ul className="mt-4 space-y-3">
        {goals.map((goal) => (
          <li
            key={goal.goalType}
            className="flex items-center justify-between gap-3 rounded-xl bg-[#FAF7F0] p-3"
          >
            <Link href={`/planners/${goal.goalType.split("-")[0]}`} className="flex min-w-0 items-center gap-3">
              <span className="text-xl" aria-hidden="true">
                {goal.emoji}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-primary">
                  {goal.title}
                </span>
                <span className="block text-xs text-ink-soft">
                  {formatKES(goal.requiredMonthly)}/mo · {formatKES(goal.nominalTarget)} in{" "}
                  {goal.years} {goal.years === 1 ? "yr" : "yrs"}
                </span>
              </span>
            </Link>
            <button
              type="button"
              onClick={() => handleRemove(goal.goalType)}
              aria-label={`Remove ${goal.title} goal`}
              className="shrink-0 rounded-full border border-border px-2.5 py-1 text-xs text-faint hover:bg-canvas"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-4 border-t border-border pt-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-ink-soft">Total monthly commitment</span>
          <span className={`font-semibold ${overCommitted ? "text-danger" : "text-success"}`}>
            {formatKES(totalMonthly)}/mo
          </span>
        </div>
        {savingsCapacity > 0 && (
          <p className={`mt-1 text-xs ${overCommitted ? "text-danger" : "text-ink-soft"}`}>
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
