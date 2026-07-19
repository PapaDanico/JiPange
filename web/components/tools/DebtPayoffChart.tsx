"use client";

import { useId } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatKES } from "@/lib/budget";

interface Props {
  timeline: Array<{ month: number; remaining: number }>;
  totalBalance: number;
}

function yFmt(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return String(v);
}

export default function DebtPayoffChart({ timeline, totalBalance }: Props) {
  const gradientId = useId();

  if (timeline.length < 2) return null;

  const lastMonth = timeline[timeline.length - 1].month;
  const tickInterval = lastMonth <= 12 ? 1 : lastMonth <= 24 ? 2 : lastMonth <= 48 ? 6 : 12;

  return (
    <div
      role="img"
      aria-label="Area chart showing total debt balance declining to zero over the repayment period"
      className="rounded-2xl bg-white p-4 shadow-sm"
    >
      <p className="text-sm font-semibold text-primary">Debt payoff curve</p>
      <p className="mt-0.5 text-xs text-[#4B4238]">
        Every extra payment shrinks this from the right.
      </p>
      <div className="mt-3 h-44">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={timeline} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#E87040" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#E87040" stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="month"
              tick={{ fontSize: 10, fill: "#9A8B80" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `M${v}`}
              interval={tickInterval - 1}
            />
            <YAxis
              domain={[0, Math.round(totalBalance)]}
              tick={{ fontSize: 10, fill: "#9A8B80" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={yFmt}
              width={36}
            />
            <Tooltip
              formatter={(value: number) => [formatKES(value), "Remaining debt"]}
              labelFormatter={(label) => `Month ${label}`}
              contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: "#E5E0D8" }}
            />
            <Area
              type="monotone"
              dataKey="remaining"
              stroke="#E87040"
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
