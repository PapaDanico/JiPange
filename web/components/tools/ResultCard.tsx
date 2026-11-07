"use client";

import { useState } from "react";

export default function ResultCard({
  label,
  value,
  sublabel,
  tone = "primary",
  headline = false,
}: {
  label: string;
  value: string;
  sublabel?: string;
  tone?: "primary" | "success" | "warning" | "danger";
  /** The calculator's one answer: the page's dark, raised passbook surface.
   *  Used for the first, full-width card only; supporting figures stay light. */
  headline?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const toneClass = {
    primary: "text-primary",
    success: "text-success",
    warning: "text-warning",
    danger: "text-danger",
  }[tone];

  // On the dark surface the semantic tones map to light equivalents that keep
  // their meaning (amber = good/neutral, gold = caution, rose = danger) at
  // AA contrast on shell brown.
  const headlineToneClass = {
    primary: "text-accent",
    success: "text-accent",
    warning: "text-[#F0C060]",
    danger: "text-[#F4A09A]",
  }[tone];

  function handleCopy() {
    navigator.clipboard
      .writeText(value)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {});
  }

  if (headline) {
    return (
      <div className="break-inside-avoid rounded-3xl bg-shell p-6 text-background shadow-passbook ring-1 ring-inset ring-white/10 sm:p-8 print:rounded-lg print:border print:border-border print:bg-white print:text-ink print:shadow-none print:ring-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-[#E6D9C6] print:text-ink-soft">{label}</p>
          <button
            type="button"
            onClick={handleCopy}
            aria-label={copied ? "Copied" : "Copy value"}
            aria-live="polite"
            className="relative mt-0.5 shrink-0 text-[#D6C7B2] transition-colors before:absolute before:-inset-4 before:content-[''] hover:text-accent print:hidden"
          >
            {copied ? (
              <span className="text-xs font-medium text-accent">✓</span>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            )}
          </button>
        </div>
        <p
          className={`mt-2 break-words font-display text-4xl font-semibold tabular-nums sm:text-5xl ${headlineToneClass} print:text-primary`}
          style={{ fontVariantNumeric: "lining-nums tabular-nums" }}
        >
          {value.replace(/^Ksh /, "Ksh\u00a0")}
        </p>
        {sublabel && (
          <p className="mt-3 max-w-prose text-[0.8125rem] leading-relaxed text-[#D6C7B2] print:text-ink-soft">
            {sublabel}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="break-inside-avoid rounded-2xl bg-white p-4 shadow-sm sm:p-6 print:rounded-lg print:border print:border-border print:shadow-none">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-ink-soft">{label}</p>
        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? "Copied" : "Copy value"}
          aria-live="polite"
          className="relative mt-0.5 shrink-0 text-muted transition-colors before:absolute before:-inset-4 before:content-[''] hover:text-primary print:hidden"
        >
          {copied ? (
            <span className="text-xs font-medium text-success">✓</span>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
        </button>
      </div>
      <p className={`mt-1 break-words font-display text-2xl font-semibold tabular-nums sm:text-3xl ${toneClass}`}>
        {/* Non-breaking after the currency: narrow PDF columns split "Ksh" from
            its figure onto two lines. */}
        {value.replace(/^Ksh /, "Ksh\u00a0")}
      </p>
      {sublabel && <p className="mt-1 text-xs text-ink-soft">{sublabel}</p>}
    </div>
  );
}
