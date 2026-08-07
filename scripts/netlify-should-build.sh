#!/usr/bin/env bash
#
# Netlify's `ignore` command: exit 0 to SKIP the build, non-zero to RUN it.
# That polarity is inverted from every other exit code in this repo, so it is
# spelled out at both exit points below rather than left to be remembered.
#
# Why this exists: 302 production deploys across this project and Mwangaza —
# which share one Netlify credit pool — consumed 4,530 of 6,387 credits in a
# billing period and then exhausted the balance, leaving merged commits
# unpublished on both sites.
#
# `next build` inside web/ is the whole build. It never reads .github/, the
# root README, the design notes, the Playwright suite or the unit tests. The
# list below is therefore not "things that seem unimportant" — it is things
# the build provably does not read. Anything not on it builds, including
# every file under web/app, web/lib, web/components and web/public.
#
# Note that web/lib/__tests__ is skippable but web/lib is NOT: the tests sit
# inside the directory they test, so the skip has to name the test folder
# exactly and let everything around it build.
#
# Fail-safe direction is deliberate: every uncertain case exits 1 and builds.
# A build we did not need costs one credit. A skipped build we did need ships
# a planner that silently disagrees with the one people were shown.

set -uo pipefail

build()  { echo "netlify-should-build: $1 — BUILDING";  exit 1; }
skip()   { echo "netlify-should-build: $1 — skipping";  exit 0; }

# netlify.toml sets base = "web", so this runs from web/. Diff paths are
# relative to the repository root, so the patterns below must be too — and
# the git commands need to be run somewhere inside the work tree, which web/
# is. Both hold, but neither is obvious enough to leave unstated.
[ -n "${CACHED_COMMIT_REF:-}" ] || build "no CACHED_COMMIT_REF (first build or cleared cache)"
[ -n "${COMMIT_REF:-}" ]        || build "no COMMIT_REF"

# A manual redeploy or retry arrives with the same commit as the cache. The
# operator asked for a build; give them one.
[ "$CACHED_COMMIT_REF" != "$COMMIT_REF" ] || build "same commit as last build (manual redeploy or retry)"

# Netlify clones shallow. If the cached commit is not in this clone the diff
# cannot be trusted, and an untrustworthy diff must not cancel a build.
changed=$(git diff --name-only "$CACHED_COMMIT_REF" "$COMMIT_REF" 2>/dev/null) || \
  build "cannot diff $CACHED_COMMIT_REF..$COMMIT_REF (shallow clone?)"

[ -n "$changed" ] || build "empty diff between two different commits"

# LICENSE and SECURITY.md earn their place the same way everything else here
# does: `next build` provably does not read them. They were added on
# 2026-08-07 and the merge that added them triggered a full production deploy
# that could not change one byte of the published site — the cost this script
# exists to avoid, paid on the very commit that documented it.
#
# Both are anchored at BOTH ends. Without the trailing anchor a root-level
# sibling such as LICENSE-THIRD-PARTY would be swallowed too, and a file that
# could legitimately ship would stop deploying.
relevant=$(echo "$changed" | grep -Ev '^(\.github/|README\.md$|LICENSE$|SECURITY\.md$|\.gitignore$|web/README\.md$|web/DESIGN\.md$|web/e2e/|web/lib/__tests__/)') || true

if [ -z "$relevant" ]; then
  skip "$(echo "$changed" | wc -l | tr -d ' ') changed file(s), none of them reachable by next build"
fi

build "$(echo "$relevant" | wc -l | tr -d ' ') build-relevant file(s), e.g. $(echo "$relevant" | head -1)"
