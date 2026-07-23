"use client";

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { formatKES } from "@/lib/budget";

interface Props {
  netMonthly: number;
  paye: number;
  nssfTotal: number;
  shif: number;
  ahl: number;
}

const SLICES = [
  { key: "netMonthly" as const, label: "Take-home", color: "#3a7d44" },
  { key: "paye" as const, label: "PAYE (tax)", color: "#E8A838" },
  { key: "nssfTotal" as const, label: "NSSF", color: "#d45f2a" },
  { key: "shif" as const, label: "SHIF", color: "#8B5CF6" },
  { key: "ahl" as const, label: "Housing Levy", color: "#6B5B4D" },
];

export default function PayBreakdownChart({ netMonthly, paye, nssfTotal, shif, ahl }: Props) {
  const values: Record<string, number> = { netMonthly, paye, nssfTotal, shif, ahl };
  const data = SLICES.filter((s) => values[s.key] > 0).map((s) => ({
    name: s.label,
    value: values[s.key],
    color: s.color,
  }));

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-primary">Where your salary goes</p>
      <div style={{ height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="48%"
              innerRadius="40%"
              outerRadius="62%"
              dataKey="value"
              strokeWidth={2}
              stroke="#FAFAF8"
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => [formatKES(Number(value)), ""]}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E5E0D8" }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
