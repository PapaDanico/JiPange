import { describe, expect, it } from "vitest";
import {
  buildGoalPlan,
  solveYearsToInflatingTarget,
  solveYearsToTarget,
} from "../goal-planner";
import { futureValue, inflateToFutureCost } from "../projections";

describe("solveYearsToTarget", () => {
  it("returns 0 when the target is already covered by current savings", () => {
    expect(
      solveYearsToTarget({
        targetAmount: 100_000,
        presentValue: 120_000,
        monthlyContribution: 5_000,
        annualRate: 0.09,
      })
    ).toBe(0);
  });

  it("is the inverse of futureValue", () => {
    const years = solveYearsToTarget({
      targetAmount: 500_000,
      presentValue: 50_000,
      monthlyContribution: 10_000,
      annualRate: 0.09,
    });
    const reached = futureValue(50_000, 10_000, 0.09, years);
    expect(reached).toBeCloseTo(500_000, 0);
  });

  it("handles a zero interest rate linearly", () => {
    // 240,000 shortfall at 10,000/month = 24 months = 2 years
    expect(
      solveYearsToTarget({
        targetAmount: 240_000,
        presentValue: 0,
        monthlyContribution: 10_000,
        annualRate: 0,
      })
    ).toBeCloseTo(2, 5);
  });

  it("returns Infinity when nothing is contributed and nothing grows", () => {
    expect(
      solveYearsToTarget({
        targetAmount: 100_000,
        presentValue: 0,
        monthlyContribution: 0,
        annualRate: 0,
      })
    ).toBe(Infinity);
    expect(
      solveYearsToTarget({
        targetAmount: 100_000,
        presentValue: 0,
        monthlyContribution: 0,
        annualRate: 0.09,
      })
    ).toBe(Infinity);
  });

  it("reaches a target on growth alone when there are current savings", () => {
    const years = solveYearsToTarget({
      targetAmount: 200_000,
      presentValue: 100_000,
      monthlyContribution: 0,
      annualRate: 0.09,
    });
    expect(years).toBeGreaterThan(7);
    expect(futureValue(100_000, 0, 0.09, years)).toBeCloseTo(200_000, 0);
  });
});

describe("solveYearsToInflatingTarget", () => {
  it("needs longer than the fixed-target solve, because the target keeps moving", () => {
    const fixed = solveYearsToTarget({
      targetAmount: inflateToFutureCost(800_000, 8),
      monthlyContribution: 5_000,
      annualRate: 0.09,
    });
    const inflating = solveYearsToInflatingTarget({
      todayValue: 800_000,
      monthlyContribution: 5_000,
      annualRate: 0.09,
    });
    expect(inflating).toBeGreaterThan(fixed);
  });

  it("lands where savings equal the inflated cost at that same horizon", () => {
    const years = solveYearsToInflatingTarget({
      todayValue: 800_000,
      monthlyContribution: 5_000,
      annualRate: 0.09,
    });
    const saved = futureValue(0, 5_000, 0.09, years);
    const cost = inflateToFutureCost(800_000, years);
    expect(saved).toBeCloseTo(cost, 0);
  });

  it("returns 0 when current savings already cover today's value", () => {
    expect(
      solveYearsToInflatingTarget({
        todayValue: 100_000,
        presentValue: 100_000,
        monthlyContribution: 0,
        annualRate: 0.09,
      })
    ).toBe(0);
  });

  it("returns Infinity when contributions can never outpace inflation", () => {
    // 2% return vs 6.5% inflation, tiny contribution against a big target.
    expect(
      solveYearsToInflatingTarget({
        todayValue: 10_000_000,
        monthlyContribution: 100,
        annualRate: 0.02,
      })
    ).toBe(Infinity);
  });
});

