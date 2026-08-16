/**
 * Tell Bing and Yandex the rates changed, without needing an account.
 *
 * WHY THIS EXISTS
 * ---------------
 * robots.ts and sitemap.ts have both been correct for a while, and neither had
 * ever been SUBMITTED anywhere. A sitemap nothing has been told about is a list
 * nobody asked for: crawlers find it eventually, on their own schedule, which
 * for a small domain is weeks.
 *
 * Google withdrew its sitemap ping endpoint in June 2023 and offers no keyless
 * equivalent — its Indexing API is scoped to job postings and broadcast events.
 * Google discovery therefore rests on the `Sitemap:` line in robots.txt, which
 * is already there and is the mechanism Google documents. Bing and Yandex
 * accept IndexNow, which needs no account at all.
 *
 * WHY THE KEY IS IN THE REPOSITORY, AND WHY THAT IS NOT A LEAK
 * ------------------------------------------------------------
 * The key is PUBLIC BY DESIGN. Verification works precisely because anyone can
 * fetch https://<host>/<key>.txt and read it. It proves control of a domain we
 * already demonstrably serve; there is nothing to steal. It follows that this
 * file must never be given a real secret — if a future change wants an API
 * token, it belongs in the environment, not beside the key.
 *
 * WHY IT CHECKS BEFORE IT SUBMITS
 * -------------------------------
 * The key file is not live until a deploy publishes it, so the first run after
 * this lands cannot verify. An unverifiable submission is not a soft failure at
 * the endpoint's end: it is a rejection that teaches nothing and, repeated, is
 * how a host stops being believed. So the key is fetched from the live site
 * first, and a 404 or a mismatch means report and exit 0 without submitting.
 * Not submitting is the correct outcome there, not an error.
 *
 * This mirrors backend/scrapers/indexnow.py in the sister repository. Kept as
 * two small implementations rather than a shared package because the two repos
 * share no build, and a dependency between them to save forty lines would be a
 * worse trade than the duplication.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PUBLIC_DIR = join(HERE, '..', 'public');

export const HOST = 'jipangefinance.org';
export const ORIGIN = `https://${HOST}`;
const ENDPOINT = 'https://api.indexnow.org/indexnow';

/**
 * Routes worth announcing. The tools whose output moves with the synced rates,
 * plus the entry points a reader lands on.
 *
 * `/404` is absent deliberately, for the same reason the sitemap excludes it:
 * an error page is not content and must never be submitted.
 */
export const ROUTES = [
  '/',
  '/tools/',
  '/tools/tbill-ladder/',
  '/tools/budget/',
  '/tools/savings/',
  '/tools/debt/',
  '/learn/',
  '/about/',
];

const KEY_RE = /^[0-9a-f]{8,128}\.txt$/;

/**
 * The single published key file, or null if that is not true.
 *
 * More than one means an old key was rotated in without the previous being
 * removed, and a stale key file is a second artefact claiming to speak for the
 * domain.
 */
export function keyFile() {
  const found = readdirSync(PUBLIC_DIR).filter((f) => KEY_RE.test(f));
  if (found.length === 1) return found[0];
  if (found.length === 0) console.error('[indexnow] no key file in public/');
  else
    console.error(
      `[indexnow] ${found.length} key files in public/; expected one. Rotating ` +
        'a key means DELETING the old file, not adding beside it.'
    );
  return null;
}

/** Is the key actually published at the site root yet? */
export async function keyIsLive(key, fetchImpl = fetch) {
  const url = `${ORIGIN}/${key}.txt`;
  let resp;
  try {
    resp = await fetchImpl(url);
  } catch (err) {
    console.error(`[indexnow] key check unreachable: ${err}`);
    return false;
  }
  if (resp.status !== 200) {
    console.error(
      `[indexnow] ${url} answered ${resp.status} — the deploy that publishes it ` +
        'has not landed yet. Not submitting.'
    );
    return false;
  }
  const body = (await resp.text()).trim();
  if (body !== key) {
    console.error(
      `[indexnow] ${url} exists but does not contain the key. Not submitting.`
    );
    return false;
  }
  return true;
}

export async function submit(key, urls, fetchImpl = fetch) {
  const payload = {
    host: HOST,
    key,
    keyLocation: `${ORIGIN}/${key}.txt`,
    urlList: urls,
  };
  let resp;
  try {
    resp = await fetchImpl(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error(`[indexnow] submit unreachable: ${err}`);
    return 1;
  }
  // 200 accepted, 202 accepted pending key validation. Both are success.
  if (resp.status === 200 || resp.status === 202) {
    console.log(`[indexnow] submitted ${urls.length} URLs, HTTP ${resp.status}`);
    return 0;
  }
  // 422 means the key or the URLs did not match the host — a configuration
  // error worth failing loudly on, unlike a network blip.
  console.error(`[indexnow] endpoint answered ${resp.status}`);
  return 1;
}

export async function main(fetchImpl = fetch) {
  const file = keyFile();
  if (!file) return 0;
  const key = file.replace(/\.txt$/, '');
  const contents = readFileSync(join(PUBLIC_DIR, file), 'utf8').trim();
  if (contents !== key) {
    console.error(
      `[indexnow] ${file} does not contain its own name as the key. IndexNow ` +
        'requires the file be named <key>.txt and contain <key>.'
    );
    return 1;
  }
  if (!(await keyIsLive(key, fetchImpl))) return 0;
  return submit(key, ROUTES.map((r) => `${ORIGIN}${r}`), fetchImpl);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(await main());
}
