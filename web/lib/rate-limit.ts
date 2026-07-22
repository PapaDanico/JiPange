import { getStore } from "@netlify/blobs";

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS_PER_WINDOW = 10;

/** A caller exceeded MAX_REQUESTS_PER_WINDOW calls to a rate-limited route this hour. */
export class RateLimitedError extends Error {
  constructor(public readonly retryAfterSeconds: number) {
    super("Rate limit exceeded");
    this.name = "RateLimitedError";
  }
}

function clientIp(request: Request): string {
  const header =
    request.headers.get("x-nf-client-connection-ip") ?? request.headers.get("x-forwarded-for");
  return header?.split(",")[0]?.trim() || "unknown";
}

/**
 * Throttles a route per client IP using a self-overwriting fixed-window
 * counter in Netlify Blobs (one key per ip+route — no unbounded key growth).
 * Not a security boundary: Blobs has no atomic increment, so a burst of
 * concurrent requests can race past the limit by one or two. That's an
 * acceptable trade-off for cost/abuse protection on a free tool, not a
 * correctness requirement.
 *
 * Fails OPEN: if Blobs is unreachable or unconfigured for the current
 * context (e.g. local `next dev` without `netlify dev`), the request is
 * allowed through rather than the whole AI feature breaking because its
 * own abuse-mitigation layer couldn't reach its store.
 */
export async function enforceRateLimit(request: Request, routeName: string): Promise<void> {
  const ip = clientIp(request);
  const key = `${routeName}:${ip}`;
  const now = Date.now();
  const currentWindowStart = Math.floor(now / WINDOW_MS);

  let store: ReturnType<typeof getStore>;
  let existing: { windowStart: number; count: number } | null;
  try {
    store = getStore({ name: "rate-limits", consistency: "strong" });
    existing = (await store.get(key, { type: "json" })) as {
      windowStart: number;
      count: number;
    } | null;
  } catch (error) {
    console.error(`rate-limit store unavailable for ${routeName}, failing open:`, error);
    return;
  }

  const count = existing && existing.windowStart === currentWindowStart ? existing.count + 1 : 1;

  if (count > MAX_REQUESTS_PER_WINDOW) {
    const windowEndMs = (currentWindowStart + 1) * WINDOW_MS;
    throw new RateLimitedError(Math.ceil((windowEndMs - now) / 1000));
  }

  try {
    await store.setJSON(key, { windowStart: currentWindowStart, count });
  } catch (error) {
    console.error(`rate-limit write failed for ${routeName}, failing open:`, error);
  }
}
