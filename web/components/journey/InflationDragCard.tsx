import { formatKES } from "@/lib/budget";
import {
  ASSUMED_CURRENT_YIELD,
  CURRENT_INFLATION,
  TARGET_MMF_YIELD,
  type InflationDrag,
} from "@/lib/journey";

/**
 * Rule Block B output: the explicit loss of local purchasing power for
 * money parked at bank/M-Pesa yields, and the MMF upside swing.
 */
export default function InflationDragCard({ drag }: { drag: InflationDrag }) {
  return (
    <section
      aria-label="Inflation drag"
      className="rounded-2xl border-2 border-accent bg-[#FFF8EA] p-5"
    >
      <h2 className="text-sm font-semibold uppercase tracking-wide text-[#946213]">
        The silent inflation drag
      </h2>
      <p className="mt-2 text-sm text-[#4B4238]">
        Money in a standard bank account earns ~{(ASSUMED_CURRENT_YIELD * 100).toFixed(2)}% while
        inflation runs at ~{(CURRENT_INFLATION * 100).toFixed(1)}%. On an estimated{" "}
        {formatKES(drag.medianSavings)} sitting idle, that&apos;s
      </p>
      <p className="mt-1 text-3xl font-semibold text-danger">
        −{formatKES(drag.netLossAnnual)}
        <span className="text-base font-normal text-[#4B4238]"> of buying power / year</span>
      </p>
      <div className="mt-3 rounded-xl bg-white p-3 text-sm text-[#4B4238]">
        <p>
          <span className="font-semibold text-success">+{drag.upsidePoints}% yield swing</span>{" "}
          available now: at an MMF&apos;s ~{(TARGET_MMF_YIELD * 100).toFixed(1)}% baseline the
          same money earns about{" "}
          <span className="font-semibold text-success">
            {formatKES(drag.mmfExtraAnnual)}/year more
          </span>{" "}
          — beating inflation instead of feeding it.
        </p>
      </div>
    </section>
  );
}
