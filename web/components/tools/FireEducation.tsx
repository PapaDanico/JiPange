import Link from "next/link";
import {
  realYieldBoard,
  checkPlanningRatePremise,
} from "@/lib/fire-evidence";
import {
  REAL_RETURN_DEFAULT,
  MEDICAL_REAL_ESCALATION,
  LIVING_REAL_DECLINE,
  DEFAULT_PLANNING_HORIZON_AGE,
} from "@/lib/retirement-kenya";
import { earlyStartMultiple, earlyStartMultipleReal } from "@/lib/tool-stats";
import { isStale, generatedOn } from "@/lib/rates-feed";

/**
 * The reasoning behind the number, where a reader can actually reach it.
 *
 * Everything here already existed — and was good — as comments in
 * retirement-kenya.ts: why 3% real, why medical is modelled separately, and
 * the fact that the decision about retirement medical cover expires BEFORE
 * retirement does. None of it was on the page. The best explanation in the
 * module was one no user could read.
 *
 * The premise check is not decoration either. A planning rate justified by
 * market conditions has to be re-justified when the market moves, so the
 * justification is computed from the live Mwangaza feed and shown either way:
 * if 3% stops being the conservative choice, this says so rather than
 * continuing to assert it.
 */
export default function FireEducation() {
  const premise = checkPlanningRatePremise();
  const board = realYieldBoard();
  const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
  const stale = isStale();

  return (
    <section className="mt-8 space-y-6 print:hidden">
      <h2 className="text-lg font-semibold text-ink">Why the number looks like this</h2>

      {/* 1. Nominal vs real — the distinction the whole tool rests on. */}
      <article className="rounded-2xl border border-border bg-canvas p-5">
        <h3 className="font-semibold text-ink">Everything here is in today&apos;s money</h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          A retirement pot quoted in the shillings of thirty years&apos; time is a large and
          meaningless number. Inflation makes it big; it does not make it worth more. So this
          calculator never shows you one — the figure it gives is what the same lifestyle costs in
          the shillings you are holding right now.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          The gap is not small. The stat at the top of this page — the value of starting ten years
          earlier — is <strong>{earlyStartMultipleReal()}×</strong> in today&apos;s money and{" "}
          <strong>{earlyStartMultiple()}×</strong> in nominal shillings. Same savings, same return,
          same person: only the units differ. Whenever you meet a projection that sounds
          extraordinary, the first question is which of those two it is quoting.
        </p>
      </article>

      {/* 2. The return assumption, checked against live data rather than asserted. */}
      <article className="rounded-2xl border border-border bg-canvas p-5">
        <h3 className="font-semibold text-ink">
          Why {pct(REAL_RETURN_DEFAULT)} a year, after inflation and tax
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">{premise.summary}</p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[22rem] text-left text-sm">
            <caption className="sr-only">
              Net real yields on Kenyan government paper, against the {pct(REAL_RETURN_DEFAULT)}{" "}
              planning rate
            </caption>
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-ink-soft">
                <th scope="col" className="py-2 pr-3 font-medium">Instrument</th>
                <th scope="col" className="py-2 pr-3 text-right font-medium">After tax</th>
                <th scope="col" className="py-2 text-right font-medium">After inflation</th>
              </tr>
            </thead>
            <tbody>
              {board.map((r) => (
                <tr key={r.label} className="border-b border-border/50 last:border-0">
                  <th scope="row" className="py-2 pr-3 font-normal text-ink">{r.label}</th>
                  <td className="py-2 pr-3 text-right tabular-nums text-ink-soft">
                    {pct(r.netNominal)}
                  </td>
                  <td className="py-2 text-right tabular-nums font-medium text-ink">
                    {pct(r.netReal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-ink-soft">
          Bills sit below the planning rate and long bonds above it, which is the point: the plan
          assumes less than the bonds on offer today, so it does not depend on today lasting. If it
          turns out conservative, you finish early — the direction worth being wrong in.
        </p>
        <p className="mt-2 text-xs text-ink-soft">
          {premise.attribution}
          {stale
            ? " — these figures are more than a fortnight old, so treat them as indicative."
            : ` — as at ${generatedOn().toISOString().slice(0, 10)}.`}
        </p>
      </article>

      {/* 3. The deadline nothing else in the app surfaces. */}
      <article className="rounded-2xl border border-accent bg-accent-soft p-5">
        <h3 className="font-semibold text-ink">
          The medical decision expires before retirement does
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          Kenyan insurers commonly refuse <strong>new</strong> entrants past their mid-sixties, and
          price cover on continuous membership. So the choice about retirement medical cover has a
          deadline years earlier than the retirement it is for. A plan that gives you the number but
          not the deadline has left out the part that cannot be fixed later.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          This is also why medical is modelled apart from everything else. Ordinary living costs
          drift <em>down</em> in real terms once you retire — the fees end, the commute goes — at
          about {pct(LIVING_REAL_DECLINE)} a year here. Medical does the opposite, climbing roughly{" "}
          {pct(MEDICAL_REAL_ESCALATION)} a year <em>on top of</em> inflation, because you age into a
          more expensive band as well as into a more expensive year. A single blended rate hides
          both movements and gets the composition wrong even when the total looks about right.
        </p>
      </article>

      {/* 4. Why not the rule everyone quotes. */}
      <article className="rounded-2xl border border-border bg-canvas p-5">
        <h3 className="font-semibold text-ink">Why there is no 25× rule here</h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          The 4% rule — save 25× your spending — comes from Bengen&apos;s 1994 study of US market
          and inflation history, and it sizes a pot meant to last <em>forever</em>. You are funding
          something different: a finite span, to age {DEFAULT_PLANNING_HORIZON_AGE} here, with
          living costs falling in real terms and medical costs rising. That has no single multiple,
          which is why this tool prices the actual years instead and lets the multiple fall out at
          the end.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          It usually lands near 20×, so the rule of thumb is not absurd — it is just an answer to a
          question nobody in Kenya is asking, calibrated on a market nobody here is invested in.
        </p>
        <p className="mt-3 text-sm">
          <Link href="/tools/inflation-reality" className="underline hover:text-primary">
            See what inflation alone does to a balance →
          </Link>
        </p>
      </article>
    </section>
  );
}
