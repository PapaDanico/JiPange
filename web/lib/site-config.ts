/**
 * Single source of truth for the canonical production URL.
 *
 * Set NEXT_PUBLIC_SITE_URL in your deployment environment (Netlify, Vercel, …)
 * to the actual production origin.  Falls back to jipangefinance.org so the
 * app remains functional even when the variable is absent.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://jipangefinance.org";
