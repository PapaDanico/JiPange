interface Insight {
  icon: string;
  tone: "caution" | "hopeful";
  stat: string;
  label: string;
  source?: string;
}

export default function ToolInsights({ insights }: { insights: [Insight, Insight] }) {
  return (
    <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 print:hidden">
      {insights.map((ins) => (
        <div
          key={ins.stat}
          className={`rounded-xl border p-4 ${
            ins.tone === "caution"
              ? "border-[#F5C8C4] bg-[#FDF2F1]"
              : "border-[#B9DFBE] bg-[#EDF7EF]"
          }`}
        >
          <p className="mb-1 text-lg leading-none">{ins.icon}</p>
          <p
            className={`text-2xl font-black leading-none tracking-tighter ${
              ins.tone === "caution" ? "text-danger-deep" : "text-[#1A5C28]"
            }`}
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {ins.stat}
          </p>
          <p className="mt-1 text-[0.8125rem] leading-snug text-ink-soft">{ins.label}</p>
          {ins.source && (
            <p className="mt-2 text-[0.6875rem] italic text-muted">{ins.source}</p>
          )}
        </div>
      ))}
    </div>
  );
}
