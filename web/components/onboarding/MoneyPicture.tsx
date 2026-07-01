"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { getStoredProfile, setStoredCalculations } from "@/lib/storage";
import { calculateFinancials, formatKES, savingsRateBand } from "@/lib/budget";
import { buildRetirementComparison } from "@/lib/projections";
import type { Profile } from "@/lib/types";

const SLICE_COLORS: Record<string, string> = {
  Needs: "#6B5B4D",
  "Social obligations": "#E8A838",
  Wants: "#C9BFB2",
  Savings: "#2D7D46",
};

const BAND_COLOR: Record<"green" | "amber" | "red", string> = {
  green: "text-success",
  amber: "text-warning",
  red: "text-danger",
};

export default function MoneyPicture() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const stored = getStoredProfile();
    if (!stored) {
      router.replace("/profile");
      return;
    }
    setProfile(stored);
  }, [router]);

  const financials = useMemo(
    () => (profile ? calculateFinancials(profile.grossMonthlySalary) : null),
    [profile]
  );

  useEffect(() => {
    if (financials) setStoredCalculations(financials);
  }, [financials]);

  const retirement = useMemo(() => {
    if (!profile || !financials) return null;
    return buildRetirementComparison({
      currentAge: profile.age,
      netMonthlyIncome: financials.netMonthly,
    });
  }, [profile, financials]);

  if (!profile || !financials || !retirement) {
    return <p className="text-center text-[#4B4238]">Loading your money picture...</p>;
  }

  const chartData = [
    { name: "Needs", value: financials.budgetSplit.needs },
    { name: "Social obligations", value: financials.budgetSplit.socialObligations },
    { name: "Wants", value: financials.budgetSplit.wants },
    { name: "Savings", value: financials.budgetSplit.savings },
  ];

  const band = savingsRateBand(financials.savingsRate);

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-sm text-[#4B4238]">Your monthly take-home pay</p>
        <p className="mt-1 text-3xl font-semibold text-primary">
          {formatKES(financials.netMonthly)}
        </p>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-primary">Your budget split</h2>
        <div className="mt-4 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={2}
              >
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={SLICE_COLORS[entry.name]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatKES(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="mt-2 space-y-1 text-sm">
          {chartData.map((entry) => (
            <li key={entry.name} className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: SLICE_COLORS[entry.name] }}
                />
                {entry.name}
              </span>
              <span className="font-medium">{formatKES(entry.value)}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border-2 border-accent bg-[#FFF8EA] p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-accent">
          What most apps ignore
        </h3>
        <p className="mt-2 text-sm text-[#4B4238]">
          {formatKES(financials.budgetSplit.socialObligations)}/month set aside for your real
          Kenyan obligations — Harambee, tithe, upcountry family support, and Chama
          contributions.
        </p>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-primary">Your savings capacity</h2>
        <p className={`mt-1 text-2xl font-semibold ${BAND_COLOR[band]}`}>
          {formatKES(financials.savingsCapacity)}
          <span className="ml-2 text-base font-normal">
            ({(financials.savingsRate * 100).toFixed(0)}%)
          </span>
        </p>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-primary">Wealth at age 60</h2>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-[#FBEAEA] p-4">
            <p className="text-xs text-[#4B4238]">Current trajectory</p>
            <p className="mt-1 text-lg font-semibold text-danger">
              {formatKES(retirement.currentTrajectory.nominalWealth)}
            </p>
          </div>
          <div className="rounded-xl bg-[#E9F5EC] p-4">
            <p className="text-xs text-[#4B4238]">With a plan</p>
            <p className="mt-1 text-lg font-semibold text-success">
              {formatKES(retirement.withPlan.nominalWealth)}
            </p>
          </div>
        </div>
        <p className="mt-3 text-xs text-[#4B4238]">
          Assumes a 20% savings rate at 10% annual return over {retirement.yearsToRetirement}{" "}
          years. Figures are nominal KES — inflation will reduce real purchasing power.
        </p>
      </div>

      <Link
        href="/plan"
        className="flex h-12 w-full items-center justify-center rounded-full bg-primary text-base font-medium text-white transition-colors hover:bg-[#584a3e]"
      >
        Continue to your action plan →
      </Link>
    </div>
  );
}
