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
      /* An error, not a warning, since the migration this rule once
       * waited on is done. What was ~24 mount effects hydrating state from
       * localStorage now reads through useSyncExternalStore (useStorageValue
       * in lib/hooks.ts). Four call sites keep a one-time mount effect on
       * purpose — each restores a draft into fields the reader then edits,
       * which useStorageValue's own doc says it must not do, since it would
       * re-read storage over the reader's typing — and each carries an
       * eslint-disable with that reason. A new instance has to argue the
       * same case in its disable comment, or be written without the effect. */
      "react-hooks/set-state-in-effect": "error",
    },
  },
];

export default config;
