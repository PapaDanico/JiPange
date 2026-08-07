import { describe, expect, it } from "vitest";
import {
  HORIZONS,
  buildAllocationMap,
  buildCashFlow,
  horizonFor,
  remainingCapacity,
  totalCommitted,
} from "../dashboard";
import type { SavedGoal } from "../storage";
import type { Calculations } from "../types";

function goal(over: Partial<SavedGoal> & Pick<SavedGoal, "goalType" | "requiredMonthly" | "years">): SavedGoal {
  return {
    title: over.goalType,
    emoji: "🎯",
    amountToday: 1_000_000,
    nominalTarget: 1_200_000,
    savedAt: "2026-08-07T00:00:00.000Z",
    ...over,
  } as SavedGoal;
}

const CALC: Calculations = {
  netMonthly: 100_000,
  budgetSplit: { needs: 50_000, socialObligations: 15_000, wants: 15_000, savings: 20_000 },
  savingsCapacity: 20_000,
  savingsRate: 0.2,
};

describe("buildCashFlow", () => {
  it("closes: living costs plus capacity equal take-home pay", () => {
    const flow = buildCashFlow(CALC, [])!;
    expect(flow.livingCost + flow.savingsCapacity).toBe(flow.netMonthly);
  });

  it("splits capacity into committed and unallocated when goals fit", () => {
    const flow = buildCashFlow(CALC, [goal({ goalType: "home", requiredMonthly: 8_000, years: 5 })])!;
    expect(flow.committed).toBe(8_000);
    expect(flow.unallocated).toBe(12_000);
    expect(flow.shortfall).toBe(0);
    expect(flow.overCommitted).toBe(false);
    expect(flow.commitmentShare).toBeCloseTo(0.4, 10);
  });

  /* THE CASE THE WHOLE MODULE EXISTS FOR. Each of these graded "comfortable"
   * on its own against the full 20,000 — because each planner compared itself
   * to the full capacity and none could see the other four. */
  it("reports the shortfall when five individually-affordable goals collide", () => {
    const goals = ["education", "home", "emergency", "retirement", "business"].map((t, i) =>
      goal({ goalType: t, requiredMonthly: 12_000, years: i + 1 })
    );
    const flow = buildCashFlow(CALC, goals)!;
    expect(flow.committed).toBe(60_000);
    expect(flow.overCommitted).toBe(true);
    expect(flow.shortfall).toBe(40_000);
    // Never negative — an over-committed reader has nothing spare, not minus 40k.
    expect(flow.unallocated).toBe(0);
  });

  /* A share of nothing is unanswerable. Returning 0 would render "0% of your
   * capacity" to somebody with commitments and no capacity, and Infinity/NaN
   * would reach a percentage in the UI. */
  it("refuses a commitment share when there is no capacity", () => {
    const broke: Calculations = {
      ...CALC,
      netMonthly: 0,
      budgetSplit: { needs: 0, socialObligations: 0, wants: 0, savings: 0 },
      savingsCapacity: 0,
    };
    const flow = buildCashFlow(broke, [goal({ goalType: "home", requiredMonthly: 5_000, years: 3 })])!;
    expect(flow.commitmentShare).toBeNull();
    // With no capacity to exceed, "over-committed" is not a claim we can make.
    expect(flow.overCommitted).toBe(false);
  });

  it("returns null rather than a zeroed page when there is no profile", () => {
    expect(buildCashFlow(null, [])).toBeNull();
  });

  it("ignores a goal that stored a non-finite required monthly", () => {
    expect(totalCommitted([goal({ goalType: "x", requiredMonthly: Infinity, years: 2 })])).toBe(0);
    expect(totalCommitted([goal({ goalType: "x", requiredMonthly: NaN, years: 2 })])).toBe(0);
  });
});

describe("remainingCapacity", () => {
  const goals = [
    goal({ goalType: "education", requiredMonthly: 6_000, years: 8 }),
    goal({ goalType: "home", requiredMonthly: 5_000, years: 4 }),
  ];

  it("takes other goals off the top", () => {
    expect(remainingCapacity(20_000, goals)).toBe(9_000);
  });

  /* Reopening a saved goal must not count the goal against itself, or every
   * plan would read as unaffordable the second time you looked at it. */
  it("excludes the goal being replanned", () => {
    // Excluding home leaves education's 6,000 claimed: 20,000 − 6,000.
    expect(remainingCapacity(20_000, goals, "home")).toBe(14_000);
    expect(remainingCapacity(20_000, goals, "education")).toBe(15_000);
  });

  it("floors at zero rather than handing the engine a negative capacity", () => {
    expect(remainingCapacity(5_000, goals)).toBe(0);
  });

  it("is zero for an absent or nonsensical capacity", () => {
    expect(remainingCapacity(0, [])).toBe(0);
    expect(remainingCapacity(-1, [])).toBe(0);
    expect(remainingCapacity(Infinity, [])).toBe(0);
  });
});

