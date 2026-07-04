import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import BrandHeader from "@/components/BrandHeader";
import GoalPlanner from "@/components/planners/GoalPlanner";
import { GOAL_CONFIGS, GOAL_TYPES, type GoalType } from "@/lib/goal-planner";

interface PageProps {
  params: { goal: string };
}

export function generateStaticParams() {
  return GOAL_TYPES.map((goal) => ({ goal }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  const config = GOAL_CONFIGS[params.goal as GoalType];
  if (!config) return {};
  return {
    title: `${config.title} — JiPange`,
    description: config.tagline,
  };
}

export default function GoalPlannerPage({ params }: PageProps) {
  const config = GOAL_CONFIGS[params.goal as GoalType];
  if (!config) notFound();

  return (
    <div className="flex flex-1 flex-col items-center px-6 py-12">
      <div className="w-full max-w-md">
        <BrandHeader />
        <Link href="/planners" className="text-xs font-medium text-primary underline">
          ← All planners
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-primary">
          {config.emoji} {config.title}
        </h1>
        <p className="mt-1 text-sm text-[#4B4238]">{config.tagline}</p>
      </div>
      <div className="mt-8 w-full max-w-md">
        <GoalPlanner config={config} />
      </div>
    </div>
  );
}
