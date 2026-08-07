"use client";

import Link from "next/link";
import { formatKES } from "@/lib/budget";
import {
  buildAllocationMap,
  buildCashFlow,
  type AllocationBucket,
  type CashFlow,
} from "@/lib/dashboard";
import { useStorageValue } from "@/lib/hooks";
import { attribution, daysSinceRefresh, isStale } from "@/lib/rates-feed";
import { EMPTY_GOALS, getStoredCalculations, getStoredGoals } from "@/lib/storage";

/**
 * The unified view: one waterfall from take-home pay down to unallocated
 * money, then a map of where the committed part should sit by when it is
 * needed.
 *
 * This page treats the six planners as claims on ONE pot, which is the thing
 * none of them can see from inside. Each grades itself against the full
 * savings capacity, so five "comfortable" goals can add up to three times what
 * the reader has — see lib/dashboard.ts for why that is the defect this
 * exists to close.
 *
 * Everything is read from localStorage. No figure on this page is typed here:
 * the cash flow comes from the stored profile's own tax computation, and the
 * benchmark yields come from the published rates feed.
 */

function Row({
  label,
  amount,
  note,
  tone = "plain",
}: {
  label: string;
  amount: number;
  note?: string;
  tone?: "plain" | "out" | "good" | "bad";
}) {
  const colour =
    tone === "out" ? "text-ink-soft" : tone === "good" ? "text-success" : tone === "bad" ? "text-danger" : "text-primary";
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <span className="min-w-0">
        <span className="block text-sm text-ink-soft">{label}</span>
        {note && <span className="block text-xs text-faint">{note}</span>}
      </span>
      <span className={`shrink-0 text-sm font-semibold tabular-nums ${colour}`}>
        {tone === "out" ? "−" : ""}
        {formatKES(Math.abs(amount))}
      </span>
    </div>
  );
}

function Waterfall({ flow }: { flow: CashFlow }) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="text-base font-semibold text-primary">Net cash flow</h2>
      {/* "Where every shilling is already spoken for" read as OBSERVED
        * spending. It is not: livingCost is the budget model's fixed
        * 50/15/15 of take-home pay, the one figure here that comes from no
        * input the reader gave us — and it was the one framed most
        * confidently. Take-home pay and the goal commitments are real. */}
      <p className="mt-1 text-sm text-ink-soft">
        Your take-home pay against a budget model, each month.
      </p>

      <div className="mt-4 divide-y divide-border">
        <Row label="Take-home pay" amount={flow.netMonthly} note="after PAYE, NSSF, SHIF and the housing levy" />
        <Row
          label="Living costs"
          amount={flow.livingCost}
          note="assumed — 80% of take-home on needs, social obligations and wants, not your actual spending"
          tone="out"
        />
        <Row label="Savings capacity" amount={flow.savingsCapacity} note="what the budget leaves to commit" />
        <Row
          label="Committed to goals"
          amount={flow.committed}
          note="the planners' required monthly contributions, added up"
          tone="out"
        />
        <Row
          label={flow.overCommitted ? "Short by" : "Unallocated"}
          amount={flow.overCommitted ? flow.shortfall : flow.unallocated}
          note={
            flow.overCommitted
              ? "your goals ask for more than the budget leaves"
              : "capacity no goal has claimed yet"
          }
          tone={flow.overCommitted ? "bad" : "good"}
        />
      </div>

      {flow.overCommitted ? (
        <p className="mt-4 rounded-xl bg-danger/10 p-3 text-sm text-danger">
          Your goals together need {formatKES(flow.committed)}/mo against a capacity of{" "}
          {formatKES(flow.savingsCapacity)}. Each planner graded itself against the whole
          capacity, so several may have read &ldquo;comfortable&rdquo; on their own. Stretch a
          timeline or shrink a target in the planner that matters least.
        </p>
      ) : flow.commitmentShare === null ? (
        <p className="mt-4 text-xs text-faint">
          Your budget leaves nothing to commit yet, so there is no share to quote.
        </p>
      ) : (
        <p className="mt-4 text-sm text-ink-soft">
          Your goals claim {Math.round(flow.commitmentShare * 100)}% of your savings capacity,
          leaving {formatKES(flow.unallocated)}/mo unallocated.
        </p>
      )}

      {/* Stated, not implied. Loan repayments are a real monthly outflow and
        * the debt tools persist nothing this page can read, so "unallocated"
        * is an upper bound for anybody servicing a loan. Quoting it as though
        * it were the last word is the kind of confident wrong figure this
        * codebase keeps finding in itself. */}
      <p className="mt-3 text-xs text-faint">
        Loan repayments are not deducted here — the debt tools keep their own numbers. If you are
        servicing a loan, treat the figure above as the most that could be free, not what is.
      </p>
    </section>
  );
}

