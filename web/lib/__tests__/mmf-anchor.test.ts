import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import {
  assumedMmfYield,
  assumedMmfYieldPct,
  monthlyContributionFV,
  MMF_SPREAD_OVER_TBILL_PCT,
} from '../mmf-assumption';
import { tbillRate } from '../rates-feed';

/**
 * The anchor was fixed. The pages quoting it were not.
 *
 * mmf-assumption.ts exists because a hand-typed MMF rate is a promise the
 * market stops keeping the moment rates move, and its opening note records the
 * exact symptom: "a reader was being told an MMF pays 11.5% while the paper
 * inside it paid 9.30%." assumedMmfYield() was introduced to end that.
 *
 * Eight surfaces never migrated. Two rate dropdowns offered "MMF ~11.5%" and
 * fed 11.5 straight into a projection, so a reader who picked the preset got
 * the old number back from a calculator whose own baseline was the live one.
 * Three insight cards printed 11.5% as a fact. The journey's vehicle summary
 * quoted it as a baseline. And two headline figures had been hand-computed
 * from it — one of which, "Ksh 20,000+", did not follow from any pair of rates
 * on its own page: 50,000 at 11.5% against 3.23% over three years is about
 * 14,300, and at today's anchor it is 11,700.
 *
 * Found by sweeping for the literal after the T-bill pricing correction moved
 * the anchor again. Same lesson as that fix: correcting the constant is not
 * the same as correcting what the product says.
 */
const ROOT = new URL('../../', import.meta.url).pathname;

describe('the MMF figure the pages show is the one the tools use', () => {
  const files = execFileSync('git', ['ls-files', 'app/*.tsx', 'components/*.tsx', 'lib/*.ts'], {
    cwd: ROOT,
    encoding: 'utf8',
  })
    .split('\n')
    .filter(Boolean)
    .filter((f) => !f.includes('__tests__') && !f.endsWith('lib/mmf-assumption.ts'));

  it('scans a real file list', () => {
    expect(files.length).toBeGreaterThan(30);
  });

  it('quotes no hand-typed MMF rate anywhere it ships', () => {
    const offenders: string[] = [];
    for (const f of files) {
      const src = readFileSync(`${ROOT}${f}`, 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, ' ')
        .replace(/^\s*\/\/.*$/gm, ' ');
      // "11.5" adjacent to MMF or a percent sign — the shape that drifted.
      if (/(MMF[^\n]{0,40}11\.5|11\.5%[^\n]{0,40}MMF)/i.test(src)) offenders.push(f);
    }
    expect(
      offenders,
      `these still advertise a typed MMF rate instead of assumedMmfYieldPct():\n  ${offenders.join('\n  ')}`
    ).toEqual([]);
  });

  it('keeps the label and the preset value the same number by construction', () => {
    /* They drifted because they were two literals that happened to agree. A
     * dropdown reading "MMF ~10.1%" that feeds 11.5 into the projection is the
     * worst version of this bug, because the reader is shown the correction
     * and given the error. */
    for (const f of [
      'components/tools/SavingsGoalCalculator.tsx',
      'components/tools/InvestmentReturnsCalculator.tsx',
    ]) {
      const src = readFileSync(`${ROOT}${f}`, 'utf8');
      const preset = src.slice(src.indexOf('RATE_PRESETS'), src.indexOf('RATE_PRESETS') + 400);
      const mmfLine = preset.split('\n').find((l) => /MMF/i.test(l))!;
      expect(mmfLine, `${f} MMF preset is not derived`).toMatch(/assumedMmfYieldPct\(\)/);
      // Both the label and the value, on the same line, from the same call.
      expect((mmfLine.match(/assumedMmfYieldPct\(\)/g) ?? []).length).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('the anchor itself', () => {
  it('is the live 91-day bill plus the stated spread, not a stored number', () => {
    /* Reads the constant rather than repeating its value. The first version of
     * this test typed 1.0, and when the spread was corrected to zero on
     * evidence the test failed for having hardcoded the very thing it was
     * written to stop being hardcoded. */
    const bill = tbillRate(91)!;
    expect(assumedMmfYield() * 100).toBeCloseTo(bill.grossEAY + MMF_SPREAD_OVER_TBILL_PCT, 6);
  });

  it('formats the label and the preset from one value', () => {
    expect(Number(assumedMmfYieldPct())).toBeCloseTo(assumedMmfYield() * 100, 1);
  });

  it('compounds a monthly contribution monthly, not annually', () => {
    // The headline "Ksh 5,000/month for 10 years" figure depends on this, and
    // annual compounding would understate it by enough to notice.
    const monthly = monthlyContributionFV(5_000, 0.12, 10);
    const annual = 5_000 * 12 * ((Math.pow(1.12, 10) - 1) / 0.12);
    expect(monthly).toBeGreaterThan(annual);
    expect(monthlyContributionFV(1_000, 0, 3)).toBe(36_000);
    expect(monthlyContributionFV(0, 0.1, 10)).toBe(0);
  });
});

/**
 * The spread was an assumption nobody had checked against the market.
 *
 * mmf-assumption.ts argued that a fund's bank-deposit pickup and its
 * management fee "roughly offset" — and then added a full percentage point
 * anyway. The argument was the accurate half.
 *
 *   MMF industry average, 32 funds, June 2026   9.10% gross EAY
 *   91-day bill, gross EAY, this feed           9.08%
 *   measured spread                             0.02pp
 *
 * A fund on average returns what a rolled 91-day bill returns, which is not
 * surprising: bills are most of what it holds. Assuming +1.00 overstated every
 * projection in this app by about a point, compounded over the horizons the
 * FIRE and goal tools work in.
 */
describe('the assumed spread, against what funds actually pay', () => {
  it('does not assume a pickup the market is not paying', () => {
    /* Bounded rather than pinned to a value, so a future re-measurement can
     * move it without editing a test — but not far, and never back to the
     * unexamined point. If the CBR moves and funds genuinely open a gap, this
     * failing is the signal to re-measure, which is the whole intent. */
    expect(MMF_SPREAD_OVER_TBILL_PCT).toBeGreaterThanOrEqual(0);
    expect(
      MMF_SPREAD_OVER_TBILL_PCT,
      'the assumed MMF pickup is back above the measured industry spread — re-check the CIS tables before widening it'
    ).toBeLessThanOrEqual(0.5);
  });

  it('lands the assumption at or below the measured industry average', () => {
    // 9.10% gross across 32 funds, June 2026. Being at or under the average is
    // the conservative side to be on for a default a plan is built from.
    const INDUSTRY_AVERAGE_GROSS_PCT = 9.1;
    expect(assumedMmfYield() * 100).toBeLessThanOrEqual(INDUSTRY_AVERAGE_GROSS_PCT + 0.05);
  });

  it('still beats a bank savings account, which is the claim the app makes', () => {
    // The comparison the journey and the inflation tool actually rest on. If a
    // zero spread ever inverted this, several pages would be wrong.
    const BANK_SAVINGS_PCT = 3.23;
    expect(assumedMmfYield() * 100).toBeGreaterThan(BANK_SAVINGS_PCT);
  });
});
