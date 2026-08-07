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

  /* A share of nothing is unanswerable — returning 0 would render "0% of your
   * capacity" to somebody with commitments and no capacity, and Infinity/NaN
   * would reach a percentage in the UI. But refusing the SHARE must not mean
   * refusing the VERDICT: the `savingsCapacity > 0 &&` gate that used to sit
   * on overCommitted showed this reader the calm green "Unallocated Ksh 0"
   * row. They are the most over-committed reader on the site. */
  it("refuses the share but still calls a zero-capacity reader over-committed", () => {
    const broke: Calculations = {
      ...CALC,
      netMonthly: 0,
      budgetSplit: { needs: 0, socialObligations: 0, wants: 0, savings: 0 },
      savingsCapacity: 0,
    };
    const flow = buildCashFlow(broke, [goal({ goalType: "home", requiredMonthly: 5_000, years: 3 })])!;
    expect(flow.commitmentShare).toBeNull();
    expect(flow.overCommitted).toBe(true);
    expect(flow.shortfall).toBe(5_000);
    expect(flow.unallocated).toBe(0);
  });

  it("does not call a zero-capacity reader with no goals over-committed", () => {
    const broke: Calculations = {
      ...CALC,
      netMonthly: 0,
      budgetSplit: { needs: 0, socialObligations: 0, wants: 0, savings: 0 },
      savingsCapacity: 0,
    };
    expect(buildCashFlow(broke, [])!.overCommitted).toBe(false);
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
      expect(b.benchmark.low).toBeGreaterThan(0.01);
      expect(b.benchmark.high).toBeLessThan(0.5);
      expect(b.benchmark.low).toBeLessThanOrEqual(b.benchmark.high);
    }
    const bills = buildAllocationMap([]).filter((b) => b.benchmark?.basis === "net");
    expect(bills.length, "no net-of-tax benchmark resolved — the feed read is broken").toBeGreaterThan(0);
  });

  /* The feed sets medianClearingRate to null when too few auctions fell in a
   * band, and calls that a deliberate refusal. This asserts we propagate it
   * instead of borrowing the neighbouring band, which would put a term the
   * reader is not buying behind a number they would act on. If the feed later
   * starts quoting every band this becomes vacuous — hence the guard. */
  /* THE HORIZONS WIN, AND THE BANDS BEND TO THEM.
   *
   * The horizons describe what the money must be able to do; the feed's bands
   * describe how CBK groups its auctions. They were chosen independently and
   * do not line up.
   *
   * The first version resolved that by hardcoded label — "3–7y" for the 3-to-10
   * bucket, "12–20y" for 10-plus — and was wrong at both edges. An eight-year
   * goal was quoted a rate for a bond it would not be buying; a ten-year goal
   * likewise; and "7–12y", the DEEPEST sample in the feed at fifteen auctions,
   * was never used at all. */
  it("uses every band that overlaps a horizon, and skips none", async () => {
    const { RATES } = await import("../rates-feed");
    const bands = RATES.bondAuctionBenchmarks?.bands ?? [];
    expect(bands.length, "no bond bands in the snapshot — this test proves nothing").toBeGreaterThan(0);

    const map = buildAllocationMap([]);
    for (const bucket of map) {
      const { horizon, benchmark } = bucket;
      if (horizon.key === "now" || horizon.key === "short") continue; // bills, not bonds

      const overlapping = bands.filter(
        (b) =>
          b.medianClearingRate !== null &&
          b.fromYears < horizon.toYears &&
          b.toYears > horizon.fromYears
      );

      if (overlapping.length === 0) {
        expect(benchmark, `${horizon.key} quoted a band that does not overlap it`).toBeNull();
        continue;
      }
      const medians = overlapping.map((b) => b.medianClearingRate! / 100);
      expect(benchmark!.low).toBeCloseTo(Math.min(...medians), 10);
      expect(benchmark!.high).toBeCloseTo(Math.max(...medians), 10);
      expect(benchmark!.basis).toBe("gross");
      // The label names every band it drew on, so the reader can see the span.
      for (const b of overlapping) expect(benchmark!.label).toContain(b.label);
    }
  });

  it("no quotable band is orphaned across the bond horizons", async () => {
    const { RATES } = await import("../rates-feed");
    const bands = (RATES.bondAuctionBenchmarks?.bands ?? []).filter(
      (b) => b.medianClearingRate !== null
    );
    expect(bands.length, "no quotable bands — vacuous").toBeGreaterThan(1);

    const labels = buildAllocationMap([])
      .filter((b) => b.horizon.key === "medium" || b.horizon.key === "long")
      .flatMap((b) => (b.benchmark ? [b.benchmark.label] : []))
      .join(" | ");

    // "7–12y" is the one the hardcoded mapping dropped, and it carries the
    // largest auction sample in the feed.
    for (const band of bands) {
      if (band.toYears <= HORIZONS[2].fromYears) continue; // shorter than any bond horizon
      expect(labels, `band ${band.label} is quoted by no horizon`).toContain(band.label);
    }
  });
});
