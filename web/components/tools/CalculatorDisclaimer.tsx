import { dueForReview, statuteLine, statuteNotes } from "@/lib/statutes";
import { type TariffKey, tariffLine, tariffsDueForReview } from "@/lib/tariffs";

/**
 * The footer under twenty-two calculators.
 *
 * It used to open "Rates current as of July 2026." — a hand-typed date that
 * disagreed with the one in lib/tax.ts by five months and was checked by
 * nothing. Past the day a Finance Act changed a band it would have gone on
 * asserting currency, on every calculator, with no test able to notice.
 *
 * Both lines now come from lib/statutes.ts, and each instrument states its own
 * effective date rather than sheltering under one aggregate — see the note
 * there on why no single date is honest across four amendment cadences. When
 * an instrument passes its review date it is named in the caution line below,
 * so the page stops implying something nobody has confirmed.
 *
 * `tariffs` extends the same treatment to commercial prices, which had no
 * staleness gate at all until lib/tariffs.ts. It is opt-in per calculator
 * rather than global, because the statutory instruments genuinely do apply to
 * every payroll tool while a tariff applies only to the calculator that prices
 * on it — a Fuliza warning under a PAYE result would be noise, and noise is how
 * a caution line stops being read.
 */
export default function CalculatorDisclaimer({
  extraNotes,
  tariffs,
}: {
  extraNotes?: string[];
  tariffs?: readonly TariffKey[];
}) {
  const stale = dueForReview();
  const staleTariffs = tariffs ? tariffsDueForReview(tariffs) : [];

  return (
    <div className="space-y-1 text-xs text-ink-soft">
      {stale.length > 0 && (
        <p className="text-amber-700 dark:text-amber-500">
          Due for re-check against the current law:{" "}
          {stale.map((s) => s.governs).join("; ")}. Confirm these against your payslip
          before relying on them.
        </p>
      )}
      {staleTariffs.length > 0 && (
        <p className="text-amber-700 dark:text-amber-500">
          Due for re-check against the provider&rsquo;s current pricing:{" "}
          {staleTariffs.map((t) => t.product).join("; ")}. A provider can reprice at any
          time, so confirm before relying on these figures.
        </p>
      )}
      <p>Sources: {statuteLine()}.</p>
      {tariffs && tariffs.length > 0 && <p>Pricing: {tariffLine(tariffs)}.</p>}
      {statuteNotes().map((note) => (
        <p key={note}>{note}</p>
      ))}
      {extraNotes?.map((note) => (
        <p key={note}>{note}</p>
      ))}
      <p>
        For guidance only. Verify against your payslip and check your exact figures at{" "}
        <a
          href="https://itax.kra.go.ke"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-primary"
        >
          itax.kra.go.ke
        </a>
        .
      </p>
    </div>
  );
}
