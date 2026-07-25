import { describe, it, expect, vi, beforeEach } from "vitest";

// Netlify Blobs is unavailable outside a Netlify context, and the module under
// test is required to survive that. The store is faked so behaviour can be
// asserted, and one test tears it down to prove the fail-open path.
const store = new Map<string, string>();
let blobsThrows = false;

vi.mock("@netlify/blobs", () => ({
  getStore: () => {
    if (blobsThrows) throw new Error("Blobs unavailable");
    return {
      get: async (key: string) => {
        const raw = store.get(key);
        return raw ? JSON.parse(raw) : null;
      },
      setJSON: async (key: string, value: unknown) => {
        store.set(key, JSON.stringify(value));
      },
    };
  },
}));

const { aiCacheKey, getCachedAi, putCachedAi } = await import("../ai-cache");

beforeEach(() => {
  store.clear();
  blobsThrows = false;
  vi.useRealTimers();
});

describe("aiCacheKey", () => {
  it("is stable for the same input", () => {
    expect(aiCacheKey("plan", { a: 1 })).toBe(aiCacheKey("plan", { a: 1 }));
  });

  it("ignores property order, which a form can vary between paths", () => {
    expect(aiCacheKey("plan", { a: 1, b: 2 })).toBe(aiCacheKey("plan", { b: 2, a: 1 }));
  });

  it("ignores property order at depth too", () => {
    expect(aiCacheKey("plan", { p: { x: 1, y: 2 } })).toBe(aiCacheKey("plan", { p: { y: 2, x: 1 } }));
  });

  it("separates different inputs — nobody gets another person's plan", () => {
    expect(aiCacheKey("plan", { income: 50_000 })).not.toBe(aiCacheKey("plan", { income: 50_001 }));
  });

  it("separates different routes sharing an input shape", () => {
    expect(aiCacheKey("plan", { a: 1 })).not.toBe(aiCacheKey("strategy", { a: 1 }));
  });

  it("does not confuse array order, which is meaningful", () => {
    expect(aiCacheKey("plan", { v: ["mmf", "sacco"] })).not.toBe(aiCacheKey("plan", { v: ["sacco", "mmf"] }));
  });

  it("treats an absent field and an explicitly undefined one as the same", () => {
    expect(aiCacheKey("plan", { a: 1, b: undefined })).toBe(aiCacheKey("plan", { a: 1 }));
  });
});

describe("cache round-trip", () => {
  it("returns what was stored", async () => {
    const key = aiCacheKey("plan", { a: 1 });
    await putCachedAi(key, { steps: ["one", "two"] });
    expect(await getCachedAi(key)).toEqual({ steps: ["one", "two"] });
  });

  it("misses on a key never written", async () => {
    expect(await getCachedAi(aiCacheKey("plan", { a: 99 }))).toBeNull();
  });

  it("expires an entry older than the TTL", async () => {
    const key = aiCacheKey("plan", { a: 1 });
    await putCachedAi(key, { steps: ["stale"] });
    // 31 days on — past the 30-day TTL, so rates may have moved.
    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + 31 * 24 * 60 * 60 * 1000);
    expect(await getCachedAi(key)).toBeNull();
  });

  it("still serves an entry inside the TTL", async () => {
    const key = aiCacheKey("plan", { a: 1 });
    await putCachedAi(key, { steps: ["fresh"] });
    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + 29 * 24 * 60 * 60 * 1000);
    expect(await getCachedAi(key)).toEqual({ steps: ["fresh"] });
  });

  it("ignores a malformed entry rather than serving it", async () => {
    store.set("bad", JSON.stringify({ value: { steps: [] } })); // no storedAt
    expect(await getCachedAi("bad")).toBeNull();
  });
});

describe("fails open, like the rate limiter", () => {
  it("reads as a miss when Blobs is unreachable", async () => {
    blobsThrows = true;
    expect(await getCachedAi("anything")).toBeNull();
  });

  it("swallows a write failure rather than breaking the request", async () => {
    blobsThrows = true;
    await expect(putCachedAi("anything", { a: 1 })).resolves.toBeUndefined();
  });
});
