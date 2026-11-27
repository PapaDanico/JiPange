/**
 * The optional `via` route the publisher (Mwangaza Yield) records on each
 * T-bill and macro figure: how the figure arrived.
 *
 * Validated here, not trusted: an unknown value is DROPPED and reported rather
 * than refusing the sync, so a route Mwangaza adds later can never block a rate
 * update, and the UI can never render a label for a route it does not know.
 * An absent route stays absent. Nothing is defaulted or inferred from `source`.
 *
 * KNOWN_ROUTES must equal the RateRoute union in web/lib/rates-feed.ts; a test
 * pins that.
 */
export const KNOWN_ROUTES = ["supplied-document", "search-corroborated", "imf-weo", "cbk-home"];

/** Mutates `feed`, returning the list of dropped values for the log. */
export function sanitizeRoutes(feed) {
  const dropped = [];
  const check = (where, row) => {
    if (!row || typeof row !== "object" || !("via" in row)) return;
    if (typeof row.via === "string" && KNOWN_ROUTES.includes(row.via)) return;
    dropped.push(`${where}: ${JSON.stringify(row.via)}`);
    delete row.via;
  };
  for (const row of Array.isArray(feed?.tbills) ? feed.tbills : []) {
    check(`tbills ${row?.tenorDays}d`, row);
  }
  for (const [key, row] of Object.entries(feed?.macro ?? {})) check(`macro.${key}`, row);
  return dropped;
}
