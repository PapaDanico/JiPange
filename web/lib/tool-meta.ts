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
    name: "KPLC Optimizer",
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
  "/tools/education-savings": {
    href: "/tools/education-savings",
    icon: "🎓",
    name: "Education Savings",
    related: ["/tools/savings-goal", "/planners/education", "/tools/investment-returns"],
    nextMove: { label: "Smooth out the termly fee shocks →", href: "/planners/education" },
    primaryFields: ["jssFees", "sssFees"],
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
  // Planners (for cross-linking targets)
  "/planners/emergency": { href: "/planners/emergency", icon: "🛡️", name: "Emergency Fund Planner", related: [] },
  "/planners/education": { href: "/planners/education", icon: "🎓", name: "School Fees Smoother", related: [] },
};

export const RECENT_TOOLS_KEY = "jipange_recent_tools";
export const MAX_RECENT = 3;

export function recordToolVisit(href: string): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(RECENT_TOOLS_KEY);
    const existing: string[] = raw ? JSON.parse(raw) : [];
    const updated = [href, ...existing.filter((h) => h !== href)].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_TOOLS_KEY, JSON.stringify(updated));
  } catch {
    // localStorage unavailable — silent fail
  }
}

export function getRecentTools(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_TOOLS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
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
