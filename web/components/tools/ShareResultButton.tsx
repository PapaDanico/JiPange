"use client";

import { useEffect, useState } from "react";
import { getStoredWhatsAppNumber } from "@/lib/storage";

export default function ShareResultButton({ message }: { message: string }) {
  const [copied, setCopied] = useState(false);
  // Read after mount (not during render) so the server-rendered href matches
  // the client's first render — localStorage isn't available during SSR.
  const [whatsappNumber, setWhatsappNumber] = useState<string | null>(null);

  useEffect(() => {
    setWhatsappNumber(getStoredWhatsAppNumber());
  }, []);

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
        className="h-11 rounded-full border border-[#E5E0D8] px-4 text-sm font-medium text-[#4B4238]"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}
