import { describe, it, expect } from "vitest";
import {
  comparable,
  sideNotes,
  mmfIsIndependent,
  WHT_ON_INTEREST,
} from "../where-to-save";
import { MMF_SPREAD_OVER_TBILL_PCT } from "../mmf-assumption";
import { SPREAD_CONFIDENCE_PP } from "../mmf-vs-tbill";
import { SACCO_DEPOSIT_GUARANTEE_OPERATIONAL } from "../affiliate-links";

/**
 * The layer's whole job is a boundary: what may be ranked against what.
 *
 * A four-way ranking with a SACCO row would put an 8-15% band from December
 * 2025 above a dated Treasury bill and let the layout do the arguing. These
 * tests are the boundary, so it cannot quietly move.
 */

describe("only comparable things are compared", () => {
  const options = comparable();

  it("returns options at all", () => {
    // Everything below passes vacuously on an empty list.
    expect(options.length).toBeGreaterThan(1);
  });

  it("never includes a SACCO", () => {
    expect(options.some((o) => /sacco/i.test(o.key) || /sacco/i.test(o.label))).toBe(false);
  });

  it("never includes a bond", () => {
    // A bond's return depends on price paid and years held. A row in a ranking
    // invites comparing a fifteen-year commitment to a three-month one.
    expect(options.some((o) => /bond/i.test(o.key) || /bond/i.test(o.label))).toBe(false);
  });

  it("ranks by net return, best first", () => {
    const net = options.map((o) => o.netPct);
    expect([...net].sort((a, b) => b - a)).toEqual(net);
  });

  it("applies withholding tax to every option", () => {
    for (const o of options) {
      expect(o.netPct).toBeLessThan(o.grossPct);
      expect(o.netPct).toBeGreaterThan(0);
    }
  });

  it("labels the MMF as assumed and the bills as published", () => {
    // The distinction is the honesty: no MMF rate is published on the terms
    // the government's are, and printing both as quotes would say otherwise.
    const mmf = options.find((o) => o.key === "mmf");
    if (mmf) expect(mmf.basis).toBe("assumed");
    for (const bill of options.filter((o) => o.key.startsWith("tbill-"))) {
      expect(bill.basis).toBe("published");
    }
  });

  it("taxes the MMF at the same rate it taxes a bill", () => {
    const mmf = options.find((o) => o.key === "mmf");
    if (!mmf) return;
    expect(mmf.netPct).toBeCloseTo(mmf.grossPct * (1 - WHT_ON_INTEREST), 6);
  });

  it("says who stands behind each option", () => {
    for (const o of options) {
      expect(o.backing.trim().length).toBeGreaterThan(0);
      expect(o.lockUp.trim().length).toBeGreaterThan(0);
    }
  });
});

describe("what is held apart carries its reasons", () => {
  const notes = sideNotes();

  it("returns the SACCO note", () => {
    expect(notes).toHaveLength(1);
    expect(notes[0].key).toBe("sacco");
  });

  it("is a range, not a rate", () => {
    // The single most important property. A midpoint would read as a quote.
    expect(notes[0].highPct).toBeGreaterThan(notes[0].lowPct);
  });

  it("carries its date and source", () => {
    expect(notes[0].asOf).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(notes[0].source.length).toBeGreaterThan(10);
  });

  it("explains the dividend-not-interest distinction", () => {
    expect(notes[0].whyApart.join(' ')).toMatch(/dividend/i);
    expect(notes[0].whyApart.join(' ')).toMatch(/not interest/i);
  });

  it("names the guarantee gap while the fund is not operational", () => {
    // If the Fund is ever activated this must be revisited rather than left
    // asserting something untrue, so the test tracks the flag.
    if (!SACCO_DEPOSIT_GUARANTEE_OPERATIONAL) {
      expect(notes[0].whyApart.join(' ')).toMatch(/not yet operational/i);
    }
  });

  it("cannot hand back a figure without its reasons", () => {
    // The reasons travel with the number by construction. A caveat a component
    // may omit is one that eventually is omitted.
    for (const n of notes) expect(n.whyApart.length).toBeGreaterThanOrEqual(3);
  });
});

describe("the MMF comparison knows when it is not a comparison", () => {
  it("reports independence from the assumed spread", () => {
    expect(mmfIsIndependent()).toBe(MMF_SPREAD_OVER_TBILL_PCT !== 0);
  });

  it("is currently NOT independent, which a surface must be able to say", () => {
    // The spread is 0.0 today, so the assumed MMF yield IS the 91-day bill's.
    // Ranking them against each other in that state is a coin toss dressed as
    // analysis. This test documents the live state and will fail loudly if the
    // spread is ever changed without the copy being revisited.
    expect(mmfIsIndependent()).toBe(false);
  });
});

describe("ranking stops where the precision stops", () => {
  /**
   * The MMF and the 91-day bill carry an identical GROSS yield today, because
   * the assumed spread is 0.0 — and they still land ~4bp apart on net, because
   * an MMF quotes a nominal annual rate and a bill quotes an effective annual
   * yield, so tax lands over different periods.
   *
   * Sorted naively, four basis points of methodology rendered as the money
   * market fund beating a Treasury bill. `mmf-vs-tbill.ts` already fixed the
   * margin below which such a gap is not a finding; a table using the same
   * numbers must not contradict it.
   */
  const options = comparable();

  it("marks options within the confidence margin as level", () => {
    const best = options[0].netPct;
    for (const o of options) {
      expect(o.tiedWithBest).toBe(Math.abs(best - o.netPct) < SPREAD_CONFIDENCE_PP);
    }
  });

  it("the leader is always tied with itself", () => {
    expect(options[0].tiedWithBest).toBe(true);
  });

  it("today the MMF and the 91-day bill are level, not ranked", () => {
    // Documents the live state. If the assumed spread is ever widened this
    // fails, which is the moment the copy about them being level needs redoing.
    const mmf = options.find((o) => o.key === "mmf");
    const bill91 = options.find((o) => o.key === "tbill-91");
    if (!mmf || !bill91) return;
    expect(Math.abs(mmf.netPct - bill91.netPct)).toBeLessThan(SPREAD_CONFIDENCE_PP);
    expect(mmf.tiedWithBest && bill91.tiedWithBest).toBe(true);
  });
});