describe("horizonFor", () => {
  it("puts each year on the side of the boundary the vehicle can serve", () => {
    expect(horizonFor(0).key).toBe("now");
    expect(horizonFor(0.5).key).toBe("now");
    // One year exactly is NOT "within a year" — a 364-day bill lands in time.
    expect(horizonFor(1).key).toBe("short");
    expect(horizonFor(2.9).key).toBe("short");
    expect(horizonFor(3).key).toBe("medium");
    expect(horizonFor(9.9).key).toBe("medium");
    expect(horizonFor(10).key).toBe("long");
    expect(horizonFor(40).key).toBe("long");
  });

  it("never falls through — every finite year lands in exactly one bucket", () => {
    for (let y = 0; y <= 60; y += 0.25) {
      const hits = HORIZONS.filter((h) => y >= h.fromYears && y < h.toYears);
      expect(hits, `${y} years matched ${hits.length} buckets`).toHaveLength(1);
    }
  });

  it("degrades to the nearest bucket rather than throwing on junk", () => {
    expect(horizonFor(NaN).key).toBe("now");
    expect(horizonFor(-5).key).toBe("now");
    expect(horizonFor(Infinity).key).toBe("long");
  });
});

describe("buildAllocationMap", () => {
  const goals = [
    goal({ goalType: "emergency", requiredMonthly: 4_000, years: 0.5 }),
    goal({ goalType: "home", requiredMonthly: 6_000, years: 4 }),
    goal({ goalType: "retirement", requiredMonthly: 10_000, years: 25 }),
  ];

  it("keeps all four buckets even when empty", () => {
    const map = buildAllocationMap(goals);
    expect(map).toHaveLength(4);
    // The gap is the finding — a reader with nothing inside a year has no
    // emergency money, and dropping the empty row would hide that.
    expect(map.find((b) => b.horizon.key === "short")!.goals).toEqual([]);
  });

  it("routes each goal by its horizon and shares sum to one", () => {
    const map = buildAllocationMap(goals);
    const by = Object.fromEntries(map.map((b) => [b.horizon.key, b]));
    expect(by.now.goals.map((g) => g.goalType)).toEqual(["emergency"]);
    expect(by.medium.goals.map((g) => g.goalType)).toEqual(["home"]);
    expect(by.long.goals.map((g) => g.goalType)).toEqual(["retirement"]);
    expect(map.reduce((s, b) => s + b.monthly, 0)).toBe(20_000);
    expect(map.reduce((s, b) => s + (b.share ?? 0), 0)).toBeCloseTo(1, 10);
  });

  it("refuses a share rather than dividing by zero when nothing is committed", () => {
    for (const b of buildAllocationMap([])) {
      expect(b.share).toBeNull();
      expect(b.monthly).toBe(0);
    }
  });

  /* Every quoted rate must come from the feed with its basis attached. A bill
   * figure is net of 15% withholding; a bond auction rate is gross. Showing
   * them side by side unlabelled invites the comparison a reader must not
   * make, and computing a net bond figure would mean guessing a withholding
   * band (0% IFB / 10% at 10y+ / 15% below) the feed does not publish. */
  it("labels every benchmark with its tax basis and a plausible rate", () => {
    for (const b of buildAllocationMap([])) {
      if (b.benchmark === null) continue; // a refusal, asserted below
      expect(["net", "gross"]).toContain(b.benchmark.basis);
      expect(b.benchmark.label.length).toBeGreaterThan(0);
      expect(b.benchmark.rate).toBeGreaterThan(0.01);
      expect(b.benchmark.rate).toBeLessThan(0.5);
    }
    const bills = buildAllocationMap([]).filter((b) => b.benchmark?.basis === "net");
    expect(bills.length, "no net-of-tax benchmark resolved — the feed read is broken").toBeGreaterThan(0);
  });

  /* The feed sets medianClearingRate to null when too few auctions fell in a
   * band, and calls that a deliberate refusal. This asserts we propagate it
   * instead of borrowing the neighbouring band, which would put a term the
   * reader is not buying behind a number they would act on. If the feed later
   * starts quoting every band this becomes vacuous — hence the guard. */
  it("propagates the feed's refusal rather than borrowing a neighbouring band", async () => {
    const { RATES } = await import("../rates-feed");
    const bands = RATES.bondAuctionBenchmarks?.bands ?? [];
    expect(bands.length, "no bond bands in the snapshot — this test proves nothing").toBeGreaterThan(0);

    const map = buildAllocationMap([]);
    for (const key of ["medium", "long"] as const) {
      const bucket = map.find((b) => b.horizon.key === key)!;
      const label = key === "medium" ? "3–7y" : "12–20y";
      const band = bands.find((x) => x.label === label);
      expect(band, `band ${label} vanished from the feed — the mapping is stale`).toBeDefined();
      if (band!.medianClearingRate === null) {
        expect(bucket.benchmark).toBeNull();
      } else {
        expect(bucket.benchmark!.rate).toBeCloseTo(band!.medianClearingRate / 100, 10);
        expect(bucket.benchmark!.basis).toBe("gross");
      }
    }
  });
});
