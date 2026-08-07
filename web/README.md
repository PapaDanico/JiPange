# web/

The JiPange Next.js application. **Documentation lives in the repository root
[`README.md`](../README.md)** — setup, layout, where the rates come from,
deployment, and the licence.

This file used to be the untouched `create-next-app` boilerplate, which told
readers to deploy on Vercel. The app is hosted on Netlify, so the one concrete
instruction it carried was wrong, and it was the first file a newcomer opened.

## Scripts

Run from here, or from the root with `--workspace web`.

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server on http://localhost:3000 |
| `npm run build` | Production build |
| `npm test` | Unit suite (Vitest) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run e2e` | Playwright specs in `e2e/` |
| `npm run typecheck:e2e` | Typecheck the Playwright suite separately |

See also [`DESIGN.md`](./DESIGN.md) for the visual and interaction rules.
