import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const config = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  // Generated PWA build artifacts (service worker + Workbox runtime), never
  // hand-written — everything else in public/ is static assets, not source.
  { ignores: ["public/**"] },
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
