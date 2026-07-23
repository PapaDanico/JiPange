"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatKES } from "@/lib/budget";

const SLICES = [
  { key: "household" as const, label: "Household (50%)", color: "#E87040" },
  { key: "savingsEmergency" as const, label: "Savings (25%)", color: "#3a7d44" },
  { key: "investments" as const, label: "Investments (25%)", color: "#E8A838" },
];

export default function BudgetSplitChart({
  household,
  savingsEmergency,
  investments,
}: {
  household: number;
  savingsEmergency: number;
  investments: number;
}) {
  const values = { household, savingsEmergency, investments };
  const data = SLICES.map((s) => ({ name: s.label, value: values[s.key], color: s.color }));

  return (
    <div
      className="rounded-2xl bg-white p-4 shadow-sm"
      role="img"
      aria-label="Donut chart showing the 50/25/25 budget split across household, savings, and investments"
    >
      <p className="mb-1 text-sm font-semibold text-primary">Your 50/25/25 split</p>
      <div style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="38%"
              outerRadius="60%"
              dataKey="value"
              strokeWidth={2}
              stroke="#FAFAF8"
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [formatKES(Number(value)), String(name)]}
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: "1px solid #E5E0D8",
                background: "#FAFAF8",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap justify-center gap-3 text-[11px] text-ink-soft">
        {SLICES.map((s) => (
          <span key={s.key} className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}
