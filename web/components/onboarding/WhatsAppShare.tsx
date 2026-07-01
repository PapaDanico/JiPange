"use client";

import { useState } from "react";
import type { ActionPlan, Calculations, Profile } from "@/lib/types";
import { formatKES } from "@/lib/budget";

interface WhatsAppShareProps {
  profile: Profile;
  calculations: Calculations;
  plan: ActionPlan;
  projectedWealth60: number;
}

function buildShareMessage({ calculations, plan, projectedWealth60 }: WhatsAppShareProps): string {
  const savingsRate =
    calculations.netMonthly > 0
      ? Math.round((calculations.savingsCapacity / calculations.netMonthly) * 100)
      : 0;

  const [first, second, third] = plan;

  return `🇰🇪 *My JiPange Financial Plan*

💰 Monthly Net Pay: ${formatKES(calculations.netMonthly)}
📊 Savings Capacity: ${formatKES(calculations.savingsCapacity)}/month (${savingsRate}%)
🎯 Wealth at 60 (with plan): ${formatKES(projectedWealth60)}

*My 3-Step Action Plan:*
1️⃣ ${first.title}: ${first.impact}
2️⃣ ${second.title}: ${second.impact}
3️⃣ ${third.title}: ${third.impact}

Get your free plan → jipangefinance.netlify.app`;
}

export default function WhatsAppShare(props: WhatsAppShareProps) {
  const [copied, setCopied] = useState(false);
  const message = buildShareMessage(props);
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
    <div className="fixed inset-x-0 bottom-0 z-10 border-t border-[#E5E0D8] bg-white p-4">
      <div className="mx-auto flex max-w-md gap-3">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-12 flex-1 items-center justify-center rounded-full bg-[#25D366] text-base font-medium text-white"
        >
          Share on WhatsApp
        </a>
        <button
          onClick={handleCopy}
          className="h-12 rounded-full border border-[#E5E0D8] px-4 text-sm font-medium text-[#4B4238]"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
}
