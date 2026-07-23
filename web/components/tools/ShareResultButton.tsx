"use client";

import { useState } from "react";
import { getStoredWhatsAppNumber } from "@/lib/storage";
import { useStorageValue } from "@/lib/hooks";

export default function ShareResultButton({ message }: { message: string }) {
  const [copied, setCopied] = useState(false);
  const whatsappNumber = useStorageValue(getStoredWhatsAppNumber, () => null);

  const whatsappUrl = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
    : `https://wa.me/?text=${encodeURIComponent(message)}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (unsupported browser/permissions) — silently ignore.
    }
  }

  return (
    <div className="flex gap-3">
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-11 flex-1 items-center justify-center rounded-full bg-[#0E7C56] text-sm font-medium text-white"
      >
        Share on WhatsApp
      </a>
      <button
        type="button"
        onClick={handleCopy}
        aria-live="polite"
        className="h-11 rounded-full border border-border px-4 text-sm font-medium text-ink-soft"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}
