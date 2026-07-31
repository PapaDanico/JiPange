import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  realRate,
  realYieldBoard,
  checkPlanningRatePremise,
  nominalToToday,
} from '../fire-evidence';
import { REAL_RETURN_DEFAULT } from '../retirement-kenya';
import { currentInflation, inflationAttribution, RATES } from '../rates-feed';
import { earlyStartMultiple, earlyStartMultipleReal, RETIRE_AT_AGE } from '../tool-stats';
import { DEFAULT_RETIREMENT_AGE } from '../projections';

/**
 * The planning rate is justified by market conditions, so the justification
 * has to be re-checked when the market moves.
 *
 * retirement-kenya.ts argues for 3% real on the grounds that it sits below
 * every long-bond real yield and above the T-bill real yield. That was a
 * comment: an assertion about the market, written once, never re-read. If long
 * bonds fell to 2% real the sentence would quietly become false while the app
 * kept quoting 3% with the same confidence.
 */
describe('the 3% planning rate, against the current Mwangaza snapshot', () => {
  it('uses Fisher rather than subtracting inflation', () => {
    // At Kenyan rates the shortcut is worth ~0.3pp, which is 10% of the whole
    // planning rate — not a rounding detail at this magnitude.
    const naive = 0.1 - 0.0641;
    const exact = realRate(0.1, 0.0641);
    expect(exact).toBeLessThan(naive);
    expect(naive - exact).toBeGreaterThan(0.002);
  });

  it('still holds: bills below the planning rate, long bonds above it', () => {
    const p = checkPlanningRatePremise();
    expect(
      p.aboveAllBills,
      'a T-bill now beats the planning rate in real terms — 3% is no longer the cautious floor it was chosen to be'
    ).toBe(true);
    expect(
      p.belowAllLongBonds,
      'long bonds have fallen to or below the planning rate — the plan now depends on conditions improving, which is the opposite of its stated design'
    ).toBe(true);
    expect(p.holds).toBe(true);
  });

  it('says so plainly when the premise fails, rather than only when it holds', () => {
    // The failure branch is the one that matters and the one never exercised
    // in production. A summary that only reads well when things are fine is a
    // summary nobody has checked.
    const p = checkPlanningRatePremise();
    expect(p.summary).toMatch(/%/);
    expect(p.summary.length).toBeGreaterThan(80);
    expect(p.attribution).toMatch(/Mwangaza/i);
  });

  it('quotes only bands the feed is willing to quote', () => {
    // The feed publishes null for bands with too few auctions. Substituting a
    // neighbour would invent a yield out of a deliberate refusal.
    const board = realYieldBoard();
    expect(board.length).toBeGreaterThan(2);
    for (const r of board) {
      expect(Number.isFinite(r.netReal), `${r.label} produced a non-finite real yield`).toBe(true);
      expect(r.netNominal).toBeGreaterThan(0);
      expect(r.side).toBe(r.netReal < REAL_RETURN_DEFAULT ? 'below' : 'above');
    }
    // Sorted cheapest first, so the table reads as a ladder.
    const reals = board.map((r) => r.netReal);
    expect([...reals].sort((a, b) => a - b)).toEqual(reals);
  });

  it('nets bond yields down for withholding tax by term', () => {
    // 10% at ten years or longer, 15% below. Quoting gross would flatter every
    // band and break the comparison against net T-bill yields.
    const board = realYieldBoard();
    const bond = board.find((r) => r.label.includes('bond'));
    expect(bond).toBeTruthy();
    const gross = bond!.netNominal / 0.85;
    expect(bond!.netNominal).toBeLessThan(gross);
  });
});

describe('nominal against real', () => {
  it('shows the same lever smaller in real terms, and both are computed', () => {
    // The card used to quote the nominal multiple above a calculator working
    // entirely in today's money. Neither number was wrong; putting them in the
    // same place without units was.
    const nominal = earlyStartMultiple();
    const real = earlyStartMultipleReal();
    expect(real).toBeLessThan(nominal);
    expect(real).toBeGreaterThan(1);
    // If inflation ever exceeded the assumed return, "starting early" would
    // still win — compounding a bigger negative is not the claim being made.
    expect(real).toBeGreaterThan(1.2);
  });

  it('deflates a nominal figure by the feed inflation, not a typed constant', () => {
    const years = 27;
    const n = nominalToToday(4_937_107, years);
    const expected = 4_937_107 / Math.pow(1 + currentInflation(), years);
    expect(n.todayKes).toBeCloseTo(expected, 6);
    expect(n.shrinkFactor).toBeGreaterThan(3);
  });
});

/**
 * The reasoning has to be on the page, not only in the module.
 *
 * Everything the education section says already existed as comments in
 * retirement-kenya.ts and was the best writing in the module — where no reader
 * could reach it.
 */
