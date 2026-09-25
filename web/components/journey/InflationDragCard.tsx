import { formatKES } from "@/lib/budget";
import {
  BANK_NET_YIELD,
  CURRENT_INFLATION,
  MMF_NET_YIELD,
  type InflationDrag,
} from "@/lib/journey";
import { CBK_BSAR_2025_CITE } from "@/lib/kenya-stats";

/**
 * Rule Block B output: how the average bank deposit keeps pace with inflation
 * after tax, and the MMF upside. Every rate after tax, every rate sourced.
 */
export default function InflationDragCard({ drag }: { drag: InflationDrag }) {
  return (
    <section
      aria-label="Inflation drag"
      className="rounded-2xl border-2 border-accent bg-accent-soft p-5"
    >
      <h2 className="text-sm font-semibold uppercase tracking-wide text-accent-ink">
        Keeping pace with inflation
      </h2>
      {/* After tax on every side, and honest in both directions. This read
          "The silent inflation drag", compared a GROSS 3.23% (unsourced)
          against inflation, and had no wording for a bank that keeps pace —
          at CBK's measured rate it would have printed "−Ksh −1,234". */}
      <p className="mt-2 text-sm text-ink-soft">
        The average bank deposit keeps about {(BANK_NET_YIELD * 100).toFixed(2)}% after tax, while
        inflation runs at {(CURRENT_INFLATION * 100).toFixed(1)}%. On an estimated{" "}
        {formatKES(drag.medianSavings)} in savings,
        {drag.bankTrailsInflation ? " that is" : " that stays roughly level —"}
      </p>
      {drag.bankTrailsInflation ? (
        <p className="mt-1 text-3xl font-semibold text-danger">
          −{formatKES(drag.netLossAnnual)}
          <span className="text-base font-normal text-ink-soft"> of buying power a year</span>
        </p>
      ) : (
        <p className="mt-1 text-base font-semibold text-primary">
          no loss of buying power, but little growth either.
        </p>
      )}
      <div className="mt-3 rounded-xl bg-white p-3 text-sm text-ink-soft">
        <p>
          <span className="font-semibold text-success">+{drag.upsidePoints} points</span> is
          available by moving to a money market fund: at about{" "}
          {(MMF_NET_YIELD * 100).toFixed(1)}% after tax, the same money earns roughly{" "}
          <span className="font-semibold text-success">
            {formatKES(drag.mmfExtraAnnual)} more a year
          </span>{" "}
          and grows ahead of inflation.
        </p>
        <p className="mt-2 text-xs text-muted">
          Bank benchmark: {CBK_BSAR_2025_CITE}, average deposit rate, Dec 2025. Many savings
          accounts pay less than the average.
        </p>
      </div>
    </section>
  );
}
