import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import GoalPlanner from "@/components/planners/GoalPlanner";
import TermlyFeeSmoother from "@/components/planners/TermlyFeeSmoother";
import MjengoMilestone from "@/components/planners/MjengoMilestone";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, softwareApplicationJsonLd } from "@/lib/structured-data";
import { GOAL_CONFIGS, GOAL_TYPES, type GoalType } from "@/lib/goal-planner";

interface PageProps {
  params: Promise<{ goal: string }>;
}

export function generateStaticParams() {
  return GOAL_TYPES.map((goal) => ({ goal }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { goal } = await params;
  const config = GOAL_CONFIGS[goal as GoalType];
  if (!config) return {};
  return {
    title: `${config.title} — JiPange`,
    description: config.tagline,
  };
}

export default async function GoalPlannerPage({ params }: PageProps) {
  const { goal } = await params;
  const config = GOAL_CONFIGS[goal as GoalType];
  if (!config) notFound();

  const path = `/planners/${goal}`;

  return (
    <div className="flex flex-1 flex-col items-center px-6 py-12">
      <JsonLd data={softwareApplicationJsonLd({ name: config.title, description: config.tagline, path })} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Planners", path: "/planners" },
          { name: config.title, path },
        ])}
      />
      <div className="w-full max-w-3xl">
        <Link href="/planners" className="text-xs font-medium text-primary underline">
          ← All planners
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-primary lg:text-3xl">
          {config.emoji} {config.title}
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-soft lg:text-base">{config.tagline}</p>
      </div>
      <div className="mt-8 w-full max-w-3xl space-y-10">
        {config.type === "home" && (
          <div>
            <MjengoMilestone />
            <h2 className="mt-10 border-t border-border pt-8 text-lg font-semibold text-primary">
              Or save the classic deposit
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              Reverse-engineer a straight cash deposit on your own timeline.
            </p>
          </div>
        )}
        {config.type === "education" && (
          <div>
            <TermlyFeeSmoother />
            <h2 className="mt-10 border-t border-border pt-8 text-lg font-semibold text-primary">
              Future stages — plan the big transitions
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              Junior Secondary, Senior Secondary, university — reverse-engineered per child.
            </p>
          </div>
        )}
        <GoalPlanner config={config} />
      </div>
    </div>
  );
}
