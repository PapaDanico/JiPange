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
  /* The passbook: the page's one dark, raised surface. The figures are the
   * most valuable thing above the fold, so they get the display serif with
   * lining tabular numerals and the amber accent on shell brown (6.2:1). The
   * numbers, dates and labels are exactly what they were; only the surface
   * changed. */
  return (
    <Link
      href="/tools/dhowcsd"
      className="group block rounded-3xl bg-shell p-5 text-background shadow-passbook ring-1 ring-inset ring-white/10 transition-colors hover:bg-shell-hover sm:p-7"
      aria-label="Treasury bill rates after tax from the latest CBK auction; open the T-bill calculator"
    >
      <p className="text-sm font-medium text-[#E6D9C6]">
        T-bills, after tax · CBK auction {fmt(bills[0].auctionDate)}
      </p>
      <div className="mt-5 grid grid-cols-3 divide-x divide-white/10">
        {bills.map((t) => (
          <div key={t.tenorDays} className="px-2 first:pl-0 last:pr-0 sm:px-3">
            <p
              className="font-display text-[1.6rem] font-semibold leading-none text-accent sm:text-[2rem]"
              style={{ fontVariantNumeric: "lining-nums tabular-nums" }}
            >
              {t.netEAY.toFixed(2)}%
            </p>
            <p className="mt-2 text-[0.8125rem] font-medium text-background">{t.tenorDays}-day</p>
            {/* Same three lines as Mwangaza Yield's card, so a reader moving
                between the two products reads one format. */}
            <p className="text-xs text-[#D6C7B2]" style={{ fontVariantNumeric: "tabular-nums" }}>
              CBK rate {t.quotedDiscountRate.toFixed(2)}%
            </p>
          </div>
        ))}
      </div>
    </Link>
  );
}
