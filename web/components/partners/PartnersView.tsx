"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  PRODUCT_LINKS,
  MMF_LINKS,
  TBILL_LINKS,
  SACCO_LINKS,
  SACCO_RATES_AS_OF,
  SACCO_RATES_SOURCE,
  SACCO_DIVIDEND_RANGE_PCT,
  PENSION_LINKS,
  PRODUCT_SURVEY_AS_OF,
  PRODUCT_SURVEY_MAX_AGE_DAYS,
  productSurveyIsStale,
  type ProductLink,
  type ProductType,
} from "@/lib/affiliate-links";
import { getStoredJourneyAnswers } from "@/lib/storage";
import { useStorageValue } from "@/lib/hooks";
import type { VehicleId } from "@/lib/journey";

// ── Filter tabs ──────────────────────────────────────────────────────────────

type FilterTab = "all" | ProductType;

const TABS: { id: FilterTab; label: string; emoji: string }[] = [
  { id: "all", label: "All products", emoji: "🌐" },
  { id: "mmf", label: "Money Market", emoji: "📈" },
  { id: "tbill", label: "T-Bills & Bonds", emoji: "🏛️" },
  { id: "sacco", label: "SACCOs", emoji: "🤝" },
  { id: "pension", label: "Pension", emoji: "🧓" },
];

const TYPE_BADGE: Record<ProductType, { label: string; bg: string; text: string }> = {
  mmf: { label: "MMF", bg: "#E9F5EC", text: "#2D7D46" },
  tbill: { label: "T-Bill/Bond", bg: "#EEF5F9", text: "#3A6B82" },
  sacco: { label: "SACCO", bg: "#FFF4DC", text: "#B45309" },
  pension: { label: "Pension", bg: "#F1ECE3", text: "#6B5B4D" },
};

// Which vehicle IDs map to which product type for the "Recommended for you" strip.
const VEHICLE_TO_TYPE: Partial<Record<VehicleId, ProductType>> = {
  mmf: "mmf",
  ifb: "tbill",
  sacco: "sacco",
};

// ── Product card ─────────────────────────────────────────────────────────────

function ProductCard({ product }: { product: ProductLink }) {
  const badge = TYPE_BADGE[product.type];
  return (
    <div className="flex flex-col rounded-2xl border border-border bg-white p-4 shadow-sm">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-primary leading-snug">{product.name}</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <span
              className="inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold"
              style={{ backgroundColor: badge.bg, color: badge.text }}
            >
              {badge.label}
            </span>
            <span className="inline-block rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-faint">
              {product.regulator}
            </span>
            {product.isAffiliate && (
              <span className="inline-block rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-semibold text-warning">
                ★ Partner
              </span>
            )}
          </div>
        </div>
        {product.yieldPct !== undefined && (
          <div className="shrink-0 text-right">
            <p className="text-lg font-bold text-primary tabular-nums">
              {/* One decimal. The T-bill yield comes live from the rates feed
                  and carries four, which rendered as "~8.4479%" — a precision
                  nobody has about next week's auction, sitting next to the
                  hand-curated "~15.5%" as though the two were measured the
                  same way. The sister card already rounded; this one did not. */}
              ~{product.yieldPct.toFixed(1)}%
            </p>
            <p className="text-[10px] text-faint">
              {product.type === "sacco" ? "dividends p.a." : "yield p.a."}
            </p>
          </div>
        )}
      </div>

      {/* Tagline */}
      <p className="mt-2 text-xs text-ink-soft">{product.tagline}</p>

      {/* Stats row */}
      <div className="mt-3 flex gap-3 text-xs text-ink-soft">
        {product.minKes !== undefined && (
          <div className="flex-1">
            <p className="font-semibold text-primary">
              Ksh {product.minKes.toLocaleString("en-KE")}
            </p>
            <p>min entry</p>
          </div>
        )}
        <div className="flex-1">
          <p className="font-semibold text-primary leading-snug">{product.liquidity}</p>
          <p>liquidity</p>
        </div>
      </div>

      {(product.yieldApplies || product.protection) && (
        <div className="mt-3 space-y-1 text-[11px] leading-relaxed text-ink-soft">
          {product.yieldApplies && (
            // "13% dividends p.a." beside "min entry Ksh 1,000" reads as 13%
            // on everything you put in. It is paid on share capital; deposits
            // earn a separate, lower rate.
            <p>Paid on {product.yieldApplies}.</p>
          )}
          {product.protection && (
            <p className="text-[#7a4a00]">⚠ {product.protection}.</p>
          )}
        </div>
      )}

      {/* CTA */}
      <div className="mt-4">
        {product.url === undefined ? (
          // No verified link, so no button. A control that looks like a way
          // out and goes nowhere is worse than an honest sentence — and on a
          // financial product, a guessed destination is the worst option of
          // the three. The card still carries rate, minimum and regulator,
          // which is what the reader needs to go and find it themselves.
          <p className="rounded-xl border border-dashed border-border px-3 py-2 text-xs text-ink-soft">
            No verified sign-up link yet — search for {product.name} or ask your
            bank. The rate and minimum above are from the {PRODUCT_SURVEY_AS_OF} survey.
          </p>
        ) : (
        <Link
          href={`/go/${product.slug}`}
          // /go/[slug] is a redirect to the provider, and Next prefetches
          // internal routes on sight — so merely SCROLLING this page fetched the
          // redirect and followed it, pinging six financial companies before the
          // reader clicked anything. On a page that promises to store nothing
          // that is a contradiction, and on Kenyan mobile data it is six
          // requests nobody asked for.
          prefetch={false}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-11 w-full items-center justify-center rounded-xl border border-primary text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-white"
        >
          Visit {product.shortName} →
        </Link>
        )}
      </div>
    </div>
  );
}

