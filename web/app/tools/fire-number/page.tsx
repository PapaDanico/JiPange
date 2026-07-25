import type { Metadata } from "next";
import Link from "next/link";
import ToolLayout from "@/components/tools/ToolLayout";
import FireNumberCalculator from "@/components/tools/FireNumberCalculator";

export const metadata: Metadata = {
  title: "FIRE Number Calculator — Financial Independence Kenya",
  description:
    "Find your FIRE number and how many years until Financial Independence, based on the 4% safe withdrawal rule.",
};

export default function FireNumberPage() {
  return (
    <ToolLayout
      path="/tools/fire-number"
      title="FIRE Number Calculator"
      description="Find your Financial Independence number and how many years to reach it."
      insights={[
        {
          icon: "⚠️",
          tone: "caution",
          stat: "81%",
          label: "of Kenya's workforce contributes nothing to a pension — retirement will arrive whether they plan for it or not.",
          source: "RBA Pensioners Survey 2024",
        },
        {
          icon: "🌅",
          tone: "hopeful",
          stat: "2× more",
          label: "wealth at 55 by starting KSh 3,000/month at 28 vs 38 — at 10% return. Starting early is the single biggest lever.",
          source: "JiPange FIRE projection",
        },
      ]}
    >
      <FireNumberCalculator />
      <div className="mt-6 rounded-2xl bg-canvas p-4 text-sm text-ink-soft print:hidden">
        <p className="font-semibold text-primary">Ready to build toward this number?</p>
        <p className="mt-1 text-xs">
          Use the{" "}
          <Link href="/planners" className="underline hover:text-primary">
            Retirement Planner
          </Link>{" "}
          to model your monthly contributions, investment growth, and the exact year you reach
          Financial Independence — with Kenya&apos;s MMF and T-Bill yields built in.
        </p>
      </div>
    </ToolLayout>
  );
}
