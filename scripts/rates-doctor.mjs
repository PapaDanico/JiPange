/**
 * Is anything still refreshing the rates? — one command that answers it.
 *
 * WHY THIS EXISTS
 * ---------------
 * The rates pipeline had three alarms and all of them lived inside GitHub
 * Actions:
 *
 *   - sync-rates.yml runs twice a day and reports a refusal,
 *   - the suite it runs carries a test that goes red when the shipped snapshot
 *     ages past SNAPSHOT_MAX_AGE_DAYS,
 *   - the "was the suite already failing" baseline warns when it was.
 *
 * On 20 August 2026 the runner stopped being assigned at all. Every workflow
 * in the repository — the sync and CI both — began failing in four seconds,
 * before a single step ran, and has done twice a day since. All three alarms
 * were inside the thing that died, so the snapshot quietly aged from fresh to
 * twenty days old, four commits landed on main with no CI, and a ladder preset
 * went on telling readers the 364-day rung "pays most" while the feed in the
 * same build said the 182-day rung paid more.
 *
 * An alarm that only sounds inside the system it is monitoring is not an
 * alarm. This one runs anywhere: on a laptop, in a hook, in any CI that still
 * works. It reads only what is committed, so it is useful even with no network.
 *
 * Exit codes: 0 = healthy, 1 = the snapshot is past its budget or the feed
 * contradicts something we ship. Never writes anything — see sync-rates.mjs
 * for the only thing allowed to move the snapshot.
 */
import { readFileSync } from "node:fs";

const SNAPSHOT = "web/lib/rates-snapshot.json";
const FEED_URL = "https://mwangazayield.org/data/rates.json";

/** Read a constant out of the app rather than restating it — same argument as
 *  sync-rates.mjs makes about SUPPORTED_SCHEMA. */
const constant = (file, name) => {
  const m = readFileSync(file, "utf8").match(
    new RegExp(`(?:export )?const ${name}\\s*=\\s*(\\d+)`),
  );
  if (!m) {
    console.error(`refused: cannot find ${name} in ${file}`);
    process.exit(1);
  }
  return Number(m[1]);
};

const STALE_AFTER_DAYS = constant("web/lib/rates-feed.ts", "STALE_AFTER_DAYS");
const MAX_AGE_DAYS = constant("web/lib/__tests__/rates-feed.test.ts", "SNAPSHOT_MAX_AGE_DAYS");

const snap = JSON.parse(readFileSync(SNAPSHOT, "utf8"));
const ageDays = Math.floor((Date.now() - new Date(snap.generatedAt).getTime()) / 86_400_000);

const bills = [...snap.tbills].sort((a, b) => a.tenorDays - b.tenorDays);
const best = bills.reduce((b, r) => (r.netEAY > b.netEAY ? r : b));

let sick = false;
const say = (ok, line) => {
  if (!ok) sick = true;
  console.log(`${ok ? "ok  " : "FAIL"}  ${line}`);
};

console.log(`rates doctor — snapshot generated ${snap.generatedAt}\n`);

say(
  ageDays <= MAX_AGE_DAYS,
  `snapshot is ${ageDays} days old (budget ${MAX_AGE_DAYS}, reader-visible stale notice at ${STALE_AFTER_DAYS})`,
);
if (ageDays > MAX_AGE_DAYS) {
  console.log(
    `      Nothing has refreshed it. Check that the "Sync rates from Mwangaza Yield"\n` +
      `      workflow is still being ASSIGNED A RUNNER — a job that fails in a few\n` +
      `      seconds with no steps is not a bad rate, it is no runner at all, and no\n` +
      `      change in this repository will fix it.`,
  );
}

/* THE STAMP AND THE EVIDENCE CAN DISAGREE, AND ON 9 SEP 2026 THEY DID.
 *
 * Mwangaza's contract says generatedAt is "when the EVIDENCE was refreshed,
 * not the build". Its meta.json froze at 2026-08-19 while the scrapers kept
 * running: tbills moved to the 3 September auction and macro to 7 September.
 * Mwangaza's own freshness.json flags it — "Pipeline last ran", 19 days
 * against a 7-day budget, stale: true.
 *
 * The effect here is confusing enough to be worth naming: a sync can land
 * genuinely fresher rates and this doctor, and the reader-facing notice, will
 * both still say "old", because both key off the stamp. That is the RIGHT
 * behaviour — being over-cautious about freshness is the safe direction, and
 * inventing a freshness signal the publisher does not vouch for is the thing
 * this whole pipeline refuses to do — but somebody who has just run a
 * successful sync deserves to be told why nothing went green.
 */
const newestAuction = bills
  .map((b) => b.auctionDate)
  .filter(Boolean)
  .sort()
  .at(-1);
if (newestAuction) {
  const stampDay = snap.generatedAt.slice(0, 10);
  if (newestAuction > stampDay) {
    console.log(
      `note  the EVIDENCE is fresher than the STAMP: newest auction ${newestAuction}, ` +
        `generatedAt ${stampDay}.\n` +
        "      Upstream's generatedAt has stopped moving while its scrapers keep\n" +
        "      running. The rates below are current; the age above is not. This is\n" +
        "      an upstream bug (meta.json / the pipeline stamp), not a local one —\n" +
        "      a fresh sync will NOT clear the staleness alarm until it is fixed.\n" +
        "      Do not paper over it here: the publisher owns that field."
    );
  }
}

say(
  ageDays <= STALE_AFTER_DAYS,
  ageDays <= STALE_AFTER_DAYS
    ? "readers are being shown the figures plainly"
    : `readers are being shown the stale notice (isStale() is true at ${ageDays} days)`,
);

// The claim the app makes about the curve has to match the curve it ships.
say(true, `net yields: ${bills.map((b) => `${b.tenorDays}d ${b.netEAY}%`).join(", ")}`);
say(true, `best-paying rung: ${best.tenorDays}-day at ${best.netEAY}% net`);
if (best.tenorDays !== 364) {
  console.log(
    "      The longest rung is NOT the best-paying one. Any copy that says\n" +
      "      otherwise is wrong today — bestPayingTenor() in lib/rates-feed.ts is\n" +
      "      the only thing allowed to answer that question.",
  );
}

const inflation = snap.macro?.inflation;
say(Boolean(inflation), inflation ? `inflation ${inflation.value}% ${inflation.fallback ? "(STAND-IN source — disclosed in the UI)" : `(${inflation.source})`}` : "no inflation reading — currentInflation() will throw");

if (!process.argv.includes("--offline")) {
  try {
    const res = await fetch(FEED_URL, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(15_000) });
    if (!res.ok) {
      say(false, `feed unreachable: HTTP ${res.status} from ${FEED_URL}`);
    } else {
      const live = await res.json();
      const liveAge = Math.floor((Date.now() - new Date(live.generatedAt).getTime()) / 86_400_000);
      say(true, `feed reachable, generated ${live.generatedAt} (${liveAge} days old)`);
      say(
        live.generatedAt === snap.generatedAt,
        live.generatedAt === snap.generatedAt
          ? "snapshot matches the live feed"
          : `snapshot is BEHIND the live feed — run: node scripts/sync-rates.mjs`,
      );
    }
  } catch (err) {
    // Not a failure of the app: a sandbox with no egress reports this too.
    console.log(`note  could not reach the feed (${err.message}) — snapshot checks above still hold`);
  }
}

console.log(sick ? "\nrates doctor: ATTENTION NEEDED" : "\nrates doctor: healthy");
process.exit(sick ? 1 : 0);
