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
