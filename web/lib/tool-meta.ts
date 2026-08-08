import { readAny, writeAny } from "./storage";
import { PLANNER_NAV_ITEMS } from "./planner-nav";
import { CALCULATOR_GROUPS } from "./tool-groups";

export interface NextMove {
  label: string;
  href: string;
}

export interface ToolMeta {
  href: string;
  icon: string;
  name: string;
  related: string[];
  /** Single highest-priority "Next Move" CTA shown after results — the one action that matters most. */
  nextMove?: NextMove;
  /**
   * Sticky-state field names (under `jipange:tool:<slug>:<field>`) that gate this
   * calculator's result — i.e. default to "" and only hold a value once the user
   * has actually typed something. Used to detect a resumable session without
   * false-positiving on config fields (rates, percentages) whose non-empty
   * defaults get persisted back on every reset. Omit for tools not yet audited —
   * they simply won't offer a "continue" prompt.
   */
  primaryFields?: string[];
  /** Overrides the localStorage slug when it doesn't match the href (e.g. "/tools/sha-health" → "sha"). */
  storageSlug?: string;
}

export const TOOL_META: Record<string, ToolMeta> = {
  "/tools/salary": {
    href: "/tools/salary",
    icon: "💰",
    name: "Salary & Pay Hub",
    related: ["/tools/savings-goal", "/tools/investment-returns", "/tools/money-runway"],
    nextMove: { label: "Put your take-home to work →", href: "/tools/investment-returns" },
  },
  "/tools/take-home-pay": {
    href: "/tools/take-home-pay",
    icon: "💰",
    name: "Take-Home Pay",
    related: ["/tools/salary", "/tools/savings-goal", "/tools/money-runway"],
    nextMove: { label: "See what this could grow into →", href: "/tools/investment-returns" },
    primaryFields: ["gross"],
  },
  "/tools/investment-returns": {
    href: "/tools/investment-returns",
    icon: "📈",
    name: "Investment Returns",
    related: ["/tools/savings-goal", "/tools/fire-number", "/tools/dhowcsd"],
    nextMove: { label: "Turn this into a FIRE number →", href: "/tools/fire-number" },
    primaryFields: ["monthly", "years"],
  },
  "/tools/money-runway": {
    href: "/tools/money-runway",
    icon: "⏳",
    name: "Money Runway",
    related: ["/tools/savings-goal", "/tools/budget-split", "/planners/emergency"],
    nextMove: { label: "Check your SACCO guarantee exposure →", href: "/tools/guarantor-shield" },
    primaryFields: ["startingBalance", "monthlyWithdrawal"],
  },
  "/tools/guarantor-shield": {
    href: "/tools/guarantor-shield",
    icon: "🎯",
    name: "Guarantor Shield",
    related: ["/tools/sacco-vs-bank", "/tools/one-third-rule", "/tools/loan-repayment"],
    nextMove: { label: "Compare SACCO vs bank loan costs →", href: "/tools/sacco-vs-bank" },
  },
  "/tools/kplc-optimizer": {
    href: "/tools/kplc-optimizer",
    icon: "⚡",
    name: "KPLC Token Checker",
    related: ["/tools/budget-split", "/tools/payday-router"],
    nextMove: { label: "Plan the rest of your budget →", href: "/tools/budget-split" },
  },
  "/tools/fuliza-cost": {
    href: "/tools/fuliza-cost",
    icon: "📱",
    name: "Fuliza Cost",
    related: ["/tools/payday-router", "/tools/savings-goal", "/tools/budget-split"],
    nextMove: { label: "Build a plan to clear it →", href: "/tools/debt-escape" },
    primaryFields: ["amount", "days"],
  },
  "/tools/inflation-reality": {
    href: "/tools/inflation-reality",
    icon: "📉",
    name: "Inflation Reality",
    related: ["/tools/investment-returns", "/tools/dhowcsd", "/tools/savings-goal"],
    nextMove: { label: "Find a return that outpaces it →", href: "/tools/investment-returns" },
    primaryFields: ["salary"],
  },
  "/tools/savings-goal": {
    href: "/tools/savings-goal",
    icon: "🎯",
    name: "Savings Goal",
    related: ["/tools/investment-returns", "/tools/budget-split", "/tools/money-runway"],
    nextMove: { label: "Project the full growth curve →", href: "/tools/investment-returns" },
    primaryFields: ["target", "years"],
  },
  "/tools/loan-repayment": {
    href: "/tools/loan-repayment",
    icon: "🏦",
    name: "Loan Repayment",
    related: ["/tools/sacco-vs-bank", "/tools/one-third-rule", "/tools/guarantor-shield"],
    nextMove: { label: "Check this is legally compliant →", href: "/tools/one-third-rule" },
    primaryFields: ["principal", "termYears"],
  },
  "/tools/fire-number": {
    href: "/tools/fire-number",
    icon: "🔥",
    name: "FIRE Number",
    related: ["/tools/investment-returns", "/tools/savings-goal", "/tools/money-runway"],
    nextMove: { label: "Stress-test your runway →", href: "/tools/money-runway" },
  },
  "/tools/sacco-vs-bank": {
    href: "/tools/sacco-vs-bank",
    icon: "⚖️",
    name: "SACCO vs Bank",
    related: ["/tools/loan-repayment", "/tools/guarantor-shield", "/tools/one-third-rule"],
    nextMove: { label: "Check your guarantor exposure →", href: "/tools/guarantor-shield" },
    primaryFields: ["amount"],
  },
  "/tools/budget-split": {
    href: "/tools/budget-split",
    icon: "🥧",
    name: "Budget Split",
    related: ["/tools/payday-router", "/tools/savings-goal", "/tools/take-home-pay"],
    nextMove: { label: "Automate this split on payday →", href: "/tools/payday-router" },
    primaryFields: ["gross"],
  },
  "/tools/school-fees-lifetime": {
    href: "/tools/school-fees-lifetime",
    icon: "🏫",
    name: "Full Cost of Private School",
    /* The education sequence, in the order a parent meets it: this year's
     * cash-flow problem, then the whole liability, then how to fund it. The
     * three are complementary rather than alternatives, and listing them in
     * order is the cheapest way to say so. */
    related: ["/planners/education", "/tools/savings-goal", "/tools/take-home-pay"],
    nextMove: { label: "Smooth this year's termly bills →", href: "/planners/education" },
    primaryFields: ["children"],
  },
  "/tools/dhowcsd": {
    href: "/tools/dhowcsd",
    icon: "🏆",
    name: "DhowCSD T-Bill Ladder",
    related: ["/tools/investment-returns", "/tools/inflation-reality", "/tools/fire-number"],
    nextMove: { label: "Compare against other vehicles →", href: "/tools/investment-returns" },
    primaryFields: ["capital"],
  },
  "/tools/salary-negotiation": {
    href: "/tools/salary-negotiation",
    icon: "💼",
    name: "Salary Negotiation",
    related: ["/tools/salary", "/tools/savings-goal", "/tools/investment-returns"],
    nextMove: { label: "See your new take-home pay →", href: "/tools/take-home-pay" },
    primaryFields: ["targetNet"],
  },
  "/tools/tax-shield": {
    href: "/tools/tax-shield",
    icon: "🧾",
    name: "Tax Shield",
    related: ["/tools/salary", "/tools/investment-returns", "/tools/fire-number"],
    nextMove: { label: "Put the tax saving to work →", href: "/tools/investment-returns" },
    primaryFields: ["gross"],
  },
  "/tools/payday-router": {
    href: "/tools/payday-router",
    icon: "📱",
    name: "Payday Router",
    related: ["/tools/salary", "/tools/fuliza-cost", "/tools/savings-goal"],
    nextMove: { label: "Set a savings goal for this slice →", href: "/tools/savings-goal" },
  },
  "/tools/one-third-rule": {
    href: "/tools/one-third-rule",
    icon: "⚠️",
    name: "1/3 Rule Checker",
    related: ["/tools/sacco-vs-bank", "/tools/loan-repayment", "/tools/guarantor-shield"],
    nextMove: { label: "Compare cheaper loan options →", href: "/tools/sacco-vs-bank" },
    primaryFields: ["basicSalary"],
  },
  "/tools/chama": {
    href: "/tools/chama",
    icon: "🤝",
    name: "Chama Group Savings",
    related: ["/tools/savings-goal", "/tools/investment-returns", "/tools/sacco-vs-bank"],
    nextMove: { label: "Project your personal share long-term →", href: "/tools/investment-returns" },
  },
  "/tools/debt-escape": {
    href: "/tools/debt-escape",
    icon: "💸",
    name: "Debt Stack Buster",
    related: ["/tools/fuliza-cost", "/tools/payday-router", "/tools/budget-split"],
    nextMove: { label: "Route your payday to hit this plan →", href: "/tools/payday-router" },
    primaryFields: ["budget"],
  },
  "/tools/sha-health": {
    href: "/tools/sha-health",
    icon: "🏥",
    name: "SHA Health Gap",
    related: ["/tools/take-home-pay", "/tools/tax-shield", "/tools/budget-split"],
    nextMove: { label: "Fit the top-up into your budget →", href: "/tools/budget-split" },
    primaryFields: ["income"],
    storageSlug: "sha",
  },
  "/tools/land-purchase": {
    href: "/tools/land-purchase",
    icon: "🏡",
    name: "Land Purchase Cost",
    related: ["/tools/loan-repayment", "/tools/savings-goal", "/tools/investment-returns"],
    nextMove: { label: "Save toward the true total cost →", href: "/tools/savings-goal" },
    primaryFields: ["price"],
    storageSlug: "land",
  },
  "/tools/hustle-smoother": {
    href: "/tools/hustle-smoother",
    icon: "🔄",
    name: "Hustle Income Smoother",
    related: ["/tools/budget-split", "/tools/savings-goal", "/planners/hustle"],
    nextMove: { label: "Split your smoothed salary →", href: "/tools/budget-split" },
  },
  "/tools/20th-challenge": {
    href: "/tools/20th-challenge",
    icon: "🔥",
    name: "20th-to-20th Challenge",
    related: ["/tools/savings-goal", "/tools/budget-split", "/tools/payday-router"],
    nextMove: { label: "Project where this streak leads →", href: "/tools/investment-returns" },
  },
};

