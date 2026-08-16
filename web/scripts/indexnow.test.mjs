/**
 * The submitter must refuse to submit more readily than it submits.
 *
 * The failure worth guarding is not "it failed to submit" — that costs a day of
 * crawl latency and the next run fixes it. It is submitting BEFORE the key file
 * is live: every such attempt is a rejection that teaches nothing, and a host
 * that keeps sending unverifiable claims is a host that stops being believed.
 *
 * So most of this asserts that nothing was sent.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { main, keyFile, ROUTES, ORIGIN, HOST, PUBLIC_DIR } from './indexnow.mjs';

const resp = (status, body = '') => ({
  status,
  text: async () => body,
});

/** A fetch double that records every call and answers by URL. */
function fakeFetch(answers) {
  const calls = [];
  const impl = async (url, init) => {
    calls.push({ url, init });
    for (const [match, value] of answers) {
      if (url.includes(match)) return value;
    }
    return resp(404);
  };
  impl.calls = calls;
  return impl;
}

const posted = (f) => f.calls.filter((c) => c.init?.method === 'POST');

describe('the shipped key file', () => {
  it('exists, is unique, and contains its own name', () => {
    const file = keyFile();
    expect(file, 'exactly one <hex>.txt must exist in public/').toBeTruthy();
    const key = file.replace(/\.txt$/, '');
    expect(readFileSync(join(PUBLIC_DIR, file), 'utf8').trim()).toBe(key);
    expect(key.length).toBeGreaterThanOrEqual(8);
    expect(key.length).toBeLessThanOrEqual(128);
  });
});

describe('what it refuses to do', () => {
  it('does not submit when the key file 404s on the live site', async () => {
    const f = fakeFetch([]);
    const code = await main(f);
    expect(posted(f), 'MUST NOT submit before the key is published').toEqual([]);
    // Not yet deployed is not an error — the next run finds it.
    expect(code).toBe(0);
  });

  it('does not submit when the live file holds a different key', async () => {
    const f = fakeFetch([['.txt', resp(200, 'some other value')]]);
    await main(f);
    expect(posted(f)).toEqual([]);
  });

  it('reports a rejected submission rather than swallowing it', async () => {
    const key = keyFile().replace(/\.txt$/, '');
    const f = fakeFetch([
      ['.txt', resp(200, key)],
      ['api.indexnow.org', resp(422)],
    ]);
    expect(await main(f)).toBe(1);
  });
});

describe('what it sends once the key verifies', () => {
  const key = keyFile().replace(/\.txt$/, '');
  const ok = () =>
    fakeFetch([
      ['.txt', resp(200, key)],
      ['api.indexnow.org', resp(200)],
    ]);

  it('submits, and exits clean', async () => {
    const f = ok();
    expect(await main(f)).toBe(0);
    expect(posted(f)).toHaveLength(1);
  });

  it('carries the host, the key and where to find it', async () => {
    const f = ok();
    await main(f);
    const body = JSON.parse(posted(f)[0].init.body);
    expect(body.host).toBe(HOST);
    expect(body.key).toBe(key);
    expect(body.keyLocation).toBe(`${ORIGIN}/${key}.txt`);
  });

  it('submits only our own origin, with no duplicates', async () => {
    const f = ok();
    await main(f);
    const { urlList } = JSON.parse(posted(f)[0].init.body);
    expect(urlList.length).toBe(ROUTES.length);
    expect(urlList.every((u) => u.startsWith(ORIGIN))).toBe(true);
    expect(new Set(urlList).size).toBe(urlList.length);
  });

  it('never submits /404', () => {
    // An error page is not content. The sitemap excludes it for the same
    // reason, and a crawler told to index it will.
    expect(ROUTES.some((r) => r.includes('404'))).toBe(false);
  });
});
