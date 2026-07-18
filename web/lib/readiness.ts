import type { Calculations, Profile } from "./types";
import type { JourneyAnswers } from "./journey";

export type IndicatorStatus = "strong" | "good" | "building" | "risk" | "unknown";

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

function savingsRateIndicator(calculations: Calculations | null): ReadinessIndicator {
  const key = "savings";
  const label = "Savings Rate";
  if (!calculations) return { key, label, status: "unknown", statusLabel: "No data" };

  const rate = Math.round(calculations.savingsRate);
  if (rate >= 20) return { key, label, status: "strong", statusLabel: `${rate}%` };
  if (rate >= 10) return { key, label, status: "good", statusLabel: `${rate}%` };
  if (rate >= 5) {
    return {
      key, label, status: "building", statusLabel: `${rate}%`,
      hint: "Model your salary and target a higher slice.",
      href: "/tools/salary",
    };
  }
  return {
    key, label, status: "risk", statusLabel: rate > 0 ? `${rate}%` : "Not set",
    hint: "Start with your salary breakdown.",
    href: "/tools/salary",
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
  _profile: Profile | null,
  calculations: Calculations | null,
  journey: JourneyAnswers | null,
  hasGoals: boolean,
): ReadinessData | null {
  if (!calculations && !journey && !hasGoals) return null;
  return {
    indicators: [
      emergencyBufferIndicator(journey),
      vehicleIndicator(journey),
      savingsRateIndicator(calculations),
      goalIndicator(journey, hasGoals),
    ],
  };
}
