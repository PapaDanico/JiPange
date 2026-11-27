import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { ROUTE_LABELS, TBILL_RATES, tbillRoute } from '../rates-feed';
import { KNOWN_ROUTES, sanitizeRoutes } from '../../../scripts/route-field.mjs';

const feed = () => ({
  tbills: [
    { tenorDays: 91, via: 'cbk-home' },
    { tenorDays: 182, via: 'made-up-route' },
    { tenorDays: 364 },
  ],
  macro: {
    inflation: { value: 1, via: 'supplied-document' },
    usdKes: { value: 2, via: null },
    centralBankRate: null,
    inflationCore: { value: 3 },
  },
});

describe('the publisher route (via) is validated before it is stored', () => {
  it('keeps a known route and drops an unknown one, reporting it', () => {
    const f = feed();
    const dropped = sanitizeRoutes(f);
    expect(f.tbills[0].via).toBe('cbk-home');
    expect('via' in f.tbills[1], 'an unrecognised route must be removed, not kept').toBe(false);
    expect(f.macro.inflation.via).toBe('supplied-document');
    expect(dropped).toHaveLength(2);
  });

  it('never invents a route: absent stays absent, null is dropped', () => {
    const f = feed();
    sanitizeRoutes(f);
    expect('via' in f.tbills[2]).toBe(false);
    expect('via' in (f.macro.usdKes as object)).toBe(false);
    expect('via' in (f.macro.inflationCore as object)).toBe(false);
    expect(f.macro.centralBankRate).toBeNull();
  });

  it('tolerates a feed with no tbills or macro at all', () => {
    expect(sanitizeRoutes({})).toEqual([]);
    expect(sanitizeRoutes(null)).toEqual([]);
  });

  it('lists exactly the routes the RateRoute type allows', () => {
    const src = readFileSync(new URL('../rates-feed.ts', import.meta.url), 'utf8');
    const m = /export type RateRoute =([^;]+);/.exec(src);
    expect(m, 'RateRoute type not found in rates-feed.ts').not.toBeNull();
    const union = [...m![1].matchAll(/"([^"]+)"/g)].map((x) => x[1]).sort();
    expect([...KNOWN_ROUTES].sort()).toEqual(union);
  });

  it('is applied by the sync script before anything is written', () => {
    const script = readFileSync(new URL('../../../scripts/sync-rates.mjs', import.meta.url), 'utf8');
    const at = (n: string) => script.indexOf(n);
    expect(at('sanitizeRoutes(incoming)')).toBeGreaterThan(-1);
    expect(at('sanitizeRoutes(incoming)')).toBeLessThan(at('writeFileSync(SNAPSHOT'));
  });
});

describe('the badge says only what the stored route supports', () => {
  it('has a label for every known route and no others', () => {
    expect(Object.keys(ROUTE_LABELS).sort()).toEqual([...KNOWN_ROUTES].sort());
  });

  it('shows the label of the newest bill row, or nothing when it has no route', () => {
    const via = TBILL_RATES[0]?.via;
    const route = tbillRoute();
    if (via) {
      expect(route, `snapshot carries via "${via}" but the badge shows nothing`).toEqual(ROUTE_LABELS[via]);
    } else {
      expect(route, 'no recorded route must show no badge, never a guess').toBeNull();
    }
  });

  it('the shipped snapshot only holds routes the labels know', () => {
    const snap = JSON.parse(readFileSync(new URL('../rates-snapshot.json', import.meta.url), 'utf8'));
    const rows = [...snap.tbills, ...Object.values(snap.macro).filter(Boolean)] as { via?: string }[];
    for (const r of rows) if (r.via !== undefined) expect(KNOWN_ROUTES).toContain(r.via);
  });
});
