"use client";

import { useState } from "react";

export default function NumberField({
  id,
  label,
  value,
  onChange,
  placeholder,
  suffix,
  currency,
  min = 0,
  max,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  suffix?: string;
  currency?: boolean;
  min?: number;
  /**
   * Upper bound, where one is meaningful.
   *
   * Not decoration. Every field here was unbounded, and "85000" in a box
   * labelled "Investment period (years)" is one fat-fingered keystroke away.
   * The projection then compounds to ~1e38, the chart's path data overflows,
   * and the browser logs 174 errors while the reader looks at a broken graph
   * with no idea what they did. A calculator that cannot say "that cannot be
   * right" will confidently draw nonsense instead.
   */
  max?: number;
}) {
  const [touched, setTouched] = useState(false);
  const num = Number(value);
  const tooLow = num < min;
  const tooHigh = max !== undefined && num > max;
  const hasError = touched && value !== "" && (tooLow || tooHigh);
  const showsCurrency = currency ?? /\(Ksh(?:\/month)?\)/i.test(label);

  return (
    <div className="print:hidden">
      <label htmlFor={id} className="block text-sm font-medium text-ink-soft">
        {label}
      </label>
      <div className="relative mt-1">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          value={value}
          onBlur={() => setTouched(true)}
          onChange={(event) => onChange(event.target.value)}
          onPaste={(e) => {
            e.preventDefault();
            const pasted = e.clipboardData.getData("text").replace(/,/g, "").replace(/[^\d.]/g, "");
            if (pasted) onChange(pasted);
          }}
          placeholder={placeholder}
          aria-describedby={hasError ? `${id}-error` : undefined}
          aria-invalid={hasError || undefined}
          className={`h-12 w-full rounded-lg border bg-white text-base focus:outline-none focus:ring-1 ${showsCurrency ? "pl-14" : "pl-4"} ${suffix ? "pr-16" : "pr-4"} ${
            hasError
              ? "border-danger focus:border-danger focus:ring-danger"
              : "border-border focus:border-primary focus:ring-primary"
          }`}
        />
        {showsCurrency && (
          <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm font-semibold text-muted">
            Ksh
          </span>
        )}
        {suffix && (
          <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm text-ink-soft">
            {suffix}
          </span>
        )}
      </div>
      {hasError && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-xs text-danger">
          {tooHigh
            ? `That looks too high — enter ${max!.toLocaleString()} or less`
            : min > 0
              ? `Must be at least ${min.toLocaleString()}`
              : "Enter a positive number"}
        </p>
      )}
    </div>
  );
}
