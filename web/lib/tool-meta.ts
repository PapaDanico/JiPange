export interface ToolMeta {
  href: string;
  icon: string;
  name: string;
  related: string[];
}

export const TOOL_META: Record<string, ToolMeta> = {
  "/tools/take-home-pay": {
    href: "/tools/take-home-pay",
    icon: "💰",
    name: "Take-Home Pay",
    related: ["/tools/tax-shield", "/tools/salary-negotiation", "/tools/budget-split"],
  },
  "/tools/investment-returns": {
    href: "/tools/investment-returns",
    icon: "📈",
    name: "Investment Returns",
    related: ["/tools/savings-goal", "/tools/fire-number", "/tools/dhowcsd"],
  },
  "/tools/money-runway": {
    href: "/tools/money-runway",
    icon: "⏳",
    name: "Money Runway",
    related: ["/tools/savings-goal", "/tools/budget-split", "/planners/emergency"],
  },
  "/tools/guarantor-shield": {
    href: "/tools/guarantor-shield",
    icon: "🎯",
    name: "Guarantor Shield",
    related: ["/tools/sacco-vs-bank", "/tools/one-third-rule", "/tools/loan-repayment"],
  },
  "/tools/kplc-optimizer": {
    href: "/tools/kplc-optimizer",
    icon: "⚡",
    name: "KPLC Optimizer",
    related: ["/tools/budget-split", "/tools/payday-router"],
  },
  "/tools/fuliza-cost": {
    href: "/tools/fuliza-cost",
    icon: "📱",
    name: "Fuliza Cost",
    related: ["/tools/payday-router", "/tools/savings-goal", "/tools/budget-split"],
  },
  "/tools/inflation-reality": {
    href: "/tools/inflation-reality",
    icon: "📉",
    name: "Inflation Reality",
    related: ["/tools/investment-returns", "/tools/dhowcsd", "/tools/savings-goal"],
  },
  "/tools/savings-goal": {
    href: "/tools/savings-goal",
    icon: "🎯",
    name: "Savings Goal",
    related: ["/tools/investment-returns", "/tools/budget-split", "/tools/money-runway"],
  },
  "/tools/loan-repayment": {
    href: "/tools/loan-repayment",
    icon: "🏦",
    name: "Loan Repayment",
    related: ["/tools/sacco-vs-bank", "/tools/one-third-rule", "/tools/guarantor-shield"],
  },
  "/tools/fire-number": {
    href: "/tools/fire-number",
    icon: "🔥",
    name: "FIRE Number",
    related: ["/tools/investment-returns", "/tools/savings-goal", "/tools/money-runway"],
  },
  "/tools/sacco-vs-bank": {
    href: "/tools/sacco-vs-bank",
    icon: "⚖️",
    name: "SACCO vs Bank",
    related: ["/tools/loan-repayment", "/tools/guarantor-shield", "/tools/one-third-rule"],
  },
  "/tools/budget-split": {
    href: "/tools/budget-split",
    icon: "🥧",
    name: "Budget Split",
    related: ["/tools/payday-router", "/tools/savings-goal", "/tools/take-home-pay"],
  },
  "/tools/education-savings": {
    href: "/tools/education-savings",
    icon: "🎓",
    name: "Education Savings",
    related: ["/tools/savings-goal", "/planners/education", "/tools/investment-returns"],
  },
  "/tools/dhowcsd": {
    href: "/tools/dhowcsd",
    icon: "🏆",
    name: "DhowCSD T-Bill Ladder",
    related: ["/tools/investment-returns", "/tools/inflation-reality", "/tools/fire-number"],
  },
  "/tools/salary-negotiation": {
    href: "/tools/salary-negotiation",
    icon: "💼",
    name: "Salary Negotiation",
    related: ["/tools/take-home-pay", "/tools/tax-shield", "/tools/budget-split"],
  },
  "/tools/tax-shield": {
    href: "/tools/tax-shield",
    icon: "🧾",
    name: "Tax Shield",
    related: ["/tools/take-home-pay", "/tools/salary-negotiation", "/tools/fire-number"],
  },
  "/tools/payday-router": {
    href: "/tools/payday-router",
    icon: "📱",
    name: "Payday Router",
    related: ["/tools/budget-split", "/tools/fuliza-cost", "/tools/savings-goal"],
  },
  "/tools/one-third-rule": {
    href: "/tools/one-third-rule",
    icon: "⚠️",
    name: "1/3 Rule Checker",
    related: ["/tools/sacco-vs-bank", "/tools/loan-repayment", "/tools/guarantor-shield"],
  },
  "/tools/chama": {
    href: "/tools/chama",
    icon: "🤝",
    name: "Chama Group Savings",
    related: ["/tools/savings-goal", "/tools/investment-returns", "/tools/sacco-vs-bank"],
  },
  "/tools/hustle-smoother": {
    href: "/tools/hustle-smoother",
    icon: "🔄",
    name: "Hustle Income Smoother",
    related: ["/tools/budget-split", "/tools/savings-goal", "/planners/hustle"],
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
