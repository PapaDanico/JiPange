import type { ReactNode } from "react";

interface BehavioralInsightStripProps {
  insight: ReactNode;
}

/**
 * Surfaces a behavioural-economics insight relevant to the calculator result.
 * Styled in a cool slate tint to stand apart from the warm card palette.
 */
export default function BehavioralInsightStrip({ insight }: BehavioralInsightStripProps) {
  return (
    <div className="rounded-2xl border border-[#C8DDE8] bg-[#EEF5F9] px-4 py-3.5">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[#3A6B82]">
        Behavioural insight
      </p>
      <p className="text-xs leading-relaxed text-[#1E3A4A]">{insight}</p>
    </div>
  );
}
