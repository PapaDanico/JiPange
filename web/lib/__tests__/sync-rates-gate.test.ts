import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

/**
 * The rates sync must be able to tell "already broken" from "the new data
 * broke it", and the only thing that makes that possible is running the suite
 * BEFORE the refresh as well as after.
 *
 * The gate used to ask "is anything broken?" when the question it means is
 * "did the NEW data break anything?". Those coincide only while the suite is
 * green — and this repository has guards that go red on a calendar. On 30 July
 * the hand-surveyed provider yields passed their 120-day budget,
 * product-directory.test.ts went red, and it blocked the T-bill refresh in both
 * runs that day. A guard about money-market funds stopped the Treasury-bill
 * figures updating; the only thing that reported it was an email whose subject
 * blamed the sync.
 *
 * The failure mode is the quiet kind: the app keeps serving yesterday's yields
 * and tells the reader nothing. So this asserts the ORDER, which is the part a
 * later edit would undo without noticing — moving the baseline after the
 * refresh, or dropping it, leaves a workflow that still looks correct and
 * silently restores the old behaviour.
 */
const WORKFLOW = readFileSync(
  new URL('../../../.github/workflows/sync-rates.yml', import.meta.url),
  'utf8'
);

const at = (needle: string): number => {
  const i = WORKFLOW.indexOf(needle);
  expect(i, `"${needle}" not found in sync-rates.yml — has the step been renamed?`).toBeGreaterThan(
    -1
  );
  return i;
};

describe('rates sync distinguishes a pre-existing failure from one it caused', () => {
  it('takes the baseline before pulling the feed, not after', () => {
    /* The single load-bearing fact. After the refresh, a red suite is
     * ambiguous; before it, it is a fact about the tree we started from. */
    expect(
      at('id: baseline'),
      'the baseline test run must come BEFORE scripts/sync-rates.mjs, or it is not a baseline'
    ).toBeLessThan(at('node scripts/sync-rates.mjs'));
  });

  it('verifies again after the refresh', () => {
    expect(at('node scripts/sync-rates.mjs')).toBeLessThan(at('id: verify'));
  });

  it('commits only when the verify step said it was safe', () => {
    // Belt and braces against a future `continue-on-error` re-enabling the
    // commit path for figures we just decided not to ship.
    expect(WORKFLOW).toContain("if: steps.verify.outputs.safe == 'true'");
    expect(at('id: verify')).toBeLessThan(at('Commit the refreshed snapshot'));
  });

  it('refuses when the suite was green before and red after', () => {
    /* The one case that must still block: this is the check doing its
     * original job, and widening the gate must not have removed it. */
    expect(WORKFLOW).toContain('safe=false');
    // The branch that decides "already red" — without it, every red suite
    // would refuse and nothing would have changed.
    expect(WORKFLOW).toContain('steps.baseline.outputs.was_green }}" = "false"');
    expect(
      WORKFLOW,
      'the refused path must restore the snapshot so no later step commits it'
    ).toContain('git checkout -- web/lib/rates-snapshot.json');
  });

  it('does not leave the old unconditional gate in place', () => {
    /* The exact line this change replaces. If it comes back, the two test
     * runs above are dead weight and the calendar guards can block the data
     * again. */
    expect(WORKFLOW).not.toContain('run: cd web && npm ci && npm run test');
  });
});
