import withPWA from "@ducanh2912/next-pwa";

const withPWAConfig = withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  cacheOnFrontEndNav: true,
  /* Deliberately OFF.
   *
   * swe-worker-*.js is spawned by cacheOnFrontEndNav above and stays either
   * way. This flag is what makes that worker ALSO warm-cache a cached page's
   * sub-assets — by fetching the HTML AS TEXT and regex-scanning it:
   *
   *     /<link.*?href=['"](.*?)['"].*?>/g
   *
   * Two things go wrong with that. The pattern is lazy and `.` spans the gap
   * between tags, so a match starting at a <link rel="preload" as="image">
   * runs on until it finds an href in a LATER tag — and the rel="stylesheet"
   * test then passes on text belonging to a different element. And because it
   * reads raw HTML rather than the DOM, `&amp;` is never entity-decoded, so
   * the URL it caches is
   *
   *     /_next/image?url=%2Flogo-lockup.webp&amp;w=3840&amp;q=75
   *
   * which Next's image route rejects with 400 `"w" parameter (width) is
   * required` — the query key parsed as `amp;w`, so there is no width at all.
   *
   * Measured: two 400s on every page load, on all 25 tools and 6 planners.
   * Invisible to the user (the real <img> loads fine) and invisible to page
   * -level devtools too, because the worker's fetches are not attributed to
   * the page — which is why this survived until something diffed the network
   * log against what the page actually needs.
   *
   * cacheOnFrontEndNav above is kept: that is the page cache offline browsing
   * depends on. Verified after the change — visit a tool, go offline, reload,
   * and the page still serves from cache. What is given up is only the
   * pre-warming of CSS/JS that this regex was supposed to do and did badly. */
  aggressiveFrontEndNavCaching: false,
  reloadOnOnline: true,
  workboxOptions: {
    disableDevLogs: true,
  },
});

export default withPWAConfig({
  async redirects() {
    return [
      {
        /* /tools/education-savings was retired, not deleted.
         *
         * It modelled school fees as two future lump sums at the CBC
         * transitions, with no fee escalation. That is right for a family on
         * the public track and wrong by a factor of about six for anyone
         * paying private fees today — it omitted every year between now and
         * the next transition, which is precisely the years they are already
         * paying for.
         *
         * /tools/school-fees-lifetime answers the same question properly and
         * covers the public track too, since the Ministry fee can simply be
         * typed in. So this is a supersession rather than a removal, and a
         * permanent redirect is the honest way to say that: the URL has been
         * shared, bookmarked and indexed, and a 404 would punish the readers
         * who trusted it most.
         */
        source: "/tools/education-savings",
        destination: "/tools/school-fees-lifetime",
        permanent: true,
      },
    ];
  },
});
