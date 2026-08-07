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

- **No Content-Security-Policy.** Next.js emits inline scripts and Tailwind
  emits inline styles, so a correct policy needs nonces threaded through the
  framework. A wrong CSP breaks the site in production only, so this is
  deliberate work rather than a config line, and it has not been done.
- `X-XSS-Protection` was removed rather than kept. See the comment in
  `netlify.toml` — the header enables a legacy auditor no current browser
  ships, and which was itself exploitable.

## Scope

In scope: this repository, and https://jipangefinance.org.

Out of scope: third-party services we merely link to, and findings that depend
on an attacker already controlling the reader's device or browser extensions.
