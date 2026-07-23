import { formatKES } from "@/lib/budget";
import type { FulizaTax } from "@/lib/journey";

/**
 * Rule Block A output: the estimated money lost to daily compounding
 * digital-overdraft fees for the user's income tier.
 */
export default function FulizaTaxCounter({ fulizaTax }: { fulizaTax: FulizaTax }) {
  return (
    <section
      aria-label="Fuliza tax counter"
      className="rounded-2xl border-2 border-danger bg-danger-soft p-5"
    >
      <h2 className="text-sm font-semibold uppercase tracking-wide text-danger">
        Your estimated &ldquo;Fuliza tax&rdquo;
      </h2>
      <p className="mt-2 text-3xl font-semibold text-danger">
        {formatKES(fulizaTax.estAnnualCost)}
        <span className="text-base font-normal text-ink-soft"> / year</span>
      </p>
      <p className="mt-1 text-sm text-ink-soft">
        ≈ {formatKES(fulizaTax.estMonthlyCost)} every month in overdraft fees, assuming a typical{" "}
        {formatKES(fulizaTax.estOutstanding)} balance carried ~20 days a month at daily rates
        (~{formatKES(fulizaTax.dailyFee)}/day). That money buys nothing — it just rents your own
        salary back to you.
      </p>
    </section>
  );
}
