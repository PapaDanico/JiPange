import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Same fake-browser approach as storage.test.ts, extended with the
 * length/key(i) iteration surface lib/backup.ts uses to enumerate keys.
 */
function installFakeBrowser() {
  const store = new Map<string, string>();
  const session = new Map<string, string>();
  const listeners = new Map<string, Set<(e: Event) => void>>();

  const storageFor = (map: Map<string, string>) => ({
    getItem: (key: string) => (map.has(key) ? map.get(key)! : null),
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
    removeItem: (key: string) => {
      map.delete(key);
    },
    clear: () => map.clear(),
    key: (i: number) => Array.from(map.keys())[i] ?? null,
    get length() {
      return map.size;
    },
  });

  const fakeWindow = {
    localStorage: storageFor(store),
    sessionStorage: storageFor(session),
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
  return { store, session, fakeWindow };
}

let fake: ReturnType<typeof installFakeBrowser>;

beforeEach(() => {
  fake = installFakeBrowser();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

async function backup() {
  return await import("../backup");
}

describe("exportSnapshot", () => {
  it("captures only jipange-prefixed keys", async () => {
    const { exportSnapshot } = await backup();
    fake.store.set("jipange:profile", '{"fullName":"Test"}');
    fake.store.set("jipange:goals", "[]");
    fake.store.set("other-app:secret", "nope");

    const snapshot = exportSnapshot();
    expect(snapshot).not.toBeNull();
    expect(Object.keys(snapshot!.data).sort()).toEqual(["jipange:goals", "jipange:profile"]);
    expect(snapshot!.app).toBe("jipange");
    expect(snapshot!.version).toBe(1);
  });

  it("returns null when there is nothing to back up", async () => {
    const { exportSnapshot } = await backup();
    fake.store.set("other-app:only", "x");
    expect(exportSnapshot()).toBeNull();
  });
});

describe("importSnapshot", () => {
  it("round-trips an export and notifies subscribers", async () => {
    const { exportSnapshot, importSnapshot } = await backup();
    fake.store.set("jipange:profile", '{"fullName":"Test"}');
    fake.store.set("jipange:goals", '[{"goalType":"home"}]');
    const json = JSON.stringify(exportSnapshot());

    fake.store.clear();
    const notified = vi.fn();
    fake.fakeWindow.addEventListener("jipange:storage-change", notified);

    const { restored } = importSnapshot(json);
    expect(restored).toBe(2);
    expect(fake.store.get("jipange:profile")).toBe('{"fullName":"Test"}');
    expect(notified).toHaveBeenCalled();
  });

  it("ignores non-prefixed keys in a tampered file", async () => {
    const { importSnapshot } = await backup();
    const json = JSON.stringify({
      app: "jipange",
      version: 1,
      exportedAt: "2026-01-01T00:00:00Z",
      data: { "jipange:goals": "[]", "evil-key": "payload", __proto__: "x" },
    });
    const { restored } = importSnapshot(json);
    expect(restored).toBe(1);
    expect(fake.store.has("evil-key")).toBe(false);
  });

  it("rejects non-JSON, foreign files, and newer versions", async () => {
    const { importSnapshot } = await backup();
    expect(() => importSnapshot("not json")).toThrow(/valid JSON/);
    expect(() => importSnapshot('{"app":"else","data":{}}')).toThrow(/isn't a JiPange backup/);
    expect(() =>
      importSnapshot('{"app":"jipange","version":99,"data":{"jipange:x":"1"}}')
    ).toThrow(/newer version/);
  });
});

describe("clearAllData", () => {
  it("removes only jipange keys from local and session storage", async () => {
    const { clearAllData } = await backup();
    fake.store.set("jipange:profile", "x");
    fake.store.set("jipange:goals", "y");
    fake.store.set("unrelated", "keep");
    fake.session.set("jipange:continue-banner-dismissed", "1");

    const notified = vi.fn();
    fake.fakeWindow.addEventListener("jipange:storage-change", notified);

    const { removed } = clearAllData();
    expect(removed).toBe(2);
    expect(fake.store.has("unrelated")).toBe(true);
    expect(fake.store.has("jipange:profile")).toBe(false);
    expect(fake.session.size).toBe(0);
    expect(notified).toHaveBeenCalled();
  });
});
