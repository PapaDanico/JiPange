import withPWA from "@ducanh2912/next-pwa";

const withPWAConfig = withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
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
