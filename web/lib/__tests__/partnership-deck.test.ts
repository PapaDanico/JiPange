import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { unzipSync, strFromU8 } from 'fflate';
import { TOOL_META } from '../tool-meta';

/**
 * The deck is a binary we hand to institutions, and nothing else in this suite
 * can read it.
 *
 * That combination is how it drifted. Slides 1, 6, 7 and 17 were updated to
 * "25 calculators" when the count changed; slides 10 and 19 were not, so the
 * same download claimed two different numbers about the same product. Slide 19
 * — the contact slide — also still carried a literal
 *
 *     partners@jipangefinance.org [placeholder — confirm address]
 *
 * which is the single worst string to ship on a business-facing page, because
 * the reader it reaches is the one deciding whether we are serious.
 *
 * A figure typed into a file no test opens will eventually disagree with the
 * product. This opens it.
 */

const DECK = 'public/partners/jipange-mwangaza-partnership-deck.pptx';

function slideText(): { name: string; text: string }[] {
  const files = unzipSync(new Uint8Array(readFileSync(new URL(`../../${DECK}`, import.meta.url))));
  return Object.keys(files)
    .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
    .sort()
    .map((n) => ({ name: n, text: strFromU8(files[n]).replace(/<[^>]+>/g, '') }));
}

describe('the partnership deck', () => {
  const slides = slideText();

  it('opens at all', () => {
    // If the rewrite that patched the XML corrupted the archive, every other
    // assertion here would pass vacuously on an empty list.
    expect(slides.length).toBeGreaterThan(10);
  });

  it('quotes the calculator count the product actually ships', () => {
    const actual = Object.keys(TOOL_META).filter((h) => h.startsWith('/tools/')).length;
    for (const s of slides) {
      for (const m of s.text.matchAll(/(\d+)\s+calculators/g)) {
        expect(Number(m[1]), `${s.name} says ${m[1]} calculators, product ships ${actual}`).toBe(
          actual
        );
      }
    }
  });

  it('carries no placeholder left over from drafting', () => {
    for (const s of slides) {
      expect(s.text, `${s.name} still contains a drafting placeholder`).not.toMatch(
        /placeholder|\bTBC\b|TODO|confirm address|\bXXX\b|lorem ipsum/i
      );
    }
  });

  it('gives an address that exists elsewhere in the product', () => {
    // Not a spellcheck: an invented contact address on the closing slide is a
    // dead end for exactly the reader who got that far.
    const addresses = new Set<string>();
    for (const s of slides) {
      for (const m of s.text.matchAll(/[\w.+-]+@[\w.-]+\.\w+/g)) addresses.add(m[0]);
    }
    expect(addresses.size, 'the deck names no contact address at all').toBeGreaterThan(0);
    for (const a of addresses) {
      expect(a, `${a} appears in the deck but nowhere in the site`).toBe('hello@jipangefinance.org');
    }
  });
});
