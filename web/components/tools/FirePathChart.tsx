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
import { localizedFire, KENYAN_INFLATION } from "@/lib/market-2026";

function fmtY(value: number) {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 100_000) return `${(value / 1_000).toFixed(0)}K`;
  return value.toFixed(0);
}

function fmtKES(value: number) {
  return `KSh ${value.toLocaleString("en-KE", { maximumFractionDigits: 0 })}`;
}

export default function FirePathChart({
  monthlyExpenses,
  currentAge,
  targetAge,
}: {
  monthlyExpenses: number;
  currentAge: number;
  targetAge: number;
}) {
  if (!monthlyExpenses || monthlyExpenses <= 0) return null;

  const rangeStart = Math.max(currentAge + 1, 30);
  const rangeEnd = Math.max(targetAge + 10, rangeStart + 5);

  const data = [];
  for (let age = rangeStart; age <= rangeEnd; age++) {
    const { nominalFutureFireNumber } = localizedFire({
      currentMonthlyExpenses: monthlyExpenses,
      currentAge,
      targetRetirementAge: age,
    });
    data.push({ age, fireNumber: Math.round(nominalFutureFireNumber) });
  }

  return (
    <div
      className="rounded-2xl bg-white p-4 shadow-sm"
      role="img"
      aria-label="Line chart showing how your FIRE target changes at different retirement ages"
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-primary">FIRE target by retirement age</p>
        <span className="text-[10px] text-[#9A8B80]">
          {(KENYAN_INFLATION * 100).toFixed(1)}% inflation applied
        </span>
      </div>
      <div style={{ height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1ECE3" vertical={false} />
            <XAxis
              dataKey="age"
              tick={{ fontSize: 10, fill: "#9A8B80" }}
              tickFormatter={(v) => `Age ${v}`}
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
              formatter={(value: number) => [fmtKES(value), "FIRE target"]}
              labelFormatter={(label) => `Retire at age ${label}`}
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: "1px solid #E5E0D8",
                background: "#FAFAF8",
              }}
            />
            <ReferenceLine
              x={targetAge}
              stroke="#E8A838"
              strokeWidth={2}
              label={{
                value: `Your target: age ${targetAge}`,
                position: "insideTopLeft",
                fontSize: 9,
                fill: "#E8A838",
              }}
            />
            <Line
              type="monotone"
              dataKey="fireNumber"
              stroke="#3a7d44"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, fill: "#3a7d44" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-[10px] text-[#9A8B80]">
        The curve rises with inflation — retiring 5 years later means a materially larger target.
        Earlier retirement locks the clock in your favour.
      </p>
    </div>
  );
}
