import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * lib/storage.ts's browser detection is `typeof window !== "undefined"`, and
 * this suite runs in vitest's "node" environment (no window/localStorage
 * globals) — install minimal fakes before each test so the module's
 * isBrowser() check passes and its localStorage calls resolve against a
 * real in-memory Map, exactly like a real browser would.
 */
function installFakeBrowser() {
  const store = new Map<string, string>();
  const listeners = new Map<string, Set<(e: Event) => void>>();

  const fakeLocalStorage = {
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
  };

  const fakeWindow = {
    localStorage: fakeLocalStorage,
    addEventListener: (type: string, listener: (e: Event) => void) => {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type)!.add(listener);
    },
    removeEventListener: (type: string, listener: (e: Event) => void) => {
      listeners.get(type)?.delete(listener);
    },
    dispatchEvent: (event: Event) => {
      listeners.get(event.type)?.forEach((listener) => listener(event));
      return true;
    },
  };

  vi.stubGlobal("window", fakeWindow);
  vi.stubGlobal("localStorage", fakeLocalStorage);
  return { store };
}

describe("lib/storage core read/write/notify", () => {
  beforeEach(() => {
    installFakeBrowser();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("returns null for a key that was never written", async () => {
    const { readAny } = await import("../storage");
    expect(readAny("nope")).toBeNull();
  });

  it("round-trips a written value", async () => {
    const { readAny, writeAny } = await import("../storage");
    writeAny("k", { a: 1 });
    expect(readAny("k")).toEqual({ a: 1 });
  });

  it("returns a referentially stable parsed value across reads when nothing changed", async () => {
    const { readAny, writeAny } = await import("../storage");
    writeAny("k", { a: 1 });
    const first = readAny("k");
    const second = readAny("k");
    expect(first).toBe(second);
  });

  it("returns a new parsed value after a write changes the raw string", async () => {
    const { readAny, writeAny } = await import("../storage");
    writeAny("k", { a: 1 });
    const first = readAny("k");
    writeAny("k", { a: 2 });
    const second = readAny("k");
    expect(first).not.toBe(second);
    expect(second).toEqual({ a: 2 });
  });

  it("removeAny clears the value and invalidates the cache", async () => {
    const { readAny, writeAny, removeAny } = await import("../storage");
    writeAny("k", "hello");
    expect(readAny("k")).toBe("hello");
    removeAny("k");
    expect(readAny("k")).toBeNull();
  });

  it("subscribeToStorage's callback fires on a same-tab write", async () => {
    const { writeAny, subscribeToStorage } = await import("../storage");
    const onChange = vi.fn();
    const unsubscribe = subscribeToStorage(onChange);
    writeAny("k", "v");
    expect(onChange).toHaveBeenCalledTimes(1);
    unsubscribe();
    writeAny("k", "v2");
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("subscribeToStorage's callback fires on a cross-tab native storage event", async () => {
    const { subscribeToStorage } = await import("../storage");
    const onChange = vi.fn();
    subscribeToStorage(onChange);
    window.dispatchEvent(new Event("storage"));
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("getStoredGoals returns a stable empty-array reference when nothing is stored", async () => {
    const { getStoredGoals } = await import("../storage");
    expect(getStoredGoals()).toBe(getStoredGoals());
    expect(getStoredGoals()).toEqual([]);
  });

  it("saveStoredGoal persists and getStoredGoals reflects it immediately", async () => {
    const { getStoredGoals, saveStoredGoal } = await import("../storage");
    saveStoredGoal({
      goalType: "home",
      title: "Deposit",
      emoji: "🏠",
      amountToday: 100,
      nominalTarget: 120,
      years: 2,
      requiredMonthly: 5,
      savedAt: "2026-01-01",
    });
    expect(getStoredGoals()).toHaveLength(1);
    expect(getStoredGoals()[0].goalType).toBe("home");
  });
});
