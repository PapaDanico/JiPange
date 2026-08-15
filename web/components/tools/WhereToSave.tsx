"use client";

/**
 * Where to put savings — the ranking, and the thing that must not be in it.
 *
 * The layout is the argument. Everything `comparable()` returns shares an axis
 * because it shares a definition: interest, withholding tax at 15%, an annual
 * rate we hold live and dated. It can be ranked and the ranking means what it
 * looks like it means.
 *
 * What `sideNotes()` returns sits BELOW that, visually separated, in its own
 * frame, carrying its range and its date and the guarantee gap. It is not a row
 * and it does not get a position. A SACCO's 8-15% placed at the top of a list
 * beside a dated Treasury bill would win the page without having won anything —
 * it is a wider, older, differently-taxed, unguaranteed number about a
 * different instrument, and the table would have done the arguing.
 *
 * The caveats come from the module, not from this file. `sideNotes()` attaches
 * them to the figure by construction precisely so a component cannot render one
 * without the other, and this component deliberately does not get a say.
 */

import { comparable, sideNotes, mmfIsIndependent } from "@/lib/where-to-save";
import { SPREAD_CONFIDENCE_PP } from "@/lib/mmf-vs-tbill";

const pct = (v: number) => `${v.toFixed(2)}%`;

export default function WhereToSave() {
  const options = comparable();
  const notes = sideNotes();
  const independent = mmfIsIndependent();

  if (!options.length) {
    return (
      <p className="text-sm text-muted">
        The published rates could not be read, so nothing is ranked. Showing a guess here would
        be worse than showing nothing.
      </p>
    );
  }

  const best = options[0];
  const tied = options.filter((o) => o.tiedWithBest);
  /* When EVERYTHING is inside the margin there is no ranking to report, only a
     spread too narrow to read. Today that is the case: 7.67% to 7.76% is 0.09
     percentage points against a 0.35 margin. Badging every row "level" is noise
     — the sentence below says it once — and calling the table "highest first"
     would imply an order the numbers cannot support. */
  const allLevel = tied.length === options.length;

  return (
    <div className="space-y-6">
      <section aria-labelledby="ranked-heading">
        <h2 id="ranked-heading" className="text-lg font-semibold text-ink">
          What these pay, after tax
        </h2>
        <p className="mt-1 text-sm text-ink-soft">
          All of these are interest, all taxed at 15% withholding, all quoted as an annual rate —
          so they can be compared directly.{" "}
          {allLevel
            ? "Today they are all within a whisker of each other, so the order below is not a ranking."
            : "Highest first."}
        </p>

        {/* SCROLLABLE IS NOT THE SAME AS DISCOVERABLE.
         *
         * Measured at 390px, the width of the phone most of these readers are
         * on: this table is 956px of content in a 342px window. `overflow-x-auto`
         * means it scrolls and the page itself does not, which is the correct
         * mechanism and was already right. What was missing is any sign that
         * there is more.
         *
         * Three of the five columns sit off-screen, and the two that vanish are
         * "Locked up" and "Backed by" — the difference between a 364-day bill
         * and a money market fund, on a page whose entire purpose is that
         * comparison. A reader sees the after-tax rates, sees them land within
         * a whisker of each other, and has no reason to suspect the columns
         * that actually distinguish the options exist.
         *
         * The fix is the classic scroll-shadow: four background layers, two
         * solid "covers" pinned with background-attachment:local so they travel
         * with the content, and two gradients pinned to the container so they
         * are revealed only when there is more in that direction. Pure CSS —
         * no scroll listener, no JS, nothing to run on a slow device — and it
         * disappears at sm: where the table fits.
         *
         * A hint that lies is worse than none, which is why this is geometry
         * rather than a static "scroll →": it cannot claim there is more to see
         * once you have reached the end. */}
        <div
          className="mt-3 overflow-x-auto [background-attachment:local,local,scroll,scroll] [background-position:left_center,right_center,left_center,right_center] [background-repeat:no-repeat] [background-size:24px_100%,24px_100%,22px_100%,22px_100%] [background-image:linear-gradient(to_right,var(--surface,#fff),transparent),linear-gradient(to_left,var(--surface,#fff),transparent),linear-gradient(to_right,rgba(0,0,0,0.16),transparent),linear-gradient(to_left,rgba(0,0,0,0.16),transparent)]"
        >
          <table className="min-w-full whitespace-nowrap text-left text-sm">
            <thead className="text-xs text-faint">
              <tr>
                <th className="py-2 pr-4 font-medium">Where</th>
                <th className="py-2 pr-4 font-medium">After tax</th>
                <th className="py-2 pr-4 font-medium">Before tax</th>
                <th className="py-2 pr-4 font-medium">Locked up</th>
                <th className="py-2 font-medium">Backed by</th>
              </tr>
            </thead>
            <tbody className="text-ink-soft">
              {options.map((o) => (
                <tr key={o.key} className="border-t border-border align-top">
                  <td className="py-2 pr-4 font-medium text-ink">
                    {o.label}
                    {o.basis === "assumed" && (
                      /* An assumed figure must not sit in a table of published
                         ones wearing the same clothes. No MMF publishes a rate
                         on the terms the government does. */
                      <span className="block text-[11px] font-normal text-faint">
                        our estimate, not a published rate
                      </span>
                    )}
                  </td>
                  <td className="py-2 pr-4 font-semibold tabular-nums text-ink">
                    {pct(o.netPct)}
                    {o.tiedWithBest && tied.length > 1 && !allLevel && (
                      /* Marked, not silently ordered. These sit inside the
                         margin the sister module calls "too close to call", so
                         their position in the sort is not a result. */
                      <span className="block text-[11px] font-normal text-faint">level</span>
                    )}
                  </td>
                  <td className="py-2 pr-4 tabular-nums text-faint">{pct(o.grossPct)}</td>
                  <td className="py-2 pr-4">{o.lockUp}</td>
                  <td className="py-2">{o.backing}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!independent && (
          /* THE HONEST FOOTNOTE ON OUR OWN NUMBER.
             MMF_SPREAD_OVER_TBILL_PCT is 0.0, so the assumed money market yield
             IS the 91-day bill's. Printing a winner between two identical
             numbers is a coin toss dressed as analysis, and the reader is owed
             that rather than left to infer it from a tie. */
          <p className="mt-3 rounded-lg bg-canvas px-3 py-2 text-xs text-ink-soft">
            We currently assume a money market fund returns the same as the 91-day Treasury bill.
            Their gross yields are therefore identical, and the small difference you may see after
            tax is a methodology gap — an MMF quotes a nominal annual rate while a bill quotes an
            effective annual yield, so tax lands over different periods. It is not a finding about
            either product.
          </p>
        )}

        <p className="mt-3 text-sm text-ink-soft">
          {tied.length > 1 ? (
            <>
              On today&apos;s figures {allLevel ? "every option here is" : "the top "}
              {!allLevel && <strong className="tabular-nums">{tied.length}</strong>}
              {!allLevel && " are"} level — within{" "}
              <span className="tabular-nums">{SPREAD_CONFIDENCE_PP}</span> percentage points of
              each other, which is closer than these figures can reliably separate. Choose on
              lock-up and access, not on the rate.
            </>
          ) : (
            <>
              On today&apos;s figures the highest after-tax rate here is{" "}
              <strong className="tabular-nums">{pct(best.netPct)}</strong> from {best.label}.
            </>
          )}{" "}
          All of it is before inflation — what it leaves you in real terms is a different and
          smaller number.
        </p>

        <p className="mt-2 text-xs text-faint">
          Government bonds are deliberately not in this table. A bond&apos;s return depends on the
          price you pay and how long you hold it, and putting a fifteen-year commitment in a row
          beside a three-month bill invites a comparison the number cannot support.
        </p>
      </section>

      {notes.map((n) => (
        <section
          key={n.key}
          aria-labelledby={`aside-${n.key}`}
          className="rounded-2xl border border-border-strong bg-canvas p-4"
        >
          <h2 id={`aside-${n.key}`} className="text-base font-semibold text-ink">
            {n.label} — why this is not in the table above
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            Commonly{" "}
            <strong className="tabular-nums">
              {n.lowPct}%–{n.highPct}%
            </strong>{" "}
            across the sector, as of {n.asOf}.
          </p>
          <ul className="mt-2 space-y-1.5 text-sm text-ink-soft">
            {n.whyApart.map((w) => (
              <li key={w} className="ml-4 list-disc">
                {w}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-faint">Source: {n.source}</p>
        </section>
      ))}
    </div>
  );
}
