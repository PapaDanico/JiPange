import { ogAlt, ogCard, ogContentType, ogSize } from "@/lib/og/card";
import { GOAL_CONFIGS, GOAL_TYPES, type GoalType } from "@/lib/goal-planner";

// Per-goal share cards for the planner deep links the app itself promotes
// (footer, My goals, the save-goal flow). generateStaticParams keeps these
// baked at build time — the card renderer reads fonts from disk relative to
// cwd, which only exists at build, not in a serverless function.

export function generateStaticParams() {
  return GOAL_TYPES.map((goal) => ({ goal }));
}

export const size = ogSize;
export const contentType = ogContentType;
export const alt = ogAlt("Goal Planner");

export default async function Image({ params }: { params: Promise<{ goal: string }> }) {
  const { goal } = await params;
  const config = GOAL_CONFIGS[goal as GoalType];
  return ogCard(config?.title ?? "Goal Planners");
}
