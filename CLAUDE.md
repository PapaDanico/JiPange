# CLAUDE.md

Working notes for anyone — human or agent — changing this repository. The
[`README.md`](./README.md) says what JiPange is and how to run it; this file
says what will bite you.

## The one rule everything else follows from

**People make money decisions from these numbers.** A wrong figure here is not
a rendering bug, it is somebody putting a year's savings in the wrong rung. So
every rule below prefers *no answer* or *a loud failure* over a plausible one:

- Never invent, estimate, or "reasonably assume" a rate, a tax band, or an
  inflation figure. If the source is unreachable, the correct outcome is a
  refusal that says so — see `scripts/sync-rates.mjs`, whose exit codes are
  `0` updated-or-current, `1` refused, and which leaves the snapshot untouched
  on every failure path.
- Never edit `web/lib/rates-snapshot.json` to make a test pass. It is data,
  and the only things allowed to move it are the sync script and a hand-sync
  that reproduces exactly what the script would have written (see below).
- A figure shown without its date and publisher is how a stale number becomes
  a confident wrong claim. `attribution()`, `inflationAttribution()` and the
  `fallback` flag exist for that and are not optional decoration.

## Where things live

```
web/app/          Next.js App Router. One directory per calculator.
web/lib/          The maths. Pure, no React — correctness lives here.
web/lib/__tests__ Unit tests, beside the code they test.
web/components/   UI. Renders; never computes a number.
web/e2e/          Playwright.
scripts/          Rates sync, the rates doctor, the Netlify build gate.
```

`lib/` computes, `components/` renders. When that blurs, a number gets computed
twice and the two copies drift — and the copy that drifts is never the one that
gets corrected.

## Commands

| Command | What it does |
| --- | --- |
| `npm test` | Vitest, from the root |
| `npm run lint` / `--workspace web typecheck` | ESLint / `tsc --noEmit` |
| `npm run build` | Production build |
| `npm run sync:rates` | Refresh the snapshot from the live feed |
| **`npm run doctor`** | **Is anything still refreshing the rates?** |

Run `npm test` and `npm run lint` before pushing; `npm run build` if you touched
`web/app`.

## Claims about the market are data, not prose

The shape of the T-bill curve changes, and copy that states it is a claim with
an expiry date. This has already gone wrong once: the DhowCSD ladder shipped
the preset hint *"the 364-day rung, which pays most"* for weeks after the
30 July 2026 pricing correction made the 182-day rung the best-paying one — the
app told readers to lock money away for a year to earn less, while the feed in
the same build disagreed.

So: **nothing names a best-paying tenor in prose.** Ask
`bestPayingTenor()` in `web/lib/rates-feed.ts`, which derives it from the
shipped snapshot. `lib/__tests__/tenor-weights.test.ts` scans `components/` and
fails on any line that states it instead.

The guard meant to catch this was itself wrong — `y364 < y91 || y364 > y182`,
with the second operator inverted, so it passed on exactly the case it existed
to catch and only went red when the curve became humped. When you write a
guard, write the property (`y364 < Math.max(y91, y182)`), not a case analysis
of today's data.

## When the rates stop refreshing

`npm run doctor` is the first thing to run. It reads only committed files, so
it works offline and outside CI.

**A four-second workflow failure is not a bad rate.** On 20 August 2026 every
workflow in this repository — the twice-daily sync *and* CI — began failing in
about four seconds, before a single step ran and with no runner assigned. That
is an account-level Actions problem (spending limit, billing, or availability);
nothing in this repository can fix it, and re-running it will not help. The
symptoms downstream were: the snapshot froze at 19 August, four commits landed
on `main` with no CI at all, and the false ladder copy above shipped unnoticed.

Note what did *not* fail: the app's own `isStale()` notice reached readers at
14 days, as designed. The reader-facing honesty layer held; the operational
alarms did not, because all three of them lived inside the thing that died.
That is why `npm run doctor` exists outside it.

**Hand-syncing, when and only when it is safe.** If the workflow cannot run and
the feed is reachable from your machine, run `npm run sync:rates` locally and
commit what it writes. Do not hand-edit values from a screenshot: the commit
message on `78cac88` is the standard — it names the feed's `generatedAt`, every
yield that moved, and the validations re-checked. If you cannot reach the feed,
**leave the snapshot alone**; a twenty-day-old figure that says it is twenty
days old beats a fresh-looking guess.

## Traps that have already cost time

- **`html2canvas` throws on Tailwind v4 colours.** v4 emits `color-mix()` in
  oklab; `html2canvas` 1.4.1 raises `unsupported color function oklab`, which
  reaches the user as an export button that does nothing. Import
  `html2canvas-pro`. Never `html2canvas`.
- **Never `window.print()`.** Absent on iOS home-screen apps and dropped by
  several Android WebViews — silently. Both export paths build the file in the
  page and download it.
- **`scripts/netlify-should-build.sh` has inverted exit polarity** — `0` skips
  the build, non-zero builds it. Every uncertain case builds.
- **Deploy previews and branch deploys are off** deliberately, on cost. The
  comments in `netlify.toml` say what to delete to bring them back.
- **`react-hooks/set-state-in-effect` is a warning, not off.** ~24 call sites
  hydrate state from `localStorage` in a mount effect on purpose, so the server
  and first client render agree. The correct fix is `useSyncExternalStore` —
  see `ExportCardButton.tsx`, where the share-sheet probe was converted. Do the
  rest as a deliberate migration, not as a drive-by.

## Tests

- A calculator without a unit test is a calculator nobody can safely change.
- Prefer a test that fails when the behaviour is reverted. Verify that: revert
  the fix, watch it go red, put it back. A test that passes against an empty
  result reports coverage that does not exist.
- Time- and data-dependent guards (`SNAPSHOT_MAX_AGE_DAYS`, the `sources.ts`
  `reviewBy` gates) go red on the calendar by design. **That is the alarm
  working.** Fix the data or the pipeline; never widen the budget to get green.

## Money and language

Money is `Ksh`, everywhere a user can see it. Figures carry their date and
publisher. Projections (`IMF_WEO_*`) and measured outturns (KNBS/CBK) are never
interchangeable: a page that looks forward may quote a projection; a page
stating current conditions uses the measurement.
