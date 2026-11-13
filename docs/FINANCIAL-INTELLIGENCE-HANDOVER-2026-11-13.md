# JiPange financial intelligence: implementation and evidence handover

Status: research and engineering backlog, **not** a claim that these features are shipped.
Baseline: main includes Claude's merged PR #275 (commit f660721); PR #276 adds disclosure fixes and must be verified before merging.
Updated: 2026-11-13.

## Existing capabilities — preserve rather than rebuild

- `web/lib/tax.ts`: PAYE bands, personal relief, NSSF Year 4 effective February 2026, SHIF, housing levy, pension/mortgage/insurance provisions. Regulatory figures must be checked against effective-dated primary publications before changes.
- `web/lib/sources.ts`: source registry with publisher, publication title, `asOf`, `reviewBy` and expiry tests. Extend this registry; do not introduce an unrelated source-of-truth.
- `web/lib/rates-feed.ts` and `scripts/sync-rates.mjs`: dated, versioned Mwangaza Yield snapshots; refuse invalid/stale claims rather than guessing. Never hand-edit `rates-snapshot.json`.
- `web/lib/loan-comparison.ts`: currently models hypothetical SACCO, bank, flat-rate digital lender, Fuliza and M-Shwari cases. These are not actual offers.
- `web/lib/__tests__/arithmetic-sweep.test.ts`: numerical-finiteness safety contract; extend whenever adding an engine.
- `CLAUDE.md`: deployment and verification runbook; authoritative for the repository.

## P0 — release integrity

1. Run `npm run verify:all` locally from the integration commit, recording exact commit SHA, unit/e2e counts, lint, typecheck and build outcomes. GitHub Actions may fail before assigning a runner because of account billing; do not treat that as a code test.
2. Inspect PR #276 for UI/engine compatibility and regressions; merge only when checks are satisfactory.
3. Verify Netlify project name `jipangefinance` with a fresh project lookup before any deployment. Confirm deployed production commit matches merged main; do not infer production from a merge or a canceled deploy preview.
4. Avoid Vercel workflow changes and avoid repeated Netlify preview deployments. Keep one consolidated production release.

## P0 — financial methodology

### Borrowing comparison
- Stop presenting annualised cost approximations as equivalent, fee-inclusive APRs. Distinguish nominal contractual rate, effective annual interest rate, approximate annualised fee burden, and IRR-based effective borrowing cost.
- Do not present traffic-light lender rankings from invented or illustrative assumptions.
- Actual quotation comparison should accept: cash disbursed, payment amount and timing, origination fee, insurance, mandatory deposit/share purchase, taxes, early settlement costs and product eligibility.
- Model cash flows from the borrower's perspective. An IRR-derived annual effective cost is only valid when the actual dated cash flows and net proceeds are known. If not, show total cost and label the annualised indicator approximate.
- Never extrapolate Fuliza or M-Shwari into an implied 12-month amortising offer. Treat rollover examples as explicit user-selected scenarios, not a prediction.
- Verify all tariffs from lender primary documentation and record as-of date. The existing 1% SACCO monthly and 15% bank annual are examples, not market quotes.

### Payroll
- Check NSSF Year 4 limits and effective date against NSSF primary circulars; verify SHIF, housing levy, PAYE bands, pension/mortgage deduction limits and insurance relief against KRA, SHA, NSSF and legislation.
- Maintain boundary-value tests at every tax band and NSSF tier ceiling, plus effective-date tests. Do not silently apply 2026 rules to 2025 pay periods.
- No statutory constant changes without an exact source document, date and test case.

### Government securities
- Reuse the Mwangaza Yield rates contract and freshness guards. Separate quoted T-bill rate, purchase price, gross effective yield, net effective yield, coupon rate and bond yield-to-maturity.
- Cash-flow ladder: instrument identifier, face value, purchase consideration, coupon dates, redemption date, tax status and settlement assumptions. Display coupon and principal separately by calendar month.
- A bond sold before maturity can incur capital loss; do not equate coupon rate with expected return.
- Refuse calculations requiring missing coupon schedules, tax status or settlement details; never fill these with inferred defaults.

## P1 — decision support, not calculator proliferation

### Household financial resilience
- Inputs: liquid savings, essential monthly outflows, debt obligations, irregular-income schedule, planned school fees and other dated liabilities.
- Outputs: essential-expense runway, month-by-month liquidity gap, 10/20/30% income shock scenarios and recovery contribution.
- Define runway as liquid accessible reserves divided by essential monthly outflow; show whether debt service is included to prevent double counting.
- Add deterministic tests for zero outflows, missing data, date rollovers, and the distinction between liquid savings and locked bond principal.

### Data provenance
- Add dated assumption metadata to the existing `sources.ts` pattern: assumption type (observed/quoted/illustrative/forecast), unit, effective period, publisher, source URL, verifiedAt and reviewBy.
- Existing data refreshes must remain fail-closed; stale data can be shown only with a conspicuous as-of date and without 'current' claims.
- Separate CBK observed series, KNBS historical measures and forecasts; never label projections as measured outturns.

## Acceptance gates

- All money outputs finite for valid bounded inputs; invalid inputs block misleading outputs.
- No unsourced current-rate or regulatory claims; each source-backed number carries publication and date.
- No annualised APR label without an explicit, reproducible fee-inclusive method.
- No inferred cheapest lender when actual eligibility and total costs are unknown.
- Every new engine has unit tests, boundary tests and at least one UI integration test.
- `npm run verify:all` passes at the final merged SHA; production deployment SHA and domain verified separately.

## Coordination with Claude Code

Claude merged earlier input-safety PRs in #275 and recorded 1,243 unit tests and 174 e2e tests passing. Those are handover-reported results, not a substitute for rerunning tests on new changes. Do not reimplement those fixes. Read `CLAUDE.md` before touching the feed, Netlify or tax engine. Keep PR descriptions explicit about which parts are code, which are research and which are still unverified.
