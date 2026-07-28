import type { Metadata } from "next";
import Link from "next/link";
import {
  TIERS,
  NEVER_PAID,
  SUPPORT_NARRATIVE,
  tierSpec,
} from "@/lib/tiers";
import { TOOL_META } from "@/lib/tool-meta";
import { formatKES } from "@/lib/budget";

export const metadata: Metadata = {
  title: "Supporting JiPange",
  description:
    "The calculators are free and stay free. What a contribution covers, what will never cost anything, and why.",
};

/* Prices and names come from lib/tiers.ts, never retyped here. A figure in
   prose is one a price change cannot reach — which is exactly how a retired
   number survived on the landing page for as long as it did. */

export default function SupportPage() {
  const protectedTools = NEVER_PAID.map((href) => ({
    href,
    meta: TOOL_META[href as keyof typeof TOOL_META],
  }));

  return (
    <div className="flex flex-1 flex-col items-center px-6 py-12">
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-semibold text-primary">
          {SUPPORT_NARRATIVE.heading}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          {SUPPORT_NARRATIVE.lead}
        </p>

        <div className="mt-4 space-y-4 text-sm leading-relaxed text-ink-soft">
          {SUPPORT_NARRATIVE.body.map((para) => (
            <p key={para.slice(0, 24)}>{para}</p>
          ))}
        </div>

        {/* ── What a contribution covers ── */}
        <section className="mt-10">
          <h2 className="text-base font-semibold text-primary">
            Where the line falls
          </h2>
          <p className="mt-2 text-sm text-ink-soft">
            Everything you can see on screen is free. What can carry a cost is
            what you do with it afterwards — take it away, keep it, be reminded
            of it.
          </p>

          <div className="mt-5 space-y-4">
            {TIERS.map((tier) => (
              <div
                key={tier.id}
                className="rounded-2xl border border-border bg-white p-5"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-base font-semibold text-primary">
                    {tier.name}
                  </p>
                  <p className="text-sm font-medium text-ink-soft">
                    {tier.priceKES === null
                      ? tier.unit
                      : tier.priceKES === 0
                        ? "Free, always"
                        : `${formatKES(tier.priceKES)} ${tier.unit}`}
                  </p>
                </div>
                <p className="mt-1 text-sm text-ink-soft">{tier.summary}</p>
                <ul className="mt-3 space-y-1.5 text-sm text-ink-soft">
                  {tier.includes.map((line) => (
                    <li key={line} className="flex gap-2">
                      <span aria-hidden="true" className="text-accent-ink">
                        ·
                      </span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* ── The promise ── */}
        <section className="mt-10 rounded-2xl border-2 border-accent bg-accent-soft p-5">
          <h2 className="text-base font-semibold text-primary">
            {SUPPORT_NARRATIVE.protectedHeading}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            {SUPPORT_NARRATIVE.protectedLead}
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            {protectedTools.map(({ href, meta }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="font-medium text-primary underline hover:opacity-80"
                >
                  {meta?.icon} {meta?.name ?? href}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <p className="mt-8 text-sm leading-relaxed text-faint">
          {SUPPORT_NARRATIVE.closing}
        </p>

        <p className="mt-8 text-sm text-ink-soft">
          Nothing is charged for today. This page describes where a contribution
          would go if you chose to make one, and it is here first so you can
          tell us if it reads wrong.{" "}
          <Link href="/tools" className="font-medium text-primary underline">
            Back to the calculators →
          </Link>
        </p>
      </div>
    </div>
  );
}
