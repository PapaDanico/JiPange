import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import {
  PRMF_MONTHLY_TAX_RELIEF_CAP,
  REAL_RETURN_DEFAULT,
  planKenyanRetirement,
} from "../retirement-kenya";
import { PRMF_LINKS } from "../affiliate-links";

/**
 * The post-retirement medical path, checked against the plan it splits out of.
 *
 * WHY THIS EXISTS AS AN OPTION AT ALL
 *
 * Kenya's Post-Retirement Medical Funds are RBA-regulated, contributions are
 * tax-deductible to Ksh 15,000 a month and withdrawals for treatment are
 * tax-exempt (Tax Laws (Amendment) Act 2024, in force 27 December 2024). That
 * relief is the point: it is the one retirement product here where the tax
 * treatment does real work, and paying for medical out of a taxed drawdown
 * instead is simply more expensive.
 *
 * WHAT THE SPLIT IS AND IS NOT
 *
 * It is NOT a second model. `medicalCapitalKes` was already the present value
 * of the medical stream; the PRMF view shows that same number as its own
 * target and the remainder as a living-only pot. Nothing is recomputed, which
 * is deliberate — two ways of arriving at one figure is how the two retirement
 * tools came to disagree by 1.79x earlier the same day.
 *
 * The invariant that matters: target + living-only must equal the whole pot.
 * If they ever stop adding up, the page is showing a reader two numbers that
 * do not describe one plan.
 *
 * THE RETURN ASSUMPTION IS SHARED, NOT FRESH
 *
 * A medical fund and a pension fund buy the same paper. The contribution
 * solver therefore uses the plan's own realReturn — ultimately derived from
 * Mwangaza's published rates feed via fire-evidence.ts — rather than inventing
 * a rate for the medical leg. A PRMF quietly assuming a better return than the
 * pension beside it would be exactly the unexamined optimism this codebase
 * keeps deleting.
 */
const BASE = {
  currentAge: 35,
  retirementAge: 60,
  currentMonthlyExpenses: 135_000,
  currentMonthlyMedical: 15_000,
};

describe("the PRMF-funded path", () => {
  it("splits the pot without changing it", () => {
    const r = planKenyanRetirement(BASE);
    expect(
      Math.round(r.prmf.targetKes + r.prmf.livingOnlyCapitalKes),
      "the medical target and the living-only pot do not add up to the plan"
    ).toBe(Math.round(r.capitalRequiredKes));
  });

  it("makes the medical target the same figure the plan already priced", () => {
    /* Not a parallel calculation. If these ever diverge, someone has started
     * computing medical twice. */
    const r = planKenyanRetirement(BASE);
    expect(r.prmf.targetKes).toBe(r.medicalCapitalKes);
  });

  it("leaves a materially smaller pension pot behind", () => {
    /* The reason to show this at all: a reader who pre-funds medical is aiming
     * at a visibly smaller pension number, and that is the actionable part. */
    const r = planKenyanRetirement(BASE);
    expect(r.prmf.livingOnlyCapitalKes).toBeLessThan(r.capitalRequiredKes);
    expect(r.prmf.targetKes, "medical priced at zero — the split says nothing").toBeGreaterThan(0);
  });

  it("solves the contribution at the plan's own real return, not a fresh one", () => {
    /* Checked by construction: a higher assumed return must need a smaller
     * monthly contribution for the same target. If the solver ignored
     * realReturn this would not move. */
    const slow = planKenyanRetirement({ ...BASE, realReturn: 0.01 });
    const fast = planKenyanRetirement({ ...BASE, realReturn: 0.06 });
    expect(fast.prmf.monthlyContributionKes).toBeLessThan(slow.prmf.monthlyContributionKes);
    expect(REAL_RETURN_DEFAULT).toBeGreaterThan(0);
  });

  it("reaches the target it was solved for", () => {
    /* The solver is only worth trusting if compounding the contribution
     * actually lands on the number. Future value of a level annual annuity,
     * against the target. */
    const r = planKenyanRetirement(BASE);
    const annual = r.prmf.monthlyContributionKes * 12;
    const n = r.yearsToRetirement;
    const fv = (annual * (Math.pow(1 + r.realReturn, n) - 1)) / r.realReturn;
    expect(Math.abs(fv - r.prmf.targetKes) / r.prmf.targetKes).toBeLessThan(0.01);
  });

  it("says whether the contribution fits inside the tax relief cap", () => {
    const r = planKenyanRetirement(BASE);
    expect(r.prmf.monthlyReliefCapKes).toBe(PRMF_MONTHLY_TAX_RELIEF_CAP);
    expect(r.prmf.withinReliefCap).toBe(
      r.prmf.monthlyContributionKes <= PRMF_MONTHLY_TAX_RELIEF_CAP
    );
    /* And it must actually be capable of reporting false, or the flag is
     * decoration. A household with a large medical budget exceeds the cap. */
    const heavy = planKenyanRetirement({ ...BASE, currentMonthlyMedical: 120_000 });
    expect(heavy.prmf.withinReliefCap).toBe(false);
  });

  it("is actually rendered, not merely computed", () => {
    /* The defect this codebase keeps finding: a derivative that exists, is
     * unit-tested, and is wired to nothing. `productSurveyIsStale()` did
     * exactly this — written, tested, rendered nowhere, so the one condition
     * it existed to catch was live in production with no reader ever told.
     *
     * A tax relief nobody is shown is worth precisely as much as no tax
     * relief, so the split has to reach the page or it has not been built. */
    const ui = readFileSync(
      new URL("../../components/tools/FireNumberCalculator.tsx", import.meta.url),
      "utf8"
    );
    const body = ui.slice(ui.indexOf("export default function"));
    expect(body, "the PRMF target is computed but never shown").toMatch(/prmf\.targetKes/);
    expect(body, "the reduced pension pot is not shown").toMatch(/prmf\.livingOnlyCapitalKes/);
    expect(body, "the contribution needed is not shown").toMatch(
      /prmf\.monthlyContributionKes/
    );
    expect(body, "the relief cap is not mentioned to the reader").toMatch(
      /prmf\.monthlyReliefCapKes/
    );
  });

  it("lists only funds a reader can actually join", () => {
    /* KPPF, MURBS, KPA and the TSC scheme all run PRMFs and are all closed to
     * their own sectors — Kenya Power, Maseno, the ports, teachers. Listing a
     * fund somebody cannot join is worse than listing none, so they are named
     * in a comment in affiliate-links.ts and not on a card. */
    expect(PRMF_LINKS.length, "no PRMF providers listed").toBeGreaterThan(0);
    for (const p of PRMF_LINKS) {
      expect(p.regulator, `${p.slug} is not shown as RBA-regulated`).toBe("RBA");
      expect(p.url, `${p.slug} has no verified link`).toBeTruthy();
      expect(
        p.isAffiliate,
        `${p.slug} is marked as an affiliate — no such arrangement exists`
      ).toBe(false);
    }
    const closed = /kppf|murbs|kpa pension|tsc/i;
    for (const p of PRMF_LINKS) {
      expect(p.name, `${p.name} is a closed sector scheme`).not.toMatch(closed);
    }
  });
});