function formatRate(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

/**
 * A range when the horizon spans several auction bands, a point when it does
 * not. A bucket covering three bands does not have one rate, and rendering a
 * midpoint would claim a precision the auctions never had.
 */
function formatBenchmark(b: { low: number; high: number }): string {
  return b.low === b.high
    ? formatRate(b.low)
    : `${(b.low * 100).toFixed(1)}\u2013${formatRate(b.high)}`;
}

function Bucket({ bucket }: { bucket: AllocationBucket }) {
  const { horizon, goals, monthly, share, benchmark } = bucket;
  const empty = goals.length === 0;

  return (
    <li className={`rounded-xl p-4 ${empty ? "bg-canvas" : "bg-[#FAF7F0]"}`}>
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold text-primary">{horizon.label}</h3>
        {!empty && (
          <span className="shrink-0 text-sm font-semibold tabular-nums text-primary">
            {formatKES(monthly)}/mo
            {share !== null && (
              <span className="ml-1 text-xs font-normal text-faint">
                ({Math.round(share * 100)}%)
              </span>
            )}
          </span>
        )}
      </div>

      <p className="mt-1 text-sm text-ink-soft">{horizon.vehicle}</p>
      <p className="mt-0.5 text-xs text-faint">{horizon.why}</p>

      {benchmark ? (
        <p className="mt-2 text-xs text-ink-soft">
          Benchmark {formatBenchmark(benchmark)}{" "}
          <span className="text-faint">
            — {benchmark.label},{" "}
            {benchmark.basis === "net" ? "net of 15% withholding tax" : "before withholding tax"}
          </span>
        </p>
      ) : (
        /* The feed refuses to quote a band with too few auctions. Borrowing a
         * neighbouring band's figure would put a term the reader is not buying
         * behind a number they would act on. */
        <p className="mt-2 text-xs text-faint">
          No published benchmark for this term right now — too few recent auctions to quote one.
        </p>
      )}

      {empty ? (
        <p className="mt-2 text-xs text-faint">
          Nothing planned for this horizon.
          {horizon.key === "now" && " That is where emergency money lives."}
        </p>
      ) : (
        <ul className="mt-2 space-y-1">
          {goals.map((goal) => (
            <li key={goal.goalType} className="flex items-baseline justify-between gap-3 text-xs">
              <Link
                href={`/planners/${goal.goalType.split("-")[0]}`}
                className="min-w-0 truncate text-primary underline"
              >
                <span aria-hidden="true">{goal.emoji}</span> {goal.title}
              </Link>
              <span className="shrink-0 tabular-nums text-ink-soft">
                {formatKES(goal.requiredMonthly)}/mo · in {goal.years}{" "}
                {goal.years === 1 ? "yr" : "yrs"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

function EmptyState({ reason }: { reason: "no-profile" | "no-goals" }) {
  const copy =
    reason === "no-profile"
      ? {
          title: "The map starts with your take-home pay",
          body: "Enter a profile and we compute PAYE, NSSF, SHIF and the housing levy, then show what the budget leaves to commit.",
          href: "/profile",
          cta: "Take the 90-second check →",
        }
      : {
          title: "Nothing committed yet",
          body: "Save a goal from any planner and it lands here — mapped to the horizon its money can actually sit in.",
          href: "/planners",
          cta: "Open the goal planners →",
        };
  return (
    <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
      <h2 className="text-lg font-semibold text-primary">{copy.title}</h2>
      <p className="mt-1 text-sm text-ink-soft">{copy.body}</p>
      <Link
        href={copy.href}
        className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-accent px-6 text-sm font-medium text-ink transition-colors hover:bg-accent-deep"
      >
        {copy.cta}
      </Link>
    </div>
  );
}

export default function CashFlowMap() {
  const calculations = useStorageValue(getStoredCalculations, () => null);
  const goals = useStorageValue(getStoredGoals, () => EMPTY_GOALS);

  const flow = buildCashFlow(calculations, goals);
  const buckets = buildAllocationMap(goals);

  if (!flow) return <EmptyState reason="no-profile" />;

  return (
    <div className="w-full max-w-2xl space-y-6">
      <Waterfall flow={flow} />

      {goals.length === 0 ? (
        <EmptyState reason="no-goals" />
      ) : (
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-primary">Liquidity allocation</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Grouped by when the money is needed, because that — not the kind of goal — decides
            where it can sit.
          </p>
          <ul className="mt-4 space-y-3">
            {buckets.map((bucket) => (
              <Bucket key={bucket.horizon.key} bucket={bucket} />
            ))}
          </ul>
          <p className="mt-4 text-xs text-faint">
            Benchmarks from the {attribution()},{" "}
            {daysSinceRefresh() === 0
              ? "refreshed today"
              : `refreshed ${daysSinceRefresh()} ${daysSinceRefresh() === 1 ? "day" : "days"} ago`}
            {isStale() && " — old enough that they should be treated as indicative"}. Each figure
            is labelled with its tax basis above: only the bill rate is net of the 15% withholding,
            because it is the only one the feed publishes after tax.
          </p>
        </section>
      )}
    </div>
  );
}
