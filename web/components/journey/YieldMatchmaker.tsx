import type { Vehicle } from "@/lib/journey";
import { CURRENT_INFLATION } from "@/lib/journey";

function VehicleCard({ vehicle, matched }: { vehicle: Vehicle; matched: boolean }) {
  return (
    <div
      className={`rounded-2xl p-5 ${
        matched ? "border-2 border-accent bg-accent-soft" : "border border-border bg-white"
      }`}
    >
      {matched && (
        <span className="mb-2 inline-block rounded-full bg-accent px-3 py-1 text-xs font-semibold text-ink">
          ★ Matched to your goal
        </span>
      )}
      <h3 className="text-base font-semibold text-primary">{vehicle.name}</h3>
      <p className="mt-0.5 text-xs text-faint">e.g. {vehicle.examples.join(", ")}</p>

      <dl className="mt-3 space-y-2 text-sm">
        <div className="flex items-start justify-between gap-3">
          <dt className="shrink-0 text-faint">Entry from</dt>
          <dd className="text-right font-medium text-ink">{vehicle.minEntry}</dd>
        </div>
        <div className="flex items-start justify-between gap-3">
          <dt className="shrink-0 text-faint">Access speed</dt>
          <dd className="text-right font-medium text-ink">{vehicle.liquidity}</dd>
        </div>
        <div className="flex items-start justify-between gap-3">
          <dt className="shrink-0 text-faint">Expected yield</dt>
          <dd className="text-right font-medium text-success">{vehicle.yieldRange}</dd>
        </div>
      </dl>

      <ul className="mt-3 space-y-1 border-t border-border pt-3 text-xs text-ink-soft">
        {vehicle.valueProps.map((prop) => (
          <li key={prop}>• {prop}</li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Component 1 — the "Yield Matchmaker" matrix: the matched vehicle first,
 * alternatives alongside for explicit contrast on entry, liquidity and
 * yield vs inflation.
 */
export default function YieldMatchmaker({
  match,
  alternatives,
  suppressedNote,
}: {
  match: Vehicle;
  alternatives: Vehicle[];
  suppressedNote: string | null;
}) {
  return (
    <section aria-label="Yield Matchmaker">
      <h2 className="text-base font-semibold text-primary">Where your money should live</h2>
      <p className="mt-1 text-xs text-ink-soft">
        Matched to your goal and timeline. Inflation is running at ~
        {(CURRENT_INFLATION * 100).toFixed(1)}% — anything yielding less is quietly shrinking.
      </p>
      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <VehicleCard vehicle={match} matched />
        {alternatives.map((vehicle) => (
          <VehicleCard key={vehicle.id} vehicle={vehicle} matched={false} />
        ))}
      </div>
      {suppressedNote && <p className="mt-3 text-xs text-accent-ink">{suppressedNote}</p>}
    </section>
  );
}
