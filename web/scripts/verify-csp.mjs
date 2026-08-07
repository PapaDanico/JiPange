/**
 * Serve the running app behind the REAL Content-Security-Policy and fail on
 * any violation.
 *
 * WHY A PROXY RATHER THAN A STATIC FILE SERVER
 *
 * Mwangaza is `output: 'export'`, so its equivalent check serves ./out
 * directly. JiPange is not — it publishes .next and runs on Netlify's Next
 * runtime, so the pages that matter only exist once the server renders them.
 * This puts a proxy in front of `next start` and stamps the header on every
 * response, which is what Netlify does in production.
 *
 * WHY THE POLICY IS EXERCISED RATHER THAN REVIEWED
 *
 * netlify.toml said, correctly, that "a CSP that is wrong breaks the site in
 * production only". That property is exactly what makes a policy unreviewable
 * by eye — the directive that breaks a page looks identical to the one that
 * does not — and it is why this repository shipped without one. So the policy
 * is not signed off by reading it. Every route is loaded in Chromium with the
 * header applied and every "Refused to..." is a failure.
 *
 * THE POLICY IS READ FROM netlify.toml, NOT COPIED
 *
 * A copy would drift, and the copy that drifts is never the one that gets
 * corrected. What ships is what is tested, or this proves nothing.
 */
import http from 'node:http';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { chromium } from 'playwright-core';

const APP = process.env.APP_ORIGIN || 'http://localhost:3000';
const PORT = 4600;
const EXECUTABLE = process.env.CHROMIUM_PATH || undefined;

function shippedCsp() {
  const toml = readFileSync(new URL('../../netlify.toml', import.meta.url).pathname, 'utf8');
  const block = toml.match(/Content-Security-Policy\s*=\s*"""([\s\S]*?)"""/);
  const line = toml.match(/Content-Security-Policy\s*=\s*"([^"]+)"/);
  const raw = block ? block[1] : line ? line[1] : null;
  if (!raw) {
    console.error('No Content-Security-Policy found in netlify.toml.');
    process.exit(1);
  }
  // TOML folds long lines with a trailing backslash; it is not part of the value.
  return raw.replace(/\\\s*\n/g, '').replace(/\s+/g, ' ').trim();
}

/**
 * Routes DERIVED from the app directory, not listed.
 *
 * The first version of this script carried a hand-written list, and it was
 * wrong on its first run: it named /tools/dhowcsd-ladder, which 404s — the
 * route is /tools/dhowcsd. The check reported that as a CSP failure, which it
 * was not.
 *
 * That is the exact failure this file's own comment warns about one paragraph
 * up: a kept list silently stops covering pages, and the page nobody
 * remembered is the one that breaks. Writing the warning and then hand-listing
 * the routes anyway is the defect this repository keeps finding in itself.
 *
 * Route groups — (onboarding) — are stripped, because they shape the file tree
 * and not the URL. Dynamic segments are skipped: [slug] has no single URL to
 * visit, and guessing one would put a 404 back in the list.
 */
function discoverRoutes() {
  const appDir = new URL('../app/', import.meta.url).pathname;
  const out = [];
  const walk = (dir, url) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (!e.isDirectory()) continue;
      if (e.name.startsWith('[') || e.name.startsWith('_') || e.name === 'api') continue;
      const seg = e.name.startsWith('(') && e.name.endsWith(')') ? '' : `/${e.name}`;
      const child = `${dir}${e.name}/`;
      const childUrl = `${url}${seg}`;
      if (existsSync(`${child}page.tsx`) || existsSync(`${child}page.ts`)) out.push(childUrl || '/');
      walk(child, childUrl);
    }
  };
  if (existsSync(`${appDir}page.tsx`)) out.push('/');
  walk(appDir, '');
  return [...new Set(out)].sort();
}

const ROUTES = process.env.CSP_ROUTES ? process.env.CSP_ROUTES.split(',') : discoverRoutes();

async function main() {
  const CSP = shippedCsp();
  console.log(`Policy under test:\n  ${CSP}\n`);

  const proxy = http.createServer((req, res) => {
    const target = new URL(req.url, APP);
    const up = http.request(
      { hostname: target.hostname, port: target.port, path: target.pathname + target.search,
        method: req.method, headers: { ...req.headers, host: target.host } },
      (r) => {
        res.writeHead(r.statusCode ?? 502, { ...r.headers, 'content-security-policy': CSP });
        r.pipe(res);
      }
    );
    up.on('error', (e) => { res.writeHead(502); res.end(String(e)); });
    req.pipe(up);
  });
  await new Promise((r) => proxy.listen(PORT, r));

  const browser = await chromium.launch({ executablePath: EXECUTABLE, args: ['--no-sandbox'] });
  const violations = [];

  for (const route of ROUTES) {
    const page = await browser.newPage();
    page.on('console', (m) => {
      const text = m.text();
      if (/Content Security Policy|Refused to/i.test(text)) {
        violations.push(`${route}\n      ${text.slice(0, 200)}`);
      }
    });
    await page
      .goto(`http://localhost:${PORT}${route}`, { waitUntil: 'networkidle', timeout: 30_000 })
      .catch((e) => violations.push(`${route}\n      NAVIGATION FAILED: ${e.message.slice(0, 120)}`));
    await page.waitForTimeout(900);
    await page.close();
  }

  await browser.close();
  proxy.close();

  if (violations.length) {
    const routes = new Set(violations.map((v) => v.split('\n')[0]));
    console.error(`\nCSP VIOLATIONS on ${routes.size} route(s):`);
    for (const v of [...new Set(violations)]) console.error(`  - ${v}`);
    console.error(
      '\nThe policy in netlify.toml would break these pages in production.\n' +
        'Loosen the offending directive, or change the code so it does not need it.'
    );
    process.exit(1);
  }

  console.log(`CLEAN — no CSP violations across ${ROUTES.length} routes.`);
}

main();
