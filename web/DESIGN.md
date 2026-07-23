# JiPange Design System

The look is **warm editorial finance**: serif display type over paper-toned
surfaces, one amber accent, generous card rhythm. Everything below is
enforced through theme tokens in `app/globals.css` — change values there,
never inline.

## Typography

| Role | Face | Applied via |
| --- | --- | --- |
| Display (`h1`, `h2`, hero money figures) | Source Serif 4 | base-layer rule in `globals.css` + `font-display` utility |
| UI / body | Figtree | `font-sans` on `<body>` |

Both are self-hosted through `next/font` in `app/layout.tsx` (variables
`--font-source-serif` / `--font-figtree`). Money figures also get
`tabular-nums` so digits align while animating (`ResultCard`, `AnimatedKES`).
Card-level `h3`s and uppercase micro-labels stay in the sans — the serif is
reserved for page-level display so it keeps its authority.

## Color tokens

Declared in `@theme` in `app/globals.css`. The rules:

- **Text tiers**: `ink` (headings) → `ink-soft` (body) → `muted` (secondary,
  AA-safe on white/background) → `faint` (fine print).
- **Tint panels**: `accent-soft` / `success-soft` / `danger-soft` backgrounds
  pair with their `*-ink` or `*-deep` text tokens (e.g. `bg-accent-soft` +
  `text-accent-ink`) — never raw `accent`/`success`/`danger` as small text on
  tints.
- **Hover states**: `primary-deep`, `accent-deep`.
- **Never add `text-[#hex]`-style arbitrary color classes** for anything
  systematic. The ~66 remaining arbitrary classes in the codebase are
  deliberate one-off local color (WhatsApp green, chart series, illustration
  chips) — that's the only sanctioned use.

## Motion

One entrance: `animate-rise` (`--animate-rise`, 400ms ease-out-quint,
opacity + 10px translate). Applied to conditionally-mounted content
(calculator results, error pages) so it fires exactly when content appears —
no observers. `prefers-reduced-motion` is globally respected via the media
query in `globals.css`; never add motion that bypasses it.

## Iconography

- **App chrome** (nav, system affordances): stroke SVGs on a 24-unit grid,
  2px stroke, round caps, `currentColor` — see `components/nav/NavIcons.tsx`.
  Hand-inline them; don't add an icon library for a handful of glyphs.
- **Content voice** (personas, tool cards, celebratory copy): emoji is
  intentional and stays.

## Loading & empty states

Use `components/Skeleton.tsx` blocks that mirror the real layout's rhythm
(with `role="status"` on the wrapper) — never bare "Loading..." text.

## PWA / installability

`app/manifest.ts` + `app/icon.png` (192) + `public/icon-512.png` +
`public/icon-maskable-512.png` + `app/apple-icon.png`. Manifest colors must
match `globals.css` surfaces (`#fafaf8` background, `#6b5b4d` theme). If the
logo changes, regenerate the 512/maskable pair from the new source with the
shield contained in the maskable safe zone (inner ~76%).
