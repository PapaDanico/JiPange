import Link from "next/link";
import { TBILL_RATES } from "@/lib/rates-feed";

const fmt = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-KE", { day: "numeric", month: "short" });

/**
 * This week's T-bill rates, above the fold.
 *
 * Measured 4 Oct 2026 at 390px: the hero showed no figure at all before its
 * two buttons — the page's numbers (KenyaMoneyNow) start below the fold —
 * while every comparable Kenyan tool benchmarked that day leads with them.
 * After-tax figures from the same rates feed Mwangaza Yield publishes, so the
 * two products show the same numbers. Server-rendered, so nothing shifts.
 */
export default function HeroRates() {
  const bills = TBILL_RATES.filter((t) => Number.isFinite(t.netEAY));
  if (bills.length === 0) return null;
  return (
    <Link
      href="/tools/dhowcsd"
      className="mb-6 block rounded-2xl border border-border bg-white p-4 shadow-sm transition hover:border-accent"
      aria-label="Treasury bill rates after tax from the latest CBK auction; open the T-bill calculator"
    >
      <p className="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-muted">
        T-bills, after tax · CBK auction {fmt(bills[0].auctionDate)}
      </p>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {bills.map((t) => (
          <div key={t.tenorDays}>
            <p className="text-2xl font-black leading-none text-primary" style={{ fontVariantNumeric: "tabular-nums" }}>
              {t.netEAY.toFixed(2)}%
            </p>
            <p className="mt-1 text-[0.8125rem] text-muted">{t.tenorDays}-day</p>
            {/* Same three lines as Mwangaza Yield's card, so a reader moving
                between the two products reads one format. */}
            <p className="text-[0.6875rem] text-muted" style={{ fontVariantNumeric: "tabular-nums" }}>
              CBK rate {t.quotedDiscountRate.toFixed(2)}%
            </p>
          </div>
        ))}
      </div>
    </Link>
  );
}
