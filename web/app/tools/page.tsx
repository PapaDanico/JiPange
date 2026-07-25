import type { Metadata } from "next";
import ToolsIndexList from "@/components/tools/ToolsIndexList";
import RecentToolsBar from "@/components/tools/RecentToolsBar";
import { ReadinessSnapshot, ContinueSessionBanner } from "@/components/tools/ToolsPageDynamics";
import { CALCULATOR_GROUPS } from "@/lib/tool-groups";

export const metadata: Metadata = {
  title: "Free Financial Calculators for Kenya",
  description:
    "Free, no-signup calculators for Kenyan money decisions: take-home pay, savings goals, loans, FIRE, and more.",
};

export default function ToolsPage() {
  return (
    <div className="flex flex-1 flex-col items-center px-6 py-12">
      <div className="w-full max-w-5xl">
        <h1 className="text-2xl font-semibold text-primary lg:text-3xl">Free Financial Calculators</h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-soft lg:text-base">
          Quick tools for everyday Kenyan money decisions — no account needed.
        </p>
      </div>
      <div className="w-full max-w-5xl">
        <ContinueSessionBanner />
        <ReadinessSnapshot />
        <RecentToolsBar />
      </div>
      <ToolsIndexList groups={CALCULATOR_GROUPS} />
    </div>
  );
}
