#!/usr/bin/env bash
#
# Everything CI would have run, in one command, on a machine that works.
#
# WHY THIS EXISTS
# ---------------
# GitHub Actions stopped assigning runners to this repository on 20 August
# 2026. Every workflow — the twice-daily rates sync and the Build and Test
# matrix — fails in about three seconds, before a single step executes. That is
# an account-level problem; nothing in this repository fixes it, and re-running
# does not help.
#
# The practical consequence is that `main` has taken commits with no
# verification at all since 29 August, and a contributor has no single place to
# ask "would CI have passed?". This is that place. It runs the same checks the
# webpack.yml matrix ran, in the same order, and it runs them here.
#
# WHAT IT DOES NOT DO
# -------------------
# It cannot replace CI's independence. This runs on the same machine that wrote
# the code, against whatever is in the working tree — so it catches mistakes,
# not "works on my machine". Run it on a clean checkout before trusting it as a
# release gate.
#
# The Playwright suite is NOT run here by default: it needs a browser and a
# production build, takes about three minutes, and is worth its own deliberate
# invocation. `--with-e2e` includes it.
#
# Exit codes: 0 = everything the gate covers passed; 1 = something failed.
set -uo pipefail

cd "$(dirname "$0")/.."

WITH_E2E=0
[ "${1:-}" = "--with-e2e" ] && WITH_E2E=1

failed=()
run() {
  local name="$1"; shift
  printf '\n\033[1m── %s\033[0m\n' "$name"
  if "$@"; then
    printf '\033[32m   ok\033[0m\n'
  else
    printf '\033[31m   FAILED\033[0m\n'
    failed+=("$name")
  fi
}

# Reported, never gating. The rates snapshot going stale is a real problem and
# the reader already sees it via isStale(); blocking every other fix behind it
# would be the mistake lib/statutes.ts talks itself out of at length — a red
# gate does not take a stale figure off the page, it just stops anything else
# shipping.
printf '\n\033[1m── rates freshness (advisory)\033[0m\n'
node scripts/rates-doctor.mjs --offline || true

run "typecheck"        npm run --silent typecheck --workspace web
run "typecheck (e2e)"  npm run --silent typecheck:e2e --workspace web
run "lint"             npm run --silent lint --workspace web
run "unit tests"       npm run --silent test --workspace web
run "production build" npm run --silent build --workspace web
[ "$WITH_E2E" = "1" ] && run "e2e" npm run --silent e2e --workspace web

printf '\n'
if [ ${#failed[@]} -eq 0 ]; then
  printf '\033[32mverify: everything passed\033[0m\n'
  [ "$WITH_E2E" = "0" ] && printf 'note: e2e not run — use `npm run verify:all`\n'
  exit 0
fi

printf '\033[31mverify: %d failed — %s\033[0m\n' "${#failed[@]}" "${failed[*]}"
printf 'If the only failure is the rates-snapshot staleness test, that is the\n'
printf 'sync outage above and not this change. Do NOT widen the budget to get\n'
printf 'green; land a real refresh (npm run sync:rates) instead.\n'
exit 1
