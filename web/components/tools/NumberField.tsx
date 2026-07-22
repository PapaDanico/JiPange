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
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  suffix?: string;
  currency?: boolean;
  min?: number;
}) {
  const [touched, setTouched] = useState(false);
  const num = Number(value);
  const hasError = touched && value !== "" && num < min;
  const showsCurrency = currency ?? /\((?:KES|KSh)(?:\/month)?\)/i.test(label);

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-[#4B4238]">
        {label}
      </label>
      <div className="relative mt-1">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={min}
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
              : "border-[#E5E0D8] focus:border-primary focus:ring-primary"
          }`}
        />
        {showsCurrency && (
          <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm font-semibold text-[#7A6B5E]">
            KSh
          </span>
        )}
        {suffix && (
          <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm text-[#4B4238]">
            {suffix}
          </span>
        )}
      </div>
      {hasError && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-xs text-danger">
          {min > 0 ? `Must be at least ${min.toLocaleString()}` : "Enter a positive number"}
        </p>
      )}
    </div>
  );
}
