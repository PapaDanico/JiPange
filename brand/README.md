# Brand source assets

Source artwork. **Nothing here is served** — the app renders from `web/public/`.

Four AVIF files arrived at the repository root on 14 August 2026 with generated
filenames. One is kept. The other three were removed, and the reason is worth
recording so they are not re-added.

## Kept: `wordmark-500.avif` — 500×500

The "JiPange" wordmark on its own, green with the gold dot on the *i*. This is
the one thing the repository did not already have: `web/public/` carries a
shield (`logo-icon.webp`) and a shield-plus-wordmark lockup
(`logo-lockup.webp`), but no wordmark by itself.

Not wired into the app. Filed here for whoever needs the wordmark alone.

## Removed, and why

Each of the other three was a **lower-resolution copy of something already
shipping**. Measured, not assumed:

| Arrived as | Duplicate of | Resolution |
|---|---|---|
| `GCrNX8JkZ-zOJDgx.avif` | `web/public/logo-icon.webp` | 500×500 vs **973×833** |
| `iOGTNJLWeqqX8t5E.avif` | `web/public/logo-lockup.webp` | 500×500 padded vs **1131×609** cropped |
| `yhX8pTJ0K12NX3g9.avif` | the file above | same artwork, re-encoded |

The last two were checked pixel by pixel rather than by eye: 28,555 of 250,000
pixels differ, and the differences are diffuse noise tracking every edge —
the signature of two lossy encodes of one source, not a design revision.

The 500×500 files are also *padded* rather than cropped, so a large share of
each is transparent margin. Dropped into a header at a fixed height, they
render the logo visibly smaller than the current assets do at the same CSS
size.

Committing them would have put a worse copy of every logo beside the good one,
with nothing but resolution to tell them apart — and the hashed names gave no
hint which was which. If a genuine update to the shield or the lockup arrives,
it should be at or above the resolution of what it replaces.
