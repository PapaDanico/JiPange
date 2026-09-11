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
| **`npm run verify`** | **Everything CI used to run, in one command** (`verify:all` adds e2e) |

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

## Arithmetic that cannot emit garbage

Every calculator is swept in `web/lib/__tests__/arithmetic-sweep.test.ts`
against the values a number field can actually deliver. The contract is
deliberately weak so it survives rewriting:

> **A finite input may never produce a non-finite output.**

It found **twelve** faults across nine modules, and every one was the same
bug wearing a different file name: `(1 + r)^n` either overflows to Infinity,
or — for a rate at or below −100% — raises a non-positive base to a power and
divides by zero. What came back was Infinity in a shilling figure, or NaN, and
both render.

So the bound is declared once, in `lib/money.ts`, beside `positiveAmount()`
and for the same stated reason — a guard living in twenty-four components is
wrong in at least one of them:

- `MAX_ANNUAL_RATE` / `MIN_ANNUAL_RATE` — 10,000% and −99%, past any
  instrument a Kenyan reader meets
- `isSaneRate(rate)` — bound the inputs
- `finiteOr(value, fallback)` — bound the result too, because a *sane* rate
  over an absurd horizon overflows just as well

**When you add a calculator, add it to the sweep.** Not to the list of things
you meant to do — the sweep is the only thing that drives these functions
directly, and it found three faults in the first thirteen calculators and nine
more in the rest.

**NaN is never allowed. Infinity sometimes is.** Four cases legitimately
answer Infinity — "no monthly amount reaches a target in zero years",
"contributions never catch a target inflating away from them". Those carry an
`infinityMeans` string saying what the sentinel means, so the allowance can be
read and challenged rather than silently granted. An infinite *shilling* figure
is always a fault.

Note what the sweep is NOT. `e2e/hostile-input.spec.ts` zeroes one field at a
time through the UI and found nothing — correctly, within its scope, which it
states plainly. It only tries zero, and it goes through parsers that clamp
first. Neither replaces the other.

## When the rates stop refreshing

`npm run doctor` is the first thing to run. It reads only committed files, so
it works offline and outside CI.

**A four-second workflow failure is not a bad rate.** On 20 August 2026 every
workflow in this repository — the twice-daily sync *and* CI — began failing in
about four seconds, before a single step ran and with no runner assigned. The
cause is now known and is **billing on the GitHub account** — confirmed by the
account owner on 11 September 2026, so it is no longer worth diagnosing.
Nothing in this repository can fix it, and re-running it will not help. The
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

**When HTTP to the feed is blocked, the feed is still in git.** Mwangaza
publishes from a public repository, and `public/data/rates.json` there is the
same file served at the URL:

```bash
git clone --depth 1 https://github.com/PapaDanico/mwangaza-yield /tmp/my
node scripts/sync-rates.mjs --from /tmp/my/public/data/rates.json
```

`--from` is the script's own documented path, so every validation still runs —
schema, tenors, net-below-gross-above-quote, and the one-day move bound. This
is a git-verified route to the publisher's own bytes, which is if anything
better provenance than an HTTP fetch. It is NOT a licence to hand-edit.

**A fresh sync may not clear the staleness alarm, and that is upstream's bug.**
Mwangaza's contract says `generatedAt` is "when the EVIDENCE was refreshed, not
the build". As of September 2026 its `meta.json` is frozen while its scrapers
keep running — its own `freshness.json` flags "Pipeline last ran" as stale
against a 7-day budget while `tbills.json` and `macro.json` are current. So the
stamp we key off has stopped moving and the evidence behind it has not.

`npm run doctor` detects this divergence and names it. **Do not re-base
`isStale()` onto `auctionDate` to get green.** `generatedAt` is the field the
publisher vouches for; substituting our own freshness signal invents a claim
they have not made. Being over-cautious about freshness is the safe direction.
The fix belongs upstream.

## Deploying, while CI is dead

**Nothing in GitHub Actions runs, because of account billing.** No runner has
been assigned since 20 August 2026; every workflow fails in about three seconds
before a step executes. The account owner confirmed the cause on 11 September
2026: it is a **payment/billing problem on the GitHub account**, not a
repository or workflow fault, and it is being left as it is for now. So do not
debug it, do not rewrite a workflow to work around it, and do not re-run a
failed job — treat CI as absent and verify locally.

How to recognise it rather than re-deriving it, because the checks DO still get
created and reported and so look like real failures. On PR #217 all three
checks went red on push; the job API said why:

```
created_at 09:50:57  completed_at 09:50:59   # two seconds
runner_id 0   runner_name ""                 # no runner was ever assigned
```

Log download returns **HTTP 404** for every such job — there are no steps to
have produced one. Same signature on every recent run of `Build and Test` on
`main`, so the base branch is red identically. A red check with `runner_id: 0`
and a 404 log is this, not your diff.

```bash
npm run verify        # everything the Build and Test matrix ran
npm run verify:all    # + Playwright
```

That is the gate now. `netlify.toml` also runs typecheck and lint before the
build, because Netlify is the only builder still executing anything.

**Deployment is Netlify, from `main`, and it is the one step an agent cannot
do.** Publishing needs a Netlify credential this environment does not have:

- the Netlify MCP connection is READ-SCOPED — its `deploy-site` upload returns
  `403 Forbidden`, with a fresh token, from any directory;
- `npx netlify deploy --build --prod` fails with `NETLIFY_AUTH_TOKEN is not
  set`.

So a human runs it, or sets `NETLIFY_AUTH_TOKEN` in the environment first:

```bash
git pull origin main
npx netlify deploy --build --prod
```

Never `--allow-anonymous`. It publishes to a NEW anonymous site rather than
`jipangefinance`, which looks like success and is worse than failing.

**A merge is not a deploy, and has not been since 19 August 2026.** The live
site served commit `5d6e36e` for three weeks while `main` moved on, so
everything merged in that window — several people's work, not one branch's —
was invisible to readers. Deploy previews correctly cancel (they are off on
cost), but production stopped publishing too. When that happens the answer is
in the deploy list at `app.netlify.com/projects/jipangefinance/deploys`: red
rows mean builds are failing and the log names the stage; no rows at all means
builds or auto-publishing are stopped, which is a toggle.

`scripts/netlify-should-build.sh` is NOT the cause — check before blaming it:

```bash
CACHED_COMMIT_REF=<last built> COMMIT_REF=<head> bash scripts/netlify-should-build.sh
# exit 1 = it wants a build; exit 0 = it is skipping
```

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
