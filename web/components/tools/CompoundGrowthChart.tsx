"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface GrowthDataPoint {
  year: number;
  contributed: number;
  growth: number;
}

function fmtY(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 100_000) return `${(value / 1_000).toFixed(0)}K`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toFixed(0);
}

function fmtKES(value: number) {
  return `KSh ${value.toLocaleString("en-KE", { maximumFractionDigits: 0 })}`;
}

export default function CompoundGrowthChart({ data }: { data: GrowthDataPoint[] }) {
  if (data.length < 2) return null;

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm" role="img" aria-label="Stacked area chart showing contributed amount and investment growth over time">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-primary">Growth over time</p>
        <div className="flex items-center gap-3 text-[10px] text-[#4B4238]">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#F1ECE3] border border-[#E5E0D8]" />
            Contributed
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#3a7d44]" />
            Growth
          </span>
        </div>
      </div>
      <div style={{ height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1ECE3" vertical={false} />
            <XAxis
              dataKey="year"
              tick={{ fontSize: 10, fill: "#9A8B80" }}
              tickFormatter={(v) => `Yr ${v}`}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#9A8B80" }}
              tickFormatter={fmtY}
              width={44}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(value: number, name: string) => [
                fmtKES(value),
                name === "contributed" ? "Contributed" : "Growth",
              ]}
              labelFormatter={(label) => `Year ${label}`}
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: "1px solid #E5E0D8",
                background: "#FAFAF8",
              }}
            />
            <Area
              type="monotone"
              dataKey="contributed"
              stackId="1"
              stroke="#E5E0D8"
              fill="#F1ECE3"
              strokeWidth={1}
              name="contributed"
            />
            <Area
              type="monotone"
              dataKey="growth"
              stackId="1"
              stroke="#3a7d44"
              fill="#3a7d44"
              fillOpacity={0.75}
              strokeWidth={2}
              name="growth"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
