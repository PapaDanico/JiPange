import type { Metadata } from "next";
import Link from "next/link";
import PlanView from "@/components/onboarding/PlanView";

export const metadata: Metadata = {
  title: "My Action Plan",
  description:
    "Your money roadmap: a first milestone, exact execution steps for the right Kenyan vehicle, and an AI plan when you want shilling-exact numbers.",
};

export default function PlanPage() {
  return (
    <div className="flex flex-1 flex-col items-center px-6 py-12">
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-semibold text-primary">My Action Plan</h1>
        <p className="mt-1 text-sm text-ink-soft">
          A first milestone, the exact steps to execute it, and who to open the account with.
        </p>
      </div>
      <div className="mt-6 w-full flex justify-center">
        <PlanView />
      </div>
      <div className="mt-8 w-full max-w-2xl rounded-2xl border-2 border-accent bg-accent-soft p-6 text-center">
        <p className="text-sm font-medium text-primary">Have a specific goal in mind?</p>
        <p className="mt-1 text-xs text-ink-soft">
          School fees, a home deposit, an emergency fund — pick the goal and we&apos;ll reverse-engineer
          the monthly plan.
        </p>
        <Link
          href="/planners"
          className="mt-3 inline-flex h-10 items-center justify-center rounded-full bg-primary px-5 text-sm font-medium text-white transition-colors hover:bg-primary-deep"
        >
          Open the goal planners
        </Link>
      </div>
      <div className="mt-4 w-full max-w-2xl rounded-2xl bg-white p-6 text-center shadow-sm">
        <p className="text-sm font-medium text-primary">Want to model a specific scenario?</p>
        <p className="mt-1 text-xs text-ink-soft">
          Try our free calculators for loans, savings goals, FIRE, and more.
        </p>
        <Link
          href="/tools"
          className="mt-3 inline-flex h-10 items-center justify-center rounded-full bg-accent px-5 text-sm font-medium text-ink transition-colors hover:bg-accent-deep"
        >
          Explore calculators
        </Link>
      </div>
    </div>
  );
}
