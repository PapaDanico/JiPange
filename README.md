# JiPange

A financial literacy toolkit for Kenya: 26 calculators that answer money
questions in Kenyan terms — PAYE and SHA on a payslip, Fuliza's real cost, a
chama's payout order, whether a SACCO beats a bank, what a T-bill leaves you
after withholding tax and inflation.

Everything runs in the browser. There is no account, no server-side profile,
and nothing about a user's money leaves their device.

## Getting started

```bash
npm install          # workspaces: the app lives in web/
npm run dev          # http://localhost:3000
```

From the repository root, `npm run dev|build|lint|test` all delegate into
`web/`. To run a command directly against the app, use `npm run <script>
--workspace web`.

| Command | What it does |
| --- | --- |
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build (`next build --webpack`) |
| `npm test` | Unit suite (Vitest) |
| `npm run lint` | ESLint |
| `npm run sync:rates` | Refresh the committed rates snapshot — see below |

Inside `web/` there are two more: `npm run typecheck` (`tsc --noEmit`) and
`npm run e2e` (Playwright).

## Layout

```
web/app/          Next.js App Router. Each calculator is app/tools/<name>/
web/lib/          The maths. Pure modules, no React — this is where correctness lives
web/lib/__tests__ Unit tests, deliberately beside the code they test
web/components/   UI. Presentation only; a component should not compute a number
web/e2e/          Playwright specs
scripts/          Build-time and CI tooling (rates sync, Netlify build gate)
```

The split that matters is **`lib/` computes, `components/` renders.** A
calculator's arithmetic belongs in `lib/` where it can be unit-tested without a
browser; the component reads the result and displays it. When those blur, a
number gets computed twice in two places and the two drift.

## Where the rates come from

Interest rates are **not** fetched at runtime. `scripts/sync-rates.mjs` pulls
Mwangaza Yield's published feed in CI and commits a snapshot, and the app ships
that file (`web/lib/rates-feed.ts` explains the reasoning).

The script's governing rule is that it **refuses rather than risks**: an
unreachable feed, an unparseable response, an unknown schema version, missing
tenors, a yield outside a sane band, or a figure that moved implausibly far in
one day all end the same way — the existing snapshot is left untouched and CI
reports it. Yesterday's verified rate beats today's corrupt one in a tool
people use to decide where to put money.

Exit codes: `0` updated or already current, `1` refused.

## And where the forward-looking figures come from

The registry in `web/lib/sources.ts` also carries three PROJECTIONS from the
IMF's World Economic Outlook (April 2026 edition) — Kenya's 2026 growth,
annual-average inflation and debt-to-GDP — each with its WEO subject code, an
`asOf` date and a `reviewBy` tied to the WEO's April/October cadence, so the
staleness gate in `__tests__/sources.test.ts` forces a re-read after every
edition. They are exported from `kenya-stats.ts` as `IMF_WEO_*`.

They answer a different question from the measured figures, and the two are
never interchangeable: the KNBS/CBK readings say what inflation IS, the WEO
entries say what IMF staff EXPECT. A page that looks forward (a plan, a
projection) may quote them; a page that states current conditions uses the
measured outturns. The note on each registry entry says why.

## Deployment

Netlify, from `main`. Configuration is in `netlify.toml`.

Two cost controls are deliberate and documented at the point they take effect:

- **`scripts/netlify-should-build.sh`** cancels a build when a commit touches
  nothing `next build` reads. Its exit polarity is inverted from every other
  script here — `0` skips, non-zero builds — so it says so at both exit points.
  Every uncertain case builds: a build we did not need costs one credit, a
  skipped build we did need ships a planner that disagrees with the one people
  were shown.
- **Deploy previews and branch deploys are off.** They were roughly half of all
  build spend, against a credit pool shared with Mwangaza that reached zero and
  left merged commits unpublished on both sites. Review happens through CI, the
  diff, and local screenshots.

Both are reversible: the comments in `netlify.toml` say exactly what to delete
to bring previews back.

## Stack

Next.js 16 · React 19 · Tailwind v4 · TypeScript · Vitest · Playwright ·
Netlify.

One trap is worth knowing before you touch the export feature. Tailwind v4
emits colours via `color-mix()` in oklab space, and **`html2canvas` 1.4.1
throws `unsupported color function oklab`** on it — which reaches the user as
an export button that appears to do nothing. The app uses
[`html2canvas-pro`](https://www.npmjs.com/package/html2canvas-pro) instead.
Import that, never `html2canvas`.

## Contributing

This is not an open-source project and pull requests from outside the team are
not being accepted — see the licence below. For anyone working on it:

- Put arithmetic in `lib/`, with a test beside it. A calculator without a unit
  test is a calculator nobody can safely change.
- Prefer a test that fails when the behaviour is reverted. A test that passes
  against an empty result is worse than no test, because it reports coverage
  that does not exist.
- Money is `Ksh`, consistently, everywhere a user can see it.
- Run `npm test` and `npm run lint` before pushing; `npm run build` if you have
  touched anything under `web/app`.

## Licence

Copyright © 2026 JiPange. All rights reserved.

This source is published for reference and is **not** licensed for reuse,
redistribution, or derivative works. No open-source licence is granted, and
nothing here should be read as one. For licensing enquiries, see
[`/licensing`](https://jipangefinance.org/licensing).
