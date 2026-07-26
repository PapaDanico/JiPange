"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { planKenyanRetirement } from "@/lib/retirement-kenya";
import { formatKES } from "@/lib/budget";

function fmtY(value: number) {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 100_000) return `${(value / 1_000).toFixed(0)}K`;
  return value.toFixed(0);
}

/**
 * The two streams, year by year.
 *
 * This chart used to plot the FIRE target against retirement age, which said
 * only "retiring later costs more" — true, obvious, and largely an artefact of
 * the inflation curve the old model applied to the headline.
 *
 * It now draws what the model actually found: ordinary living costs sloping
 * gently DOWN in real terms across retirement while medical cover climbs
 * underneath them. Those two bands pulling apart are the argument. A reader who
 * takes nothing else from this tool should take the shape.
 *
 * Everything is in today's shillings, so the vertical axis means what it says
 * instead of being a nominal figure needing translation.
 */
export default function FirePathChart({
  monthlyExpenses,
  monthlyMedical,
  currentAge,
  targetAge,
}: {
  monthlyExpenses: number;
  monthlyMedical: number;
  currentAge: number;
  targetAge: number;
}) {
  const plan = useMemo(() => {
    if (!monthlyExpenses || monthlyExpenses <= 0) return null;
    return planKenyanRetirement({
      currentMonthlyExpenses: monthlyExpenses,
      currentMonthlyMedical: monthlyMedical || 0,
      currentAge,
      retirementAge: Math.max(currentAge, targetAge),
    });
  }, [monthlyExpenses, monthlyMedical, currentAge, targetAge]);

  const data = useMemo(
    () =>
      plan?.years.map((y) => ({
        age: y.age,
        living: Math.round(y.livingKes),
        medical: Math.round(y.medicalKes),
      })) ?? null,
    [plan]
  );

  if (!plan || !data || data.length === 0) return null;

  const last = plan.years[plan.years.length - 1];

  return (
    <div
      className="print:hidden rounded-2xl bg-white p-4 shadow-sm"
      role="img"
      aria-label={
        `Stacked area chart of annual retirement spending in today's shillings, from age ` +
        `${data[0].age} to ${last.age}. Ordinary living costs fall slowly while medical ` +
        `cover rises, reaching ${(last.medicalShare * 100).toFixed(0)} percent of all ` +
        `spending by the end.`
      }
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-primary">
          What you spend each year in retirement
        </p>
        <span className="shrink-0 text-[10px] text-muted">today&apos;s shillings</span>
      </div>
      <div style={{ height: 210 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1ECE3" vertical={false} />
            <XAxis
              dataKey="age"
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
              formatter={(value, name) => [
                formatKES(Number(value)),
                name === "medical" ? "Medical cover" : "Everything else",
              ]}
              labelFormatter={(label) => `Age ${label}`}
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: "1px solid #E5E0D8",
                background: "#FAFAF8",
              }}
            />
            <Area
              type="monotone"
              dataKey="living"
              stackId="spend"
              stroke="#3a7d44"
              fill="#3a7d44"
              fillOpacity={0.18}
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="medical"
              stackId="spend"
              stroke="#E8A838"
              fill="#E8A838"
              fillOpacity={0.45}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-muted">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-3 rounded-sm bg-[#3a7d44]/30" /> Everything else
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-3 rounded-sm bg-[#E8A838]/70" /> Medical cover
        </span>
      </div>
      <p className="mt-2 text-[10px] leading-relaxed text-muted">
        The green band drifts down as fees end and the household shrinks; the gold one climbs
        the whole way. By {last.age} medical is {(last.medicalShare * 100).toFixed(0)}% of
        everything you spend.
      </p>
    </div>
  );
}
