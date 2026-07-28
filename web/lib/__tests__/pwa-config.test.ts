import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

/**
 * `aggressiveFrontEndNavCaching` must stay off, and the reason must stay
 * written down.
 *
 * It fired two HTTP 400s on every single page load — all 25 tools, all 6
 * planners, every static page — because the worker it enables scans prefetched
 * HTML as TEXT and never entity-decodes it, so the image URL it tries to cache
 * arrives as `?url=...&amp;w=3840&amp;q=75` and Next's image route reads no
 * width at all.
 *
 * It survived a long time because it is invisible from both ends: the real
 * <img> loads fine so nothing looks broken, and the worker's fetches are not
 * attributed to the page, so they do not appear in page-level devtools or in a
 * CDP network trace. It only shows up if you diff what the browser actually
 * requests against what the page needs.
 *
 * Turning it back on is a one-word edit that looks like a performance
 * improvement. This is the note that argues back.
 */
describe('the PWA config', () => {
  const cfg = readFileSync(new URL('../../next.config.mjs', import.meta.url), 'utf8');

  it('keeps aggressive front-end nav caching off', () => {
    expect(cfg, 'next.config.mjs no longer mentions the option at all').toMatch(
      /aggressiveFrontEndNavCaching/
    );
    expect(
      cfg,
      'aggressiveFrontEndNavCaching is on again — it 400s twice per page load'
    ).not.toMatch(/aggressiveFrontEndNavCaching:\s*true/);
    expect(cfg).toMatch(/aggressiveFrontEndNavCaching:\s*false/);
  });

  it('still keeps the page cache offline browsing depends on', () => {
    // The fix must not take offline support with it. These are separate
    // options and only one of them was the problem.
    expect(cfg, 'cacheOnFrontEndNav was turned off too — offline browsing dies').toMatch(
      /cacheOnFrontEndNav:\s*true/
    );
  });

  it('explains itself to whoever tries to turn it back on', () => {
    // A bare `false` reads as a missing feature. The evidence has to travel
    // with the setting or it gets "fixed" by the next person optimising.
    const near = cfg.slice(0, cfg.indexOf('aggressiveFrontEndNavCaching:'));
    expect(near, 'the reason it is off is no longer recorded').toMatch(/400/);
    expect(near).toMatch(/amp;/);
  });
});
