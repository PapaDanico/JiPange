import type { Calculations } from "./types";
import { BUDGET_ALLOCATION, formatKES } from "./budget";
import type { JourneyAnswers } from "./journey";

/* "target" is not a grade.
 *
 * The other four say how the reader is DOING. A target says what the plan
 * asks of them, which is a different kind of statement and must not be
 * dressed as an achievement — see savingsTargetIndicator below for what went
 * wrong when it was. */
export type IndicatorStatus = "strong" | "good" | "building" | "risk" | "target" | "unknown";

export interface ReadinessIndicator {
  key: string;
  label: string;
  status: IndicatorStatus;
  statusLabel: string;
  hint?: string;
  href?: string;
}

export interface ReadinessData {
  indicators: ReadinessIndicator[];
}

function emergencyBufferIndicator(journey: JourneyAnswers | null): ReadinessIndicator {
  const key = "buffer";
  const label = "Emergency Buffer";
  if (!journey) return { key, label, status: "unknown", statusLabel: "No data" };

  if (journey.liquidity_leak === "mobile_loans") {
    return {
      key, label, status: "risk", statusLabel: "At Risk",
      hint: "Expensive credit fills the gap — see what it costs.",
      href: "/tools/fuliza-cost",
    };
  }
  if (journey.liquidity_leak === "active_savings") {
    return {
      key, label, status: "strong", statusLabel: "Buffered",
      hint: "See how long your savings last.",
      href: "/tools/money-runway",
    };
  }
  return {
    key, label, status: "building", statusLabel: "Exposed",
    hint: "No dedicated buffer yet — set a savings goal.",
    href: "/tools/savings-goal",
  };
}

function vehicleIndicator(journey: JourneyAnswers | null): ReadinessIndicator {
  const key = "vehicle";
  const label = "Money Vehicle";
  if (!journey) return { key, label, status: "unknown", statusLabel: "No data" };

  const v = journey.current_vehicle;
  const hasMmf = v.includes("mmf");
  const hasSacco = v.includes("sacco");

  if (hasMmf && hasSacco) return { key, label, status: "strong", statusLabel: "Diversified" };
  if (hasMmf || hasSacco) return { key, label, status: "good", statusLabel: "Working" };
  if (v.includes("none")) {
    return {
      key, label, status: "risk", statusLabel: "Undeployed",
      hint: "See what an MMF earns versus a bank account.",
      href: "/tools/investment-returns",
    };
  }
  return {
    key, label, status: "building", statusLabel: "Idle (M-Pesa/Bank)",
    hint: "Inflation erodes bank balances — see how much.",
    href: "/tools/inflation-reality",
  };
}

function savingsTargetIndicator(calculations: Calculations | null): ReadinessIndicator {
  const key = "savings";
  const label = "Savings Target";
  if (!calculations) return { key, label, status: "unknown", statusLabel: "No data" };

  /* THIS USED TO CLAIM TO MEASURE THE READER'S SAVINGS RATE. IT COULD NOT.
   *
   * `calculations.savingsRate` is not a measurement. calculateFinancials
   * returns
   *
   *     budgetSplit.savings / netMonthly
   *       ==  (netMonthly * BUDGET_ALLOCATION.savings) / netMonthly
   *       ==  0.2
   *
   * for every reader with any income at all — the app's own recommended
   * allocation, divided straight back out. So the old indicator computed
   * Math.round(0.2 * 100) = 20, hit its `rate >= 20` branch, and told every
   * single reader who had entered a salary:
   *
   *     "20%   ·   Strong"
   *
   * Its `good`, `building` and `risk` branches could not be reached by any
   * input. A reader saving nothing was congratulated in the same words as a
   * reader saving a third of their pay, and the app had no way to tell them
   * apart because it never asked.
   *
   * That is this codebase's signature failure — an assumption presented as a
   * finding — and it has been removed twice before: the hardcoded MMF yields,
   * and peer dispersion shown as forecast confidence.
   *
   * WHAT IT SAYS NOW
   *
   * The one honest thing available from a salary alone: what the guideline
   * works out to in shillings for THIS reader. That figure does vary — it is
   * a fifth of their own take-home — and it is labelled a target rather than
   * a status, with a neutral badge, because the app still does not know what
   * they actually save.
   *
   * Measuring the real rate needs the reader to tell us what they put away.
   * Until they are asked, saying so is the truthful answer.
   */
  const share = Math.round(BUDGET_ALLOCATION.savings * 100);
  return {
    key,
    label,
    status: "target",
    statusLabel: `${formatKES(calculations.budgetSplit.savings)}/mo`,
    hint: `${share}% of your take-home — the plan, not a measure of what you save.`,
    href: "/tools/savings-goal",
  };
}

function goalIndicator(journey: JourneyAnswers | null, hasGoals: boolean): ReadinessIndicator {
  const key = "goal";
  const label = "Goal Status";
  if (!journey && !hasGoals) return { key, label, status: "unknown", statusLabel: "No data" };
  if (hasGoals) return { key, label, status: "strong", statusLabel: "Goal active" };
  if (journey?.primary_goal === "clear_debt") {
    return {
      key, label, status: "building", statusLabel: "Debt exit active",
      hint: "Build your payoff plan.",
      href: "/tools/debt-escape",
    };
  }
  return {
    key, label, status: "building", statusLabel: "Goal set, no plan",
    hint: "Turn your goal into a monthly number.",
    href: "/tools/savings-goal",
  };
}

export function computeReadiness(
  calculations: Calculations | null,
  journey: JourneyAnswers | null,
  hasGoals: boolean,
): ReadinessData | null {
  if (!calculations && !journey && !hasGoals) return null;
  return {
    indicators: [
      emergencyBufferIndicator(journey),
      vehicleIndicator(journey),
      savingsTargetIndicator(calculations),
      goalIndicator(journey, hasGoals),
    ],
  };
}
