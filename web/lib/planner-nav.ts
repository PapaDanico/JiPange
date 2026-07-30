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
 * not just this summary), but the one non-goal entry (the Cycle Venture
 * Planner) lives here once so hub and dropdown can't drift apart on it.
 *
 * That entry used to be titled "Hustle Income Smoother" — which is the name of
 * a DIFFERENT product, the gig-income calculator at /tools/hustle-smoother.
 * One route ended up with four names (nav and OG card said Hustle Income
 * Smoother, the page heading said Cycle Venture Planner, the footer said cycle
 * venture, the home page said "Hustle income"), and the two tools it spanned
 * do different things: this planner rings-fences next cycle's seed capital for
 * a poultry or horticulture run, the calculator averages out freelance months.
 * A reader following the nav met a heading that did not match the link they
 * clicked, and a reader following the home page met the wrong product entirely.
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
    icon: "🌾",
    title: "Cycle Venture Planner",
    tagline: "Turn lumpy cycle payouts into a steady monthly salary, with next cycle's seed capital protected.",
  },
];
