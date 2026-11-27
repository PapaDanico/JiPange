/**
 * The route to warm for an href, or null when there is none: external links,
 * protocol-relative URLs, and files (a `.pdf`, `.json`, `.md`), for which a
 * prefetch asks for a route payload that does not exist and logs a 404 in the
 * reader's console. Query and hash are dropped; the route is the same page.
 * Used by components/Link.tsx.
 */
export function prefetchTarget(href: string | null | undefined): string | null {
  if (!href || !href.startsWith("/") || href.startsWith("//")) return null;
  const path = href.split(/[?#]/)[0];
  if (/\.[a-z0-9]+$/i.test(path)) return null;
  return path || "/";
}