/* Planners appear here only as cross-linking targets, and the two that were
 * listed had been retyped rather than read: this file called /planners/education
 * the "School Fees Smoother" while the planner itself is the Education Planner,
 * and gave /planners/emergency a different shield emoji than the one the planner
 * renders. A cross-link that renames its destination is how one product ends up
 * with several names. Derived from the nav registry instead. */
for (const item of PLANNER_NAV_ITEMS) {
  TOOL_META[item.href] = { href: item.href, icon: item.icon, name: item.title, related: [] };
}

/* Calculators that are listed on /tools but were never hand-entered above.
 *
 * /tools/where-to-save was one. It shipped, it is linked from the footer and
 * from the tools index, and it was absent from this object — so TOOL_COUNT,
 * which app/page.tsx derives from exactly these keys, advertised "All 25
 * calculators" while twenty-six existed.
 *
 * That is the same failure the comment on app/page.tsx describes ("three
 * numbers for one fact"), returning by a route the earlier fix left open.
 * Deriving the count from a registry only helps if joining the registry is
 * compulsory, and it was not: a new page could ship without an entry and the
 * shop window would quietly undercount rather than break.
 *
 * Backfilled from CALCULATOR_GROUPS — the list /tools already renders — rather
 * than retyped, for the reason in the comment above: a second hand-typed name
 * is how one product ends up with several. Existing entries are NOT
 * overwritten, because those carry `related`, `nextMove` and `primaryFields`
 * that the index has no idea about.
 *
 * tool-meta.test.ts asserts every /tools page reaches this object, so the next
 * one to ship without an entry fails CI instead of silently miscounting. */