// ── Personalised recommendation strip ────────────────────────────────────────

function RecommendedStrip({ vehicleId }: { vehicleId: VehicleId }) {
  const type = VEHICLE_TO_TYPE[vehicleId];
  if (!type) return null;

  const products = PRODUCT_LINKS.filter((p) => p.type === type).slice(0, 2);
  if (products.length === 0) return null;

  const label =
    vehicleId === "mmf"
      ? "Your journey matched you with a Money Market Fund"
      : vehicleId === "ifb"
        ? "Your journey matched you with T-Bills / Infrastructure Bonds"
        : "Your journey matched you with a SACCO";

  return (
    <section className="mb-6 rounded-2xl border-2 border-accent bg-accent-soft p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-warning">
        Recommended for you
      </p>
      <p className="mt-0.5 text-sm font-semibold text-primary">{label}</p>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {products.map((p) => (
          <ProductCard key={p.slug} product={p} />
        ))}
      </div>
      <p className="mt-2 text-[11px] text-faint">
        Based on your 5-question snapshot.{" "}
        <Link href="/profile" className="underline hover:text-primary">
          Retake the journey →
        </Link>
      </p>
    </section>
  );
}

// ── Main view ─────────────────────────────────────────────────────────────────

export default function PartnersView() {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const answers = useStorageValue(getStoredJourneyAnswers, () => null);
  const recommendedVehicle = useMemo<VehicleId | null>(() => {
    if (!answers) return null;
    // Mirror the matchVehicle logic to surface the right type.
    const { primary_goal, timeline, liquidity_leak } = answers;
    const recovery = liquidity_leak === "mobile_loans";
    if (primary_goal === "emergency_fund" || primary_goal === "clear_debt" || timeline === "short_term" || recovery) {
      return "mmf";
    }
    if (timeline === "mid_term") return "sacco";
    return "ifb";
  }, [answers]);

  const visibleProducts =
    activeTab === "all"
      ? PRODUCT_LINKS
      : activeTab === "mmf"
        ? MMF_LINKS
        : activeTab === "tbill"
          ? TBILL_LINKS
          : activeTab === "sacco"
            ? SACCO_LINKS
            : PENSION_LINKS;

  return (
    <div className="w-full max-w-2xl">
      {/* The survey has a shelf life, and it had passed it silently.
        *
        * `productSurveyIsStale()` existed, was unit-tested, and was rendered
        * nowhere — so the one thing it was written to prevent was the one
        * thing that happened. A reader saw fund yields footnoted with a
        * survey date and no indication that the date was past the point
        * where this file itself stops vouching for them. Dating a figure is
        * only half the disclosure; the other half is saying when the date
        * stopped being good enough. */}
      {productSurveyIsStale() && (
        <p className="mb-5 rounded-2xl border border-[#e0b000] bg-[#fff8e1] px-4 py-3 text-sm text-[#7a4a00]">
          ⚠ The product details below — minimum entry and terms — were surveyed
          on {PRODUCT_SURVEY_AS_OF} and have not been re-checked within{" "}
          {PRODUCT_SURVEY_MAX_AGE_DAYS} days. Confirm the minimum with the
          provider before you move any money. Regulators and protections do not
          change on this clock. Fund yields are not shown here at all, by
          choice: they move weekly, and a stale one is worse than none.
        </p>
      )}

      {/* Personalised strip — only when user has journey answers */}
      {recommendedVehicle && activeTab === "all" && (
        <RecommendedStrip vehicleId={recommendedVehicle} />
      )}

      {/* Filter tabs */}
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex shrink-0 items-center gap-1.5 inline-flex min-h-11 items-center justify-center rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? "border-primary bg-primary text-white"
                : "border-border bg-white text-ink-soft hover:border-primary hover:text-primary"
            }`}
          >
            <span aria-hidden="true">{tab.emoji}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Product grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {visibleProducts.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>

      {/* Disclaimer */}
      <div className="mt-8 rounded-2xl bg-canvas p-4 text-xs text-ink-soft">
        <p className="font-semibold text-primary">About this directory</p>
        <ul className="mt-2 space-y-1.5 list-disc pl-4">
          <li>
            All products listed are regulated by CMA, CBK, SASRA, or RBA — always confirm
            current regulatory status before investing.
          </li>
          <li>
            Yields and dividends shown are <strong>approximate</strong> and change frequently.
            Verify the current rate directly with the provider before committing any funds.
          </li>
          <li>
            JiPange does not currently receive referral fees from any listed provider unless
            marked <strong>★ Partner</strong>.
          </li>
          <li>
            <strong>SACCO deposits are not currently guaranteed.</strong> The Sacco Societies
            Act provides for a Deposit Guarantee Fund of up to Ksh 100,000 per member — on
            deposits, not on shares — but it is <strong>not yet operational</strong>; the Sacco
            Societies (Amendment) Bill 2025 seeks to activate it. Bank deposits have KDIC
            cover today and SACCO deposits do not, which is a difference no yield figure shows.
          </li>
          <li>
            SACCO dividends are declared once a year at an AGM out of a surplus that has not
            been earned yet, so a past rate is history rather than a rate on offer. The figures
            here are dated {SACCO_RATES_AS_OF} and sit inside the{" "}
            {SACCO_DIVIDEND_RANGE_PCT.low}–{SACCO_DIVIDEND_RANGE_PCT.high}% range SASRA reports
            for the sector. Source: {SACCO_RATES_SOURCE}.
          </li>
          <li>
            This is a curated information directory — not financial advice or an endorsement.
          </li>
        </ul>
      </div>
    </div>
  );
}
