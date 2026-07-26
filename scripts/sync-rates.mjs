/**
 * Refresh the committed rates snapshot from Mwangaza Yield's published feed.
 *
 * Run daily in CI. The snapshot is what the app actually ships (see
 * web/lib/rates-feed.ts for why we hold a copy rather than fetching at
 * runtime), so this script's only job is to move it forward safely.
 *
 * IT REFUSES RATHER THAN RISKS
 * ---------------------------
 * Every failure mode here ends with the existing snapshot untouched, because
 * yesterday's verified rate beats today's corrupt one in a tool people use to
 * decide where to put money:
 *
 *   - unreachable feed, non-200, unparseable JSON  → keep what we have
 *   - a schema version this build doesn't understand → keep what we have
 *   - missing tenors, or yields outside a sane band  → keep what we have
 *   - figures that move implausibly far in one day   → keep what we have,
 *     and say so loudly; a 3-point jump in a T-bill yield is a broken
 *     upstream parse far more often than it is a real market event.
 *
 * Exit codes: 0 = updated or already current; 1 = refused (CI reports it).
 *
 * Usage:
 *   node scripts/sync-rates.mjs
 *   node scripts/sync-rates.mjs --from ../path/to/rates.json   (local testing)
 */
import { readFileSync, writeFileSync } from "node:fs";

const FEED_URL = "https://mwangazayield.org/data/rates.json";
const SNAPSHOT = "web/lib/rates-snapshot.json";
const SUPPORTED_SCHEMA = 1;
const REQUIRED_TENORS = [91, 182, 364];

/** Kenyan government paper has not been outside this band in living memory. */
const MIN_YIELD = 2;
const MAX_YIELD = 30;
/** A one-day move larger than this is a broken parse, not a market. */
const MAX_DAILY_MOVE_PP = 3;

/**
 * Past this, the feed itself has stopped moving and somebody should know.
 *
 * The checks below all ask "is this number wrong?". None of them asks "is
 * anyone still producing it?" — and those fail differently. If the upstream
 * scrapers break, the feed keeps serving its last good figures with an old
 * generatedAt, every validation passes, and this job reports "already current"
 * every morning while the data quietly ages. The app surfaces staleness to
 * readers after 14 days; this makes sure the people running it hear about it
 * too, and sooner.
 *
 * A warning, not a refusal: old-but-real rates are still the best available,
 * and refusing them would replace a stale number with no number at all.
 */
const WARN_FEED_AGE_DAYS = 10;

const argFrom = process.argv.indexOf("--from");
const localPath = argFrom > -1 ? process.argv[argFrom + 1] : null;

const fail = (why) => {
  console.error(`rates sync REFUSED: ${why}`);
  console.error("The existing snapshot is unchanged.");
  process.exit(1);
};

/* ------------------------------------------------------------------ fetch */

let incoming;
try {
  if (localPath) {
    incoming = JSON.parse(readFileSync(localPath, "utf8"));
  } else {
    const res = await fetch(FEED_URL, { headers: { accept: "application/json" } });
    if (!res.ok) fail(`feed returned HTTP ${res.status}`);
    incoming = await res.json();
  }
} catch (err) {
  fail(`could not read the feed — ${err.message}`);
}

/* --------------------------------------------------------------- validate */

if (incoming?.schema !== SUPPORTED_SCHEMA) {
  fail(
    `feed declares schema ${incoming?.schema}, this build understands ${SUPPORTED_SCHEMA}. ` +
      `Update web/lib/rates-feed.ts deliberately — do not auto-accept a new contract.`,
  );
}

if (!Array.isArray(incoming.tbills)) fail("feed has no tbills array");

for (const tenor of REQUIRED_TENORS) {
  const row = incoming.tbills.find((t) => t.tenorDays === tenor);
  if (!row) fail(`feed is missing the ${tenor}-day bill`);
  for (const field of ["quotedDiscountRate", "grossEAY", "netEAY", "pricePer100"]) {
    if (typeof row[field] !== "number" || !Number.isFinite(row[field])) {
      fail(`${tenor}-day bill has no usable ${field}`);
    }
  }
  if (row.netEAY < MIN_YIELD || row.netEAY > MAX_YIELD) {
    fail(`${tenor}-day net yield ${row.netEAY}% is outside ${MIN_YIELD}–${MAX_YIELD}%`);
  }
  // The relationship that makes the quote trap visible. If it ever inverts,
  // the upstream computation changed meaning and we must not ship it blind.
  if (!(row.netEAY < row.grossEAY)) fail(`${tenor}-day net is not below gross — check the feed`);
  if (!(row.grossEAY > row.quotedDiscountRate)) {
    fail(`${tenor}-day gross is not above the quoted discount rate — check the feed`);
  }
}

/* ------------------------------------------------------- freshness check */

if (typeof incoming.generatedAt === "string") {
  const generated = new Date(incoming.generatedAt);
  const ageDays = Math.floor((Date.now() - generated.getTime()) / 86_400_000);
  if (Number.isFinite(ageDays) && ageDays > WARN_FEED_AGE_DAYS) {
    console.warn(
      `::warning::Rates feed is ${ageDays} days old (generated ${incoming.generatedAt}). ` +
        `The upstream pipeline may have stopped. Figures below are still being used.`,
    );
  }
}

/* ------------------------------------------------- compare with what we have */

let current = null;
try {
  current = JSON.parse(readFileSync(SNAPSHOT, "utf8"));
} catch {
  console.log("no existing snapshot — accepting the feed as the first one");
}

if (current) {
  for (const tenor of REQUIRED_TENORS) {
    const was = current.tbills?.find((t) => t.tenorDays === tenor);
    const now = incoming.tbills.find((t) => t.tenorDays === tenor);
    if (!was) continue;
    const move = Math.abs(now.netEAY - was.netEAY);
    if (move > MAX_DAILY_MOVE_PP) {
      fail(
        `${tenor}-day net yield moved ${move.toFixed(2)}pp (${was.netEAY}% → ${now.netEAY}%), ` +
          `beyond the ${MAX_DAILY_MOVE_PP}pp sanity bound. If this is real, bump the bound deliberately.`,
      );
    }
  }

  if (JSON.stringify(current) === JSON.stringify(incoming)) {
    console.log("rates sync: already current, nothing to write");
    process.exit(0);
  }
}

/* ------------------------------------------------------------------ write */

writeFileSync(SNAPSHOT, JSON.stringify(incoming, null, 2) + "\n");

const summary = REQUIRED_TENORS.map((t) => {
  const now = incoming.tbills.find((x) => x.tenorDays === t);
  const was = current?.tbills?.find((x) => x.tenorDays === t);
  const delta = was ? ` (${(now.netEAY - was.netEAY >= 0 ? "+" : "") + (now.netEAY - was.netEAY).toFixed(3)})` : "";
  return `${t}d ${now.netEAY}%${delta}`;
}).join(", ");

console.log(`rates sync: updated — net yields ${summary}`);
console.log(`feed generated ${incoming.generatedAt}`);
