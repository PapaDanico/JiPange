import { dueForReview, statuteLine, statuteNotes } from "@/lib/statutes";

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
 */
export default function CalculatorDisclaimer({ extraNotes }: { extraNotes?: string[] }) {
  const stale = dueForReview();

  return (
    <div className="space-y-1 text-xs text-ink-soft">
      {stale.length > 0 && (
        <p className="text-amber-700 dark:text-amber-500">
          Due for re-check against the current law:{" "}
          {stale.map((s) => s.governs).join("; ")}. Confirm these against your payslip
          before relying on them.
        </p>
      )}
      <p>Sources: {statuteLine()}.</p>
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
