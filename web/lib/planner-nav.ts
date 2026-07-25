import { GOAL_CONFIGS, GOAL_TYPES } from "@/lib/goal-planner";

export interface PlannerNavItem {
  href: string;
  icon: string;
  title: string;
  tagline: string;
}

/**
 * Single source of truth for "every planner as a nav item" — powers the
 * header "Planners" dropdown. The /planners hub page still builds its own
 * cards directly from GOAL_CONFIGS/GOAL_TYPES (it needs the full config,
 * not just this summary), but the one non-goal entry (Hustle Income
 * Smoother) lives here once so hub and dropdown can't drift apart on it.
 */
export const PLANNER_NAV_ITEMS: PlannerNavItem[] = [
  ...GOAL_TYPES.map((type) => {
    const config = GOAL_CONFIGS[type];
    return {
      href: `/planners/${type}`,
      icon: config.emoji,
      title: config.title,
      tagline: config.tagline,
    };
  }),
  {
    href: "/planners/hustle",
    icon: "🔄",
    title: "Hustle Income Smoother",
    tagline: "Turn lumpy poultry, farm or gig payouts into a steady monthly salary.",
  },
];
