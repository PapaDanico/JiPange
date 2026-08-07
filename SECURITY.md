# Security

## Reporting a vulnerability

Email **hello@jipangefinance.org** with `SECURITY` in the subject.

Please include what you found, the steps to reproduce it, and what an attacker
gets out of it. A proof of concept helps more than a scanner rating.

Expect an acknowledgement within **3 working days** and an assessment within
**10**. If a fix is warranted you will be told when it ships, and credited by
name unless you would rather not be.

Please do not open a public issue for a vulnerability, and please do not test
against the live site in a way that would affect other people — no automated
scanning of jipangefinance.org, no denial of service, no attempts to reach
another person's data. Everything worth testing here runs locally: see
[README.md](./README.md) for setup.

## What this project holds, which is close to nothing

There is no account system, no login, and no server-side profile. Calculator
inputs — salary, debts, savings — stay in the browser and are never sent
anywhere. There is no database of user records to breach.

That shapes what a vulnerability here looks like. The realistic harm is not
data theft but **a wrong number presented confidently**: an arithmetic error or
a corrupted rate that leads somebody to a bad decision about their own money.
Reports of that kind are as welcome as XSS, and treated with the same
seriousness.

## Interest rates come from a snapshot, not a live fetch

Rates are committed to the repository by `scripts/sync-rates.mjs`, which reads
Mwangaza Yield's published feed in CI. The app ships that file; it does not
call out at runtime.

The script refuses rather than risks. An unreachable feed, an unparseable
response, an unknown schema version, a missing tenor, a yield outside a sane
band, or a figure that moved implausibly far in one day all leave the existing
snapshot untouched and report the refusal. Yesterday's verified rate beats
today's corrupt one.

If you find a way to make it accept a figure it should have refused, that is a
security issue in the sense that matters here — please report it.

## Current known gaps

Stated plainly rather than left for you to discover:

- **The Content-Security-Policy permits inline script.** `script-src` carries
  `'unsafe-inline'`, so the policy does not stop injected script from running.
  That is the honest limit and it is the only loose directive: everything else
  is locked to same-origin, including `object-src 'none'`, `base-uri 'self'`,
  `form-action 'self'` and `frame-ancestors 'self'`.

  This entry previously read "No Content-Security-Policy", reasoning that Next
  emits inline scripts, a correct policy therefore needs nonces threaded
  through the framework, and a wrong CSP breaks production only. All three are
  true, and they are an argument about **one directive**. Applying it to the
  whole header meant the site also went without the directives that need no
  nonce, break nothing, and block real attacks — a `<base>` tag injection
  repointing every relative URL, a form rewritten to post to another origin, a
  plugin-based payload.

  The policy is verified rather than reviewed. `npm run verify:csp` starts the
  app, proxies it behind the exact string parsed from `netlify.toml`, and fails
  on any console violation across every route discovered from `app/`; CI runs
  it on each pull request. A directive that would break production breaks the
  run instead. Confirmed to detect real breakage by mutation — removing
  `'unsafe-inline'` trips it on all 43 routes.
- `X-XSS-Protection` was removed rather than kept. See the comment in
  `netlify.toml` — the header enables a legacy auditor no current browser
  ships, and which was itself exploitable.

## Scope

In scope: this repository, and https://jipangefinance.org.

Out of scope: third-party services we merely link to, and findings that depend
on an attacker already controlling the reader's device or browser extensions.
