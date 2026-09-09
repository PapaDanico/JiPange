# Why Vercel builds nothing here

`vercel.json` sets `git.deploymentEnabled` to `false`, so pushing to this
repository no longer triggers a Vercel build on any branch.

## What was happening

A Vercel project (`ji-pange-finance`, root directory `web`) was building **every
push and every pull request**, in parallel with Netlify. PR #215 alone triggered
a Vercel preview build, a Netlify preview build, and a GitHub Actions run.

That contradicts a cost control the repository already documents and had
already paid for. From the root `README.md`, and repeated in the comments in
`netlify.toml`:

> **Deploy previews and branch deploys are off.** They were roughly half of all
> build spend, against a credit pool shared with Mwangaza that reached zero and
> left merged commits unpublished on both sites.

Netlify previews were switched off for that reason. A second builder doing the
same work on the same commits reintroduces the same spend from a different
account, which is why it is switched off here too rather than left as a
duplicate of a build we deliberately stopped paying for.

Review happens through CI, the diff, and local screenshots — the same answer
`netlify.toml` gives.

## What this does NOT do

It does not touch DNS, domains, or whatever currently serves
`jipangefinance.org`. **The Vercel project still holds `jipangefinance.org` and
`www.jipangefinance.org` as attached domains**, so if production traffic
resolves to Vercel rather than Netlify, this file changes nothing about that —
it only stops new builds being made from pushes.

That question is unresolved and matters: two platforms both configured to serve
the same hostname is a coin-toss about which build a reader sees, and this
repository's `README.md` states plainly that deployment is "Netlify, from
`main`". If Netlify is the intended host, the domains should be detached from
the Vercel project; if Vercel is, the README and `netlify.toml` are describing a
deployment that no longer happens. Either way, one of the two is wrong today.

**Deliberately not done from here:** pausing the Vercel project. `pause_project`
makes its production deployment return `503 DEPLOYMENT_PAUSED`, and with the
live domains attached and no way to verify from this environment which platform
answers them, that risks taking a live site offline to save a build credit.

## Reversing it

Delete `vercel.json`, or set the branch values to `true`. Nothing else here
depends on it.
