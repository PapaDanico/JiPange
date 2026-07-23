"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatKES } from "@/lib/budget";

const SLICE_COLORS: Record<string, string> = {
  Needs: "#6B5B4D",
  "Social obligations": "#E8A838",
  Wants: "#C9BFB2",
  Savings: "#2D7D46",
  Household: "#6B5B4D",
  "Savings (emergency)": "#2D7D46",
  Investments: "#3B6FA0",
};

export interface BudgetSplitDataPoint {
  name: string;
  value: number;
}

export default function BudgetSplitPieChart({ data }: { data: BudgetSplitDataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart accessibilityLayer={false}>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={2}
          rootTabIndex={-1}
        >
          {data.map((entry) => (
            <Cell key={entry.name} fill={SLICE_COLORS[entry.name]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => formatKES(Number(value))} />
      </PieChart>
    </ResponsiveContainer>
  );
}
