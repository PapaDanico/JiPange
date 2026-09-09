import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const config = [
  /* GENERATED OUTPUT, NEVER HAND-WRITTEN.
   *
   * public/** contains PWA build artifacts (service worker + Workbox runtime)
   * and static assets rather than application source.
   *
   * Netlify loads extensions before running the lint command from netlify.toml.
   * The baseline extension can therefore write a generated third-party bundle
   * to .netlify/edge-functions/baseline_ef.ts before ESLint starts. That bundle
   * legitimately uses `var`, which previously caused 225 `no-var` errors and
   * stopped deployment before `next build`. .next/** is ignored for the same
   * reason on cached or retried builds. Recursive patterns cover these artifacts
   * even when the project is checked from a parent workspace directory. */
  {
    ignores: [
      "**/.netlify/**",
      "**/.next/**",
      "**/node_modules/**",
      "public/**",
    ],
  },
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      // New in eslint-plugin-react-hooks@7 (pulled in by this ESLint bump).
      // The codebase has ~24 pre-existing, intentional instances of the
      // exact pattern this flags — hydrating state from a browser-only
      // source (localStorage) inside a mount effect, specifically so the
      // server and first client render match before hydration swaps in the
      // real value. The correct long-term fix is useSyncExternalStore, but
      // migrating ~24 call sites' state-hydration architecture is a real
      // refactor with its own behavioral surface, not something to fold
      // into a dependency-version bump. Downgraded to a warning so it stays
      // visible rather than either silently suppressed or blocking builds.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
];

export default config;
