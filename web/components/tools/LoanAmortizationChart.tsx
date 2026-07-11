"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { type AmortizationEntry } from "@/lib/loans";

function fmtY(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 100_000) return `${(value / 1_000).toFixed(0)}K`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toFixed(0);
}

function fmtKES(value: number) {
  return `KSh ${value.toLocaleString("en-KE", { maximumFractionDigits: 0 })}`;
}

interface DataPoint {
  label: string;
  principal: number;
  interest: number;
}

function buildChartData(schedule: AmortizationEntry[], termMonths: number): DataPoint[] {
  const step = Math.max(1, Math.ceil(termMonths / 30));
  const points: DataPoint[] = [];
  let cumPrincipal = 0;
  let cumInterest = 0;

  for (const entry of schedule) {
    cumPrincipal += entry.principalPaid;
    cumInterest += entry.interestPaid;
    if (entry.month % (step * 12) === 0 || entry.month === termMonths) {
      const yr = Math.ceil(entry.month / 12);
      if (points.length === 0 || points[points.length - 1].label !== `Yr ${yr}`) {
        points.push({ label: `Yr ${yr}`, principal: cumPrincipal, interest: cumInterest });
      }
    }
  }

  // Always include the midpoint if we only have endpoints
  if (points.length < 3 && schedule.length > 0) {
    const mid = Math.floor(schedule.length / 2);
    let cp = 0;
    let ci = 0;
    for (let i = 0; i <= mid; i++) {
      cp += schedule[i].principalPaid;
      ci += schedule[i].interestPaid;
    }
    const midYr = Math.ceil(schedule[mid].month / 12);
    const insertAt = points.findIndex((p) => p.label > `Yr ${midYr}`);
    if (insertAt > 0) {
      points.splice(insertAt, 0, { label: `Yr ${midYr}`, principal: cp, interest: ci });
    }
  }

  return points;
}

export default function LoanAmortizationChart({
  schedule,
  termMonths,
  principal,
}: {
  schedule: AmortizationEntry[];
  termMonths: number;
  principal: number;
}) {
  if (schedule.length < 2) return null;

  const data = buildChartData(schedule, termMonths);
  const breakEvenEntry = schedule.find((e) => {
    let cp = 0;
    let ci = 0;
    for (let i = 0; i < e.month; i++) {
      cp += schedule[i].principalPaid;
      ci += schedule[i].interestPaid;
    }
    return ci >= cp;
  });
  const breakEvenYr = breakEvenEntry ? Math.ceil(breakEvenEntry.month / 12) : null;

  return (
    <div
      className="rounded-2xl bg-white p-4 shadow-sm"
      role="img"
      aria-label="Stacked area chart showing cumulative principal paid versus cumulative interest paid over the loan term"
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-primary">Where your payments go</p>
        <div className="flex items-center gap-3 text-[10px] text-[#4B4238]">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#3a7d44]" />
            Principal
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#E87040]" />
            Interest
          </span>
        </div>
      </div>
      <div style={{ height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
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
              formatter={(value: number, name: string) => [
                fmtKES(value),
                name === "principal" ? "Principal repaid" : "Interest paid",
              ]}
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: "1px solid #E5E0D8",
                background: "#FAFAF8",
              }}
            />
            {breakEvenYr && (
              <ReferenceLine
                x={`Yr ${breakEvenYr}`}
                stroke="#9A8B80"
                strokeDasharray="4 4"
                label={{ value: "½ interest owed", position: "insideTopRight", fontSize: 9, fill: "#9A8B80" }}
              />
            )}
            <Area
              type="monotone"
              dataKey="principal"
              stackId="1"
              stroke="#3a7d44"
              fill="#3a7d44"
              fillOpacity={0.75}
              strokeWidth={2}
              name="principal"
            />
            <Area
              type="monotone"
              dataKey="interest"
              stackId="1"
              stroke="#E87040"
              fill="#E87040"
              fillOpacity={0.6}
              strokeWidth={2}
              name="interest"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {principal > 0 && (
        <p className="mt-2 text-[10px] text-[#9A8B80]">
          The interest band is money paid to the lender on top of the original{" "}
          {fmtKES(principal)} — every extra payment shrinks it from the right.
        </p>
      )}
    </div>
  );
}
