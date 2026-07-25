import { getStore } from "@netlify/blobs";
import { createHash } from "crypto";

/**
 * Memoises AI answers by their exact inputs.
 *
 * The rate limiter already caps abuse at ten calls an hour per IP. What it
 * cannot do is stop us paying twice for the same question, and a multi-step
 * onboarding invites exactly that: users move back and forth between the
 * profile and plan steps, refresh, and re-submit an unchanged form. Every one
 * of those is a fresh generation billed at full price for an answer we have
 * already produced.
 *
 * Keyed on the EXACT input, deliberately. Bucketing — rounding income to the
 * nearest thousand, say — would multiply the hit rate, and it would also mean
 * two people with different circumstances receive the same plan. The whole
 * value of a generated plan is that it is about YOUR numbers, so fidelity wins
 * over hit rate. Identical inputs deserve an identical answer; different
 * inputs must never share one.
 */

/** Bump to invalidate every entry: prompt wording, model or schema changes. */
const CACHE_VERSION = "v1";

/**
 * Plans reference product yields and rates that drift. A month is long enough
 * to absorb a user's back-and-forth in one sitting and short enough that no
 * one is shown a plan built on a materially stale rate environment.
 */
const TTL_MS = 30 * 24 * 60 * 60 * 1000;

interface CacheEntry<T> {
  storedAt: number;
  value: T;
}

/**
 * JSON with object keys sorted at every level, so two payloads that differ only
 * in property order hash identically. `JSON.stringify` preserves insertion
 * order, and a form that emits `{income, goal}` on one path and `{goal, income}`
 * on another would otherwise miss its own cache entry every time.
 */
function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(",")}}`;
}

export function aiCacheKey(routeName: string, input: unknown): string {
  const digest = createHash("sha256").update(stableStringify(input)).digest("hex");
  return `${CACHE_VERSION}:${routeName}:${digest.slice(0, 32)}`;
}

/**
 * Both helpers fail OPEN, matching the rate limiter: if Blobs is unreachable or
 * unconfigured for the current context (plain `next dev` without `netlify
 * dev`), a cache miss simply costs a generation. The feature must never break
 * because its own cost optimisation could not reach its store.
 */
export async function getCachedAi<T>(key: string): Promise<T | null> {
  try {
    const store = getStore({ name: "ai-cache" });
    const entry = (await store.get(key, { type: "json" })) as CacheEntry<T> | null;
    if (!entry || typeof entry.storedAt !== "number") return null;
    if (Date.now() - entry.storedAt > TTL_MS) return null;
    return entry.value;
  } catch {
    return null;
  }
}

export async function putCachedAi<T>(key: string, value: T): Promise<void> {
  try {
    const store = getStore({ name: "ai-cache" });
    const entry: CacheEntry<T> = { storedAt: Date.now(), value };
    await store.setJSON(key, entry);
  } catch {
    // A cache we could not write to is a cache miss next time, nothing worse.
  }
}
