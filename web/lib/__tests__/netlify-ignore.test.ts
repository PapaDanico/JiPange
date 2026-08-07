import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readFileSync, rmSync } from 'node:fs';

/**
 * The build-skip decision, tested by running the actual script.
 *
 * Netlify's `ignore` command inverts the usual polarity: exit 0 CANCELS the
 * build, non-zero runs it. Getting that backwards does not fail loudly — it
 * silently stops publishing, and the site simply stops updating while every
 * merge still reports success. So the polarity is asserted directly, in both
 * directions, and the fail-safe cases are asserted to build.
 *
 * Written after 302 production deploys across this project and Mwangaza —
 * which share one Netlify credit pool — exhausted the team's credits and left
 * merged commits unpublished on both sites.
 *
 * The interesting case here is web/lib/__tests__, which is skippable, sitting
 * directly inside web/lib, which is not. A skip rule matched one directory too
 * loosely would stop publishing the planner itself.
 */
const ROOT = new URL('../../../', import.meta.url).pathname;
const SCRIPT = `${ROOT}scripts/netlify-should-build.sh`;

const SKIP = 0;
const BUILD = 1;

function decide(env: Record<string, string>, cwd = ROOT): number {
  try {
    execFileSync('bash', [SCRIPT], { env: { ...process.env, ...env }, cwd, stdio: 'pipe' });
    return SKIP;
  } catch (e) {
    return (e as { status: number }).status;
  }
}

describe('netlify build-skip decision', () => {
  it('builds when there is no baseline to diff against', () => {
    expect(decide({ CACHED_COMMIT_REF: '', COMMIT_REF: 'abc123' })).toBe(BUILD);
    expect(decide({ CACHED_COMMIT_REF: 'abc123', COMMIT_REF: '' })).toBe(BUILD);
  });

  it('builds on a manual redeploy of the same commit', () => {
    expect(decide({ CACHED_COMMIT_REF: 'abc123', COMMIT_REF: 'abc123' })).toBe(BUILD);
  });

  it('builds when the commits cannot be diffed', () => {
    // Netlify clones shallow; the cached commit may not be present.
    expect(
      decide({ CACHED_COMMIT_REF: '0'.repeat(40), COMMIT_REF: 'HEAD' })
    ).toBe(BUILD);
  });

  it('never treats the app, the library or its assets as skippable', () => {
    const src = readFileSync(SCRIPT, 'utf8');
    const list = src.match(/grep -Ev '\^\(([^)]*)\)/)?.[1] ?? '';
    expect(list.length, 'skip list should have been found in the script').toBeGreaterThan(10);
    for (const path of ['web/app/', 'web/components/', 'web/public/', 'web/hooks/']) {
      expect(list, `${path} must not be skippable`).not.toContain(path);
    }
    // web/lib/__tests__ IS skippable and must be named exactly. A rule of
    // `web/lib/` would silently stop publishing every calculator in the app.
    expect(list).toContain('web/lib/__tests__/');
    expect(list).not.toMatch(/web\/lib\/(?!__tests__)/);
  });

  it('skips test-only and docs-only diffs, and builds everything else', () => {
    // A scratch repository, so the git plumbing is exercised alongside the
    // grep rather than the grep alone.
    const dir = execFileSync('mktemp', ['-d'], { encoding: 'utf8' }).trim();
    const git = (...a: string[]) => execFileSync('git', a, { cwd: dir, stdio: 'pipe' });
    git('init', '-q');
    git('config', 'user.email', 't@t');
    git('config', 'user.name', 't');
    execFileSync('mkdir', ['-p', `${dir}/web/lib/__tests__`, `${dir}/web/e2e`, `${dir}/web/app`]);
    execFileSync('bash', [
      '-c',
      `echo a > ${dir}/web/lib/planner.ts
       echo a > ${dir}/web/lib/__tests__/planner.test.ts
       echo a > ${dir}/web/e2e/journeys.spec.ts
       echo a > ${dir}/web/app/page.tsx
       echo a > ${dir}/README.md`,
    ]);
    git('add', '-A');
    git('commit', '-qm', 'base');

    const sha = () =>
      execFileSync('git', ['rev-parse', 'HEAD'], { cwd: dir, encoding: 'utf8' }).trim();
    const commit = (shell: string, msg: string) => {
      execFileSync('bash', ['-c', shell]);
      git('add', '-A');
      git('commit', '-qm', msg);
      return sha();
    };
    const run = (from: string, to: string) =>
      decide({ CACHED_COMMIT_REF: from, COMMIT_REF: to }, dir);

    let prev = sha();
    const cases: [string, string, number][] = [
      [`echo x >> ${dir}/web/lib/__tests__/planner.test.ts`, 'unit test only', SKIP],
      [`echo x >> ${dir}/web/e2e/journeys.spec.ts`, 'e2e only', SKIP],
      [`echo x >> ${dir}/README.md`, 'readme only', SKIP],
      [`echo x >> ${dir}/web/lib/planner.ts`, 'library', BUILD],
      [`echo x >> ${dir}/web/app/page.tsx`, 'app', BUILD],
      // The mixed diff a naive "any ignorable file present" rule gets wrong.
      [
        `echo x >> ${dir}/web/lib/__tests__/planner.test.ts; echo x >> ${dir}/web/lib/planner.ts`,
        'test + library together',
        BUILD,
      ],
      /* LICENSE and SECURITY.md, added 2026-08-07. The merge that introduced
       * them triggered a full production deploy that could not change one byte
       * of the published site — this script's own cost, paid on the commit
       * that documented it. */
      [`echo x > ${dir}/LICENSE; echo y > ${dir}/SECURITY.md`, 'licence + disclosure policy', SKIP],
      /* Anchored at BOTH ends. Without the trailing anchor this root-level
       * sibling is swallowed too and would silently stop deploying. The
       * equivalent assertion in Mwangaza was first written against
       * src/licensing/LICENSE and was VACUOUS — `^LICENSE` cannot match a path
       * beginning `src/`, so dropping the `$` did not fail it. This is the
       * case that actually discriminates. */
      [`echo z > ${dir}/LICENSE-THIRD-PARTY`, 'a differently-named root licence file', BUILD],
    ];

    for (const [shell, msg, want] of cases) {
      const next = commit(shell, msg);
      expect(run(prev, next), `${msg} should ${want === SKIP ? 'skip' : 'build'}`).toBe(want);
      prev = next;
    }

    /* CLEANUP MUST NOT BE ABLE TO FAIL THE TEST.
     *
     * This was a bare `execFileSync('rm', ['-rf', dir])`, sitting inside the
     * `it()` after every assertion had already passed. On a CI runner it threw:
     *
     *   rm: cannot remove '/tmp/tmp.WROQksc0NF/.git/objects': Directory not empty
     *
     * — `rm` racing a git process still writing into the throwaway repository
     * this test builds. 949 of 950 tests passed, every assertion in this file
     * passed, and the suite went red over a temp directory.
     *
     * A leftover directory under /tmp is not a defect; failing a build over one
     * is. `rmSync`'s `maxRetries` exists for exactly this race, and the `catch`
     * is the honest backstop: if the directory still cannot be removed, that is
     * the operating system's business and not a verdict on the code under test.
     * The tempdir is per-run, so nothing leaks between runs.
     */
    try {
      rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
    } catch {
      // Deliberately swallowed — see above.
    }
  });
});
