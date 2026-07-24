import { notifyStorageChange } from "./storage";

/**
 * Local backup & transfer — the privacy-first answer to "sync". Everything
 * the app knows lives in this browser's localStorage under the jipange:
 * prefix; these helpers serialize it to a file the user owns, restore it on
 * another device, or erase it entirely. Nothing is ever transmitted.
 */

const PREFIX = "jipange:";
const BACKUP_VERSION = 1;

export interface BackupFile {
  app: "jipange";
  version: number;
  exportedAt: string;
  /** Raw localStorage values, keyed by their full (prefixed) key. */
  data: Record<string, string>;
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/** Every jipange-owned key currently in localStorage. */
function ownKeys(): string[] {
  const keys: string[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (key && key.startsWith(PREFIX)) keys.push(key);
  }
  return keys;
}

/** Snapshot all app data. Returns null outside the browser or when empty. */
export function exportSnapshot(): BackupFile | null {
  if (!isBrowser()) return null;
  const data: Record<string, string> = {};
  for (const key of ownKeys()) {
    const value = window.localStorage.getItem(key);
    if (value !== null) data[key] = value;
  }
  if (Object.keys(data).length === 0) return null;
  return {
    app: "jipange",
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data,
  };
}

/** Suggested download name, e.g. jipange-backup-2026-07-24.json */
export function backupFilename(date: Date = new Date()): string {
  return `jipange-backup-${date.toISOString().slice(0, 10)}.json`;
}

/**
 * Restores a backup produced by exportSnapshot. Only jipange-prefixed keys
 * are accepted — anything else in the file is ignored, so a tampered or
 * foreign file can't write outside the app's namespace. Existing app data
 * for the same keys is overwritten; other existing keys are left alone.
 * Throws a descriptive Error for files this app didn't produce.
 */
export function importSnapshot(json: string): { restored: number } {
  if (!isBrowser()) return { restored: 0 };

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("That file isn't valid JSON — choose a JiPange backup file.");
  }

  const file = parsed as Partial<BackupFile>;
  if (file?.app !== "jipange" || typeof file.data !== "object" || file.data === null) {
    throw new Error("That file isn't a JiPange backup.");
  }
  if (typeof file.version !== "number" || file.version > BACKUP_VERSION) {
    throw new Error("This backup was made by a newer version of JiPange — update and try again.");
  }

  let restored = 0;
  for (const [key, value] of Object.entries(file.data)) {
    if (!key.startsWith(PREFIX) || typeof value !== "string") continue;
    window.localStorage.setItem(key, value);
    restored++;
  }
  if (restored === 0) {
    throw new Error("That backup file contains no JiPange data.");
  }
  notifyStorageChange();
  return { restored };
}

/** Erases every jipange-owned key (local + session). Irreversible. */
export function clearAllData(): { removed: number } {
  if (!isBrowser()) return { removed: 0 };
  const keys = ownKeys();
  for (const key of keys) window.localStorage.removeItem(key);
  try {
    const sessionKeys: string[] = [];
    for (let i = 0; i < window.sessionStorage.length; i++) {
      const key = window.sessionStorage.key(i);
      if (key && key.startsWith(PREFIX)) sessionKeys.push(key);
    }
    for (const key of sessionKeys) window.sessionStorage.removeItem(key);
  } catch {
    // sessionStorage unavailable — localStorage cleanup already done.
  }
  notifyStorageChange();
  return { removed: keys.length };
}
