import { reportMailto } from "@/lib/report-error";

/**
 * "Something here looks wrong" — on every calculator.
 *
 * Deliberately quiet. This is not a call to action and should never compete
 * with the calculator for attention; it is the affordance a reader looks for
 * only once they already doubt a figure, and at that moment it needs to be
 * findable rather than prominent. Small text, no button, bottom of the column.
 *
 * `print:hidden` because a printed report is a document somebody keeps or
 * hands over, and a mail link is dead ink on paper.
 */
export default function ReportError({ title, path }: { title: string; path: string }) {
  return (
    <p className="mt-6 text-xs leading-relaxed text-ink-soft/80 print:hidden">
      Spotted a figure that looks wrong?{" "}
      <a
        href={reportMailto({ title, path })}
        className="underline decoration-ink-soft/40 underline-offset-2 hover:text-primary hover:decoration-primary"
      >
        Tell us what it should be
      </a>
      . Tax bands and rates change on somebody else&rsquo;s schedule — a reader with
      their own payslip catches a stale one faster than we do.
    </p>
  );
}
