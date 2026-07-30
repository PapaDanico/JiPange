import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fitScale, MIN_FIT_SCALE, A4_PORTRAIT } from '../export-sheet';
import { TOOL_META } from '../tool-meta';

/**
 * The rule that decides whether a document is complete or quietly truncated.
 *
 * The exported Hustle Income Smoother sheet came out with its three-step list
 * cut off mid-item, under a footer that had rendered as though everything
 * fitted. Nothing warned; the page simply ended.
 *
 * The cause was that the fit decision lived inside a DOM measurement no test
 * could reach, and read the SLOT's scroll metrics only. `scrollHeight` on a
 * containing block is a claim about that block, and a grid child can overrun
 * it without the parent's number moving — so the check saw no overflow, no
 * scaling was applied, and the fixed-height A4 box clipped. That is the same
 * failure the module's own comment describes for `flex-basis: auto`, arrived
 * at by a different route, which is the argument for pulling the arithmetic
 * out where it can be exercised directly.
 */
describe('fitting the body to a fixed page', () => {
  it('leaves content alone when it already fits', () => {
    expect(fitScale(500, 900)).toBe(1);
    expect(fitScale(900, 900)).toBe(1);
  });

  it('shrinks by exactly the ratio that makes it fit', () => {
    expect(fitScale(1800, 900)).toBeCloseTo(0.5, 10);
    expect(fitScale(1000, 900)).toBeCloseTo(0.9, 10);
    // The point of the ratio: content x factor lands on the available height.
    for (const h of [901, 1200, 1500]) {
      expect(h * fitScale(h, 900)).toBeCloseTo(900, 6);
    }
  });

  it('refuses to shrink past the floor, rather than pretending to fit', () => {
    /* Below MIN_FIT_SCALE the sheet WILL clip, and that is the deliberate
     * choice: type small enough to be unreadable is not a rescue. What matters
     * is that the floor is a backstop for pathological input, not a routine
     * outcome — so it is asserted as a clamp, not as a fit. */
    const factor = fitScale(10_000, 900);
    expect(factor).toBe(MIN_FIT_SCALE);
    expect(10_000 * factor).toBeGreaterThan(900);
  });

  it('never returns a factor that would flip or vanish the content', () => {
    for (const [c, a] of [
      [0, 900],
      [-5, 900],
      [900, 0],
      [900, -5],
      [Number.NaN, 900],
      [900, Number.NaN],
    ]) {
      const f = fitScale(c, a);
      expect(Number.isFinite(f), `fitScale(${c}, ${a}) was not finite`).toBe(true);
      expect(f).toBeGreaterThan(0);
      expect(f).toBeLessThanOrEqual(1);
    }
  });

  it('measures the clone as well as the slot, not the slot alone', () => {
    // The regression itself: a container reporting no overflow while its child
    // overruns. Asserted on the source because the fix is which numbers get
    // compared, and that decision is made in the DOM.
    const src = readFileSync(new URL('../export-sheet.ts', import.meta.url), 'utf8');
    const call = src.slice(src.indexOf('const contentHeight'));
    expect(call.slice(0, 200), 'the fit no longer consults the clone’s own height').toMatch(
      /clone\.(scrollHeight|offsetHeight)/
    );
    expect(call.slice(0, 200)).toMatch(/Math\.max/);
  });
});

describe('the page the sheet is built for', () => {
  it('is A4 portrait at 96dpi, which the fit arithmetic assumes', () => {
    // 210mm x 297mm at 96dpi. If this drifts, every factor above is measuring
    // against the wrong page.
    expect(A4_PORTRAIT.w).toBe(794);
    expect(A4_PORTRAIT.h).toBe(1123);
    expect(A4_PORTRAIT.h / A4_PORTRAIT.w).toBeCloseTo(Math.SQRT2, 2);
  });
});

/**
 * A document's masthead should name a tool that exists.
 *
 * The sheet was headed "Hustle Smoother" — title-cased from the `hustle-smoother`
 * slug — while the tool is the Hustle Income Smoother. The slug is not the name,
 * and TOOL_META has held the name all along.
 */
describe('export titles come from the registry', () => {
  it('has a registered name for the tool whose sheet was mistitled', () => {
    expect(TOOL_META['/tools/hustle-smoother']?.name).toBe('Hustle Income Smoother');
  });

  it('consults the registry before title-casing a slug', () => {
    const src = readFileSync(new URL('../../components/tools/ExportCardButton.tsx', import.meta.url), 'utf8');
    const fn = src.slice(src.indexOf('function titleFromFilename'));
    const body = fn.slice(0, fn.indexOf('\n}'));
    expect(body, 'the exporter still reconstructs the title from the slug alone').toMatch(
      /TOOL_META/
    );
    // Order matters: a registered name must win, not merely be available.
    expect(body.indexOf('TOOL_META')).toBeLessThan(body.indexOf('toUpperCase'));
  });

  it('still produces something printable for a slug with no registry entry', () => {
    // The fallback is why this function exists; losing it would put
    // "undefined" on a printed page.
    const src = readFileSync(new URL('../../components/tools/ExportCardButton.tsx', import.meta.url), 'utf8');
    expect(src).toMatch(/return "Result";/);
  });
});