describe("buildGoalPlan", () => {
  const base = {
    targetAmount: 800_000,
    years: 8,
    annualReturn: 0.09,
  };

  it("solves the required monthly contribution", () => {
    const plan = buildGoalPlan(base);
    // Verify by round-trip: contributing requiredMonthly reaches the target.
    expect(futureValue(0, plan.requiredMonthly, 0.09, 8)).toBeCloseTo(800_000, 0);
  });

  it("grades feasibility as unknown without capacity", () => {
    const plan = buildGoalPlan(base);
    expect(plan.feasibility).toBe("unknown");
    expect(plan.capacityShare).toBeNull();
    expect(plan.yearsAtCapacity).toBeNull();
    expect(plan.amountAtCapacityByTargetDate).toBeNull();
  });

  it("grades comfortable / tight / stretch / beyond-reach bands", () => {
    const required = buildGoalPlan(base).requiredMonthly;
    expect(buildGoalPlan({ ...base, monthlyCapacity: required * 4 }).feasibility).toBe(
      "comfortable"
    );
    expect(buildGoalPlan({ ...base, monthlyCapacity: required / 0.7 }).feasibility).toBe("tight");
    expect(buildGoalPlan({ ...base, monthlyCapacity: required / 0.95 }).feasibility).toBe(
      "stretch"
    );
    expect(buildGoalPlan({ ...base, monthlyCapacity: required / 2 }).feasibility).toBe(
      "beyond-reach"
    );
  });

  it("computes both levers when the goal is beyond reach", () => {
    const required = buildGoalPlan(base).requiredMonthly;
    const capacity = required / 2;
    const plan = buildGoalPlan({ ...base, monthlyCapacity: capacity });

    // Lever 1: longer timeline at full capacity.
    expect(plan.yearsAtCapacity).not.toBeNull();
    expect(plan.yearsAtCapacity!).toBeGreaterThan(8);

    // Lever 2: smaller amount by the original date.
    expect(plan.amountAtCapacityByTargetDate).not.toBeNull();
    expect(plan.amountAtCapacityByTargetDate!).toBeLessThan(800_000);
    expect(plan.amountAtCapacityByTargetDate!).toBeCloseTo(
      futureValue(0, capacity, 0.09, 8),
      5
    );
  });

  it("uses the inflating-target solve for the timeline lever when targetInflation is set", () => {
    const todayValue = 800_000;
    const years = 8;
    const capacity = 5_000;
    const withInflation = buildGoalPlan({
      targetAmount: inflateToFutureCost(todayValue, years),
      years,
      annualReturn: 0.09,
      monthlyCapacity: capacity,
      targetInflation: { todayValue },
    });
    const withoutInflation = buildGoalPlan({
      targetAmount: inflateToFutureCost(todayValue, years),
      years,
      annualReturn: 0.09,
      monthlyCapacity: capacity,
    });
    expect(withInflation.yearsAtCapacity!).toBeGreaterThan(withoutInflation.yearsAtCapacity!);
    // Saving full capacity for the suggested years must actually cover the
    // cost as inflated to that same horizon — the lever keeps its promise.
    const n = withInflation.yearsAtCapacity!;
    expect(futureValue(0, capacity, 0.09, n)).toBeGreaterThanOrEqual(
      inflateToFutureCost(todayValue, n) - 1
    );
  });

  it("treats an already-funded goal as comfortable with zero required", () => {
    const plan = buildGoalPlan({
      ...base,
      currentSavings: 1_000_000,
      monthlyCapacity: 5_000,
    });
    expect(plan.requiredMonthly).toBe(0);
    expect(plan.feasibility).toBe("comfortable");
  });

  it("counts current savings toward the requirement", () => {
    const withSavings = buildGoalPlan({ ...base, currentSavings: 200_000 });
    const without = buildGoalPlan(base);
    expect(withSavings.requiredMonthly).toBeLessThan(without.requiredMonthly);
  });

  it("ignores a zero capacity rather than dividing by it", () => {
    const plan = buildGoalPlan({ ...base, monthlyCapacity: 0 });
    expect(plan.feasibility).toBe("unknown");
    expect(plan.capacityShare).toBeNull();
  });
});
