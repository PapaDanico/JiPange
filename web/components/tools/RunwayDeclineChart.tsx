"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatKES } from "@/lib/budget";

export interface RunwayDataPoint {
  label: string;
  balance: number;
}

function fmtY(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 100_000) return `${(value / 1_000).toFixed(0)}K`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toFixed(0);
}

export default function RunwayDeclineChart({
  data,
  infinite,
}: {
  data: RunwayDataPoint[];
  infinite?: boolean;
}) {
  if (data.length < 2) return null;

  return (
    <div className="print:hidden rounded-2xl bg-white p-4 shadow-sm" role="img" aria-label="Line chart showing account balance declining over time">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-primary">Balance over time</p>
        {infinite && (
          <span className="rounded-full bg-success-soft px-2 py-0.5 text-[10px] font-medium text-success-deep">
            Never depletes ♾
          </span>
        )}
      </div>
      <div style={{ height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1ECE3" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "#9A8B80" }}
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
              formatter={(value) => [formatKES(Number(value)), "Balance"]}
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: "1px solid #E5E0D8",
                background: "#FAFAF8",
              }}
            />
            <ReferenceLine y={0} stroke="#E5E0D8" strokeDasharray="4 4" />
            <Line
              type="monotone"
              dataKey="balance"
              stroke="#E87040"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, fill: "#E87040" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