for (const group of CALCULATOR_GROUPS) {
  for (const item of group.calculators) {
    if (TOOL_META[item.href]) continue;
    TOOL_META[item.href] = { href: item.href, icon: item.icon, name: item.title, related: [] };
  }
}

export const RECENT_TOOLS_KEY = "jipange_recent_tools";
export const MAX_RECENT = 3;

const EMPTY_RECENT: string[] = [];

export function recordToolVisit(href: string): void {
  const existing = getRecentTools();
  const updated = [href, ...existing.filter((h) => h !== href)].slice(0, MAX_RECENT);
  writeAny(RECENT_TOOLS_KEY, updated);
}

export function getRecentTools(): string[] {
  return readAny<string[]>(RECENT_TOOLS_KEY) ?? EMPTY_RECENT;
}

/** True if a stored value is worth resuming — a non-empty string, a non-zero number, or a non-empty array/object. */
function isMeaningfulValue(raw: string): boolean {
  try {
    const value = JSON.parse(raw);
    if (value === null || value === undefined) return false;
    if (typeof value === "string") return value.trim() !== "";
    if (typeof value === "number") return value !== 0;
    if (Array.isArray(value)) return value.length > 0;
    return Boolean(value);
  } catch {
    return false;
  }
}

/**
 * Does this tool have a saved value in one of its `primaryFields`? Deliberately
 * scoped to those specific fields rather than every `jipange:tool:<slug>:*` key —
 * config fields (rates, percentages, counts) default to non-empty strings and get
 * persisted back on every reset, so scanning all keys would flag a just-cleared
 * calculator as "in progress." Tools without `primaryFields` declared simply
 * never offer a resume prompt.
 */
export function hasToolInputs(href: string): boolean {
  if (typeof window === "undefined") return false;
  const meta = TOOL_META[href];
  const fields = meta?.primaryFields;
  if (!fields || fields.length === 0) return false;
  const slug = meta.storageSlug ?? href.replace(/^\/tools\//, "");
  try {
    return fields.some((field) => {
      const value = localStorage.getItem(`jipange:tool:${slug}:${field}`);
      return value !== null && isMeaningfulValue(value);
    });
  } catch {
    return false;
  }
}

/** Most recently visited tool that still has unfinished input worth resuming, or null. */
export function findResumableTool(): string | null {
  return getRecentTools().find((href) => hasToolInputs(href)) ?? null;
}
