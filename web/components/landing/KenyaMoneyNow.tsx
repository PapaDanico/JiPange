import Link from "next/link";
import {
  annualFigures,
  bestBillRealYieldPct,
  liveFigures,
  pulseFreshnessNote,
  type PulseFigure,
} from "@/lib/landing-pulse";

/**
 * The landing page's information panel. Renders; never computes — every
 * value, date and publisher comes from lib/landing-pulse.ts.
 */

function Figure({ f }: { f: PulseFigure }) {
  const body = (
    <>
      <p
        className="text-2xl font-black leading-none tracking-tight text-primary sm:text-4xl"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {f.value}
      </p>
      <p className="mt-2 text-[0.875rem] font-bold leading-snug text-primary sm:text-[0.9375rem]">{f.label}</p>
      <p className="mt-1 text-[0.8125rem] leading-relaxed text-muted">{f.meaning}</p>
      <p className="mt-auto border-t border-border pt-2.5 text-[0.6875rem] text-muted">{f.source}</p>
    </>
  );
  const shell = "flex min-h-full flex-col gap-0.5 rounded-2xl border border-border bg-white p-3.5 shadow-sm sm:p-5";
  return f.href ? (
    <Link
      href={f.href}
      className={`${shell} transition hover:-translate-y-0.5 hover:border-accent hover:shadow-md`}
    >
      {body}
    </Link>
  ) : (
    <div className={shell}>{body}</div>
  );
}

export default function KenyaMoneyNow() {
  const live = liveFigures();
  const annual = annualFigures();
  const real = bestBillRealYieldPct();
  const note = pulseFreshnessNote();

  return (
    <section aria-labelledby="money-now-heading" className="border-b border-border bg-canvas py-14 sm:py-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div data-reveal className="mb-8 max-w-2xl">
          <p className="mb-1.5 text-xs font-bold uppercase tracking-widest text-accent-ink">
            Information first
          </p>
          <h2
            id="money-now-heading"
            className="text-2xl font-extrabold tracking-tight text-primary sm:text-3xl"
            style={{ textWrap: "balance" } as React.CSSProperties}
          >
            Kenya&apos;s money, this month
          </h2>
          <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-soft">
            Good decisions start with good numbers. Every figure below comes straight from the
            institution that publishes it, carries its date, and feeds the same calculators you
            use — so what you read here is what you plan with.
            {real !== null && real > 0 && (
              <>
                {" "}Right now, the best-paying Treasury bill grows savings by about{" "}
                <strong className="text-primary">{real.toFixed(1)}% a year after tax and inflation</strong>.
              </>
            )}
          </p>
        </div>

        <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-muted">
          Latest readings
        </h3>
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
          {live.map((f) => (
            <Figure key={f.id} f={f} />
          ))}
        </div>

        <h3 className="mb-3 mt-8 text-xs font-bold uppercase tracking-widest text-muted">
          The year in banking — Central Bank of Kenya, December 2025
        </h3>
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
          {annual.map((f) => (
            <Figure key={f.id} f={f} />
          ))}
        </div>

        {note && (
          <p role="note" className="mt-5 rounded-xl border border-[#F0D08A] bg-accent-soft px-4 py-3 text-[0.8125rem] leading-relaxed text-ink-soft">
            {note}
          </p>
        )}
      </div>
    </section>
  );
}