describe('the reasoning reaches the reader', () => {
  const read = (p: string) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');

  it('renders the education section on the FIRE page', () => {
    const page = read('app/tools/fire-number/page.tsx');
    expect(page).toMatch(/FireEducation/);
    expect(page.match(/<FireEducation\s*\/>/), 'imported but never rendered').toBeTruthy();
  });

  it('no longer advertises the 4% rule the tool refuses to use', () => {
    /* Comments are stripped first, and that is not a convenience.
     *
     * The note explaining WHY the 4% claim was removed necessarily quotes it,
     * so a naive scan fails on the very comment that documents the fix — and
     * the cheapest way to make it pass is to delete the explanation. That is
     * the second time today a guard has flagged its own rationale. Scan what
     * ships, not what explains it. */
    const page = read('app/tools/fire-number/page.tsx')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '');
    const meta = page.slice(0, page.indexOf('export default'));
    expect(
      meta,
      'the page description promises the 25× rule that the tool explicitly declines'
    ).not.toMatch(/4%\s*safe\s*withdrawal/i);
  });

  it('keeps exactly one answer to how big the pot must be', () => {
    // Three lived here at once: a 4% constant nothing referenced, a 5%/20×
    // parallel model only its own test called, and the liability model the app
    // actually shows. Two opinions nobody could see is how a fourth appears.
    for (const f of ['lib/projections.ts', 'lib/market-2026.ts']) {
      expect(read(f), `${f} reintroduces a safe-withdrawal-rate shortcut`).not.toMatch(
        /SAFE_WITHDRAWAL_RATE/
      );
    }
    expect(read('lib/market-2026.ts')).not.toMatch(/localizedFire/);
  });

  it('names one retirement age, not three', () => {
    /* There were three: the insight card illustrated 55, the calculator
     * defaulted to 50, and DEFAULT_RETIREMENT_AGE said 60. No two of them
     * contradicted outright — an illustration may pick an age — but a reader
     * moving from the card to the tool met a different retirement each time.
     *
     * Asserted as an alias rather than an equal value, because two constants
     * that happen to match today are two constants that can drift tomorrow;
     * that is precisely how three of them appeared. */
    expect(RETIRE_AT_AGE).toBe(DEFAULT_RETIREMENT_AGE);
    const calc = read('components/tools/FireNumberCalculator.tsx');
    expect(
      calc,
      'the calculator hard-codes a retirement age instead of using the shared default'
    ).not.toMatch(/targetAge\s*!==\s*\d|setTargetAge\(\d+\)/);
    expect(calc).toMatch(/DEFAULT_RETIREMENT_AGE/);
  });

  it('surfaces the deadline that expires before retirement does', () => {
    const edu = read('components/tools/FireEducation.tsx');
    expect(edu, 'the insurer cut-off warning is missing').toMatch(/new/i);
    expect(edu).toMatch(/mid-sixties/i);
    expect(edu, 'the education section does not explain the return assumption').toMatch(
      /checkPlanningRatePremise/
    );
  });
});

/**
 * A stand-in must be named as one.
 *
 * KNBS publishes Kenya's official CPI. When it is unreachable Mwangaza falls
 * back to CBK — a sound substitution, and one the feed flags with
 * `fallback: true` precisely so a consumer can say so.
 *
 * Mwangaza does say so. JiPange did not: `MacroReading` never declared the
 * field, so `inflationAttribution()` rendered "CBK, 27 Jul 2026" — exactly the
 * ordinary-looking citation that Mwangaza's own scraper comment warns about.
 * Two products reading one number, one of them disclosing.
 *
 * It matters more here than it looks. That reading deflates the real-yield
 * board, the planning-rate premise and the early-start multiple: it is the
 * denominator under every "after inflation" figure this tool shows.
 */
describe('the inflation stand-in is disclosed', () => {
  it('names KNBS as the source that could not be reached, when it could not', () => {
    const reading = RATES.macro.inflation;
    const text = inflationAttribution();
    if (reading?.fallback) {
      expect(text, 'a fallback reading is being cited as though it were primary').toMatch(/KNBS/);
      expect(text).toMatch(/standing in|could not be reached/i);
    } else {
      // Not a fallback today: it must NOT claim one, or the caveat becomes noise.
      expect(text).not.toMatch(/standing in/i);
    }
    expect(text).toMatch(/Mwangaza Yield/);
  });

  it('carries the inflation source into the real-yield table, not just the auction', () => {
    // Every row there is a real yield: a nominal rate deflated by inflation.
    // Citing only the auction credits it for half the calculation.
    const p = checkPlanningRatePremise();
    expect(p.attribution).toMatch(/CBK auction/);
    expect(p.attribution, 'the inflation source is missing from a table of real yields').toMatch(
      /inflation/i
    );
  });
});
