import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const config = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  /* GENERATED OUTPUT, NEVER HAND-WRITTEN.
   *
   * public/** is the PWA build artifacts (service worker + Workbox runtime);
   * everything else in public/ is static assets, not source.
   *
   * .netlify/** and .next/** were added after they broke a deploy, and the
   * way they broke it is worth recording because nothing local could see it.
   *
   * netlify.toml runs `npm run typecheck && npm run lint` before the build, so
   * that lint executes on the BUILD MACHINE. Netlify loads its extensions
   * first — the `baseline` extension writes
   * .netlify/edge-functions/baseline_ef.ts, a bundle of third-party UA-parsing
   * code — so by the time lint runs, a 2,000-line generated file is sitting in
   * the working directory. It uses `var` throughout, which is correct for what
   * it is and 225 errors as far as `no-var` is concerned. The build failed at
   * lint and never reached `next build`.
   *
   * It cannot reproduce locally by running the same command, because nothing
   * here generates .netlify — it appears only inside a Netlify build. The way
   * to check this ignore still works is to create the file and run lint:
   *
   *     mkdir -p .netlify/edge-functions
   *     printf 'var a = 1;\n' > .netlify/edge-functions/baseline_ef.ts
   *     npm run lint     # must stay clean
   *
   * .next/** is here for the same reason rather than because it has bitten:
   * a cached or retried build can leave it in place before lint runs. */
  /* Recursive globs, taken from the Netlify agent's fix on
   * agent-linting-generated-files-4818, and a real improvement on the
   * repo-relative patterns this first shipped with. A bare "dot-netlify slash
   * star-star" only matches when ESLint runs from web/, and it is also invoked
   * from the workspace root — `npm run lint --workspace web`, and `npm run
   * verify`. Prefixing each with a recursive segment matches either way.
   *
   * Note for anyone editing the prose here: a literal star-star-slash cannot
   * be written inside a block comment, because it contains the sequence that
   * ENDS one. Spelling one out cost a green build and a confusing
   * "SyntaxError: Unexpected token" from a config file that looked fine.
   *
   * node_modules is redundant — ESLint ignores it by default — and is kept
   * because it costs nothing and states the intent. */
  { ignores: ["**/.netlify/**", "**/.next/**", "**/node_modules/**", "public/**"] },
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
