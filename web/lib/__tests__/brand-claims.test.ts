import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { FORBIDDEN_CLAIMS } from '../mission';

/**
 * The claims this product does not make, checked against what it ships.
 *
 * A brand pack arrived carrying the tagline "Plan. Save. Grow." and a sister
 * banner promising "real-time Kenya sovereign yield curves". Both read well;
 * neither is true of this software. It does not grow anyone's money — it is a
 * set of calculators, and the difference between the two is a CMA licence —
 * and nothing here streams, because every figure is a committed snapshot of a
 * published CBK auction, dated on the page.
 *
 * The codebase was clean when the pack arrived, which is the only reason this
 * is a guard rather than a cleanup. That is also the argument for writing it
 * now: nothing was stopping the sentence from being pasted in, and a nicer
 * sentence is how compliance language gets into a repository — not by anyone
 * deciding to make a claim.
 *
 * Scanned across tracked source rather than a hand-listed set of files,
 * because the file that will one day carry the tagline is by definition not
 * one anybody thought to list.
 */
const tracked = (): string[] =>
  execFileSync('git', ['ls-files', '*.ts', '*.tsx', '*.md', '*.json'], {
    cwd: new URL('../../', import.meta.url).pathname,
    encoding: 'utf8',
  })
    .split('\n')
    .filter(Boolean)
    // This file and mission.ts necessarily quote the banned phrases in order
    // to define and explain them.
    .filter((f) => !f.endsWith('lib/mission.ts') && !f.includes('brand-claims.test'));

/* Comments stripped before scanning, and that is not a convenience.
 *
 * The note explaining WHY a phrase is barred has to contain the phrase, so a
 * naive scan fails on the very comment documenting the rule — and the cheapest
 * way to make it pass is to delete the explanation. This codebase has now hit
 * that trap three times. Scan what ships, not what explains it. */
const shipped = (src: string): string =>
  src
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/^\s*\/\/.*$/gm, ' ')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ');

describe('the product does not make claims it cannot support', () => {
  const root = new URL('../../', import.meta.url).pathname;
  const files = tracked();

  it('scans a real file list, not an empty one', () => {
    // A guard over zero files passes forever. This has bitten before.
    expect(files.length, 'git ls-files returned nothing — the scan is vacuous').toBeGreaterThan(50);
    expect(files.some((f) => f.startsWith('app/'))).toBe(true);
    expect(files.some((f) => f.startsWith('components/'))).toBe(true);
  });

  for (const { pattern, because } of FORBIDDEN_CLAIMS) {
    it(`never says ${pattern.source}`, () => {
      const offenders: string[] = [];
      for (const f of files) {
        let src: string;
        try {
          src = readFileSync(`${root}${f}`, 'utf8');
        } catch {
          continue;
        }
        const m = shipped(src).match(pattern);
        if (m) offenders.push(`${f}: "${m[0].trim()}"`);
      }
      expect(offenders, `${because}\n  ${offenders.join('\n  ')}`).toEqual([]);
    });
  }

  it('would actually catch the tagline it was written for', () => {
    /* The guard's own test. A scanner that matches nothing is
     * indistinguishable from a clean codebase, and the two were the same thing
     * on the day this was written — so the patterns are exercised against the
     * exact strings from the brand pack rather than trusted to be correct. */
    const cases = [
      'Plan. Save. Grow.',
      'plan. save. grow',
      'Grow your money with JiPange',
      'Real-time Kenya sovereign yield curves',
      'realtime rates',
      'live market rates',
      'guaranteed returns of 12%',
    ];
    for (const c of cases) {
      expect(
        FORBIDDEN_CLAIMS.some((f) => f.pattern.test(c)),
        `"${c}" would have passed the brand guard`
      ).toBe(true);
    }
  });

  it('does not fire on ordinary writing', () => {
    // A guard that flags innocent prose gets disabled, and then it guards
    // nothing. "Growth" as a noun about the economy is not a promise of return.
    const innocent = [
      'Kenya recorded 5.3% GDP growth in the first quarter.',
      'Plan, save and track your money.',
      'The rate is live on the CBK website.',
      'Your savings will grow at whatever rate the fund actually pays.',
      'This is not a guaranteed outcome.',
    ];
    for (const c of innocent) {
      const hit = FORBIDDEN_CLAIMS.find((f) => f.pattern.test(c));
      expect(hit?.pattern.source, `"${c}" was flagged`).toBeUndefined();
    }
  });

  it('gives a reason with every rule, not just a pattern', () => {
    // A banned word with no stated reason gets deleted by the next person who
    // finds it inconvenient.
    for (const { pattern, because } of FORBIDDEN_CLAIMS) {
      expect(because.length, `${pattern.source} has no rationale`).toBeGreaterThan(30);
    }
  });
});
