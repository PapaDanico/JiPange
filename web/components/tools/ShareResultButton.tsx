"use client";

import { useState } from "react";

export default function ShareResultButton({ message }: { message: string }) {
  const [copied, setCopied] = useState(false);
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;

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
        className="flex h-11 flex-1 items-center justify-center rounded-full bg-[#25D366] text-sm font-medium text-white"
      >
        Share on WhatsApp
      </a>
      <button
        onClick={handleCopy}
        className="h-11 rounded-full border border-[#E5E0D8] px-4 text-sm font-medium text-[#4B4238]"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}
