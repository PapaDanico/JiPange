"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { computeReadiness, type IndicatorStatus, type ReadinessIndicator } from "@/lib/readiness";
import { getStoredCalculations, getStoredGoals, getStoredJourneyAnswers } from "@/lib/storage";

const STATUS_STYLES: Record<IndicatorStatus, string> = {
  strong: "bg-[#D1FAE5] text-[#2D7D46]",
  good: "bg-[#DBEAFE] text-[#1E40AF]",
  building: "bg-[#FEF3C7] text-[#B45309]",
  risk: "bg-[#FEE2E2] text-[#C81E1E]",
  unknown: "bg-[#F3F4F6] text-[#6B7280]",
};

const STATUS_ICONS: Record<IndicatorStatus, string> = {
  strong: "✓",
  good: "↑",
  building: "~",
  risk: "!",
  unknown: "–",
};

function IndicatorCard({ indicator }: { indicator: ReadinessIndicator }) {
  const hintNode = indicator.hint
    ? indicator.href
      ? (
          <Link
            href={indicator.href}
            className="mt-1 block text-[10px] text-[#6B5B4D] underline underline-offset-2 hover:text-primary leading-snug"
          >
            {indicator.hint}
          </Link>
        )
      : (
          <p className="mt-1 text-[10px] text-[#9A8B80] leading-snug">{indicator.hint}</p>
        )
    : null;

  return (
    <div className="rounded-xl border border-[#E5E0D8] bg-[#FAFAF8] p-2.5">
      <p className="text-[11px] text-[#9A8B80]">{indicator.label}</p>
      <div className="mt-1 flex items-center gap-1.5">
        <span
          className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${STATUS_STYLES[indicator.status]}`}
        >
          <span aria-hidden="true">{STATUS_ICONS[indicator.status]}</span>
          {indicator.statusLabel}
        </span>
      </div>
      {hintNode}
    </div>
  );
}

export default function ReadinessSnapshot() {
  const [data, setData] = useState<ReturnType<typeof computeReadiness>>(null);

  useEffect(() => {
    const calculations = getStoredCalculations();
    const journey = getStoredJourneyAnswers();
    const goals = getStoredGoals();
    setData(computeReadiness(calculations, journey, goals.length > 0));
  }, []);

  if (!data) return null;

  return (
    <div className="w-full max-w-md mt-4">
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-semibold text-primary">Financial Readiness</p>
          <Link
            href="/journey"
            className="text-[10px] text-[#9A8B80] underline underline-offset-2 hover:text-primary"
          >
            Update
          </Link>
        </div>
        <div className="mt-2.5 grid grid-cols-2 gap-2">
          {data.indicators.map((indicator) => (
            <IndicatorCard key={indicator.key} indicator={indicator} />
          ))}
        </div>
        <p className="mt-2 text-[10px] text-[#9A8B80]">
          Based on your{" "}
          <Link href="/journey" className="underline underline-offset-2 hover:text-primary">
            90-second assessment
          </Link>
          {" "}— not financial advice.
        </p>
      </div>
    </div>
  );
}
