import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { readAny, subscribeToStorage, writeAny } from "./storage";

/**
 * Reads a derived, read-only value from localStorage/sessionStorage via
 * useSyncExternalStore, so the server render and the client's first paint
 * both use `getServerSnapshot` (falling back to a safe default), then swap to
 * the real client-side value once mounted — with no separate mount effect,
 * and live updates if the underlying storage changes (e.g. another tab).
 *
 * Only fit for values you *display or derive from* — never for seeding
 * otherwise-independently-editable state (a restored form draft, say),
 * since this hook would then fight the user's own edits by continuously
 * re-reading storage. Those cases still need a one-time mount effect.
 */
export function useStorageValue<T>(getSnapshot: () => T, getServerSnapshot: () => T): T {
  return useSyncExternalStore(subscribeToStorage, getSnapshot, getServerSnapshot);
}

/**
 * Whether a value read back from storage can stand in for the default.
 *
 * `?? defaultValue` covers null and undefined, which is what a corrupt or
 * absent entry produces — `readAny` catches the parse error and returns null.
 * It does NOT cover a value that parses perfectly well and is the wrong shape,
 * and that gap was reachable: lib/backup.ts restores ANY jipange-prefixed key
 * from a file the reader supplies, so a backup written before a field changed
 * shape, or one hand-edited, puts an object where a string belongs.
 *
 * Measured on the chama member count, whose default is "12":
 *
 *   corrupt JSON  -> "12"   the fallback worked
 *   null          -> "12"   the fallback worked
 *   an object     -> ""     REACHED REACT, and blanked a required field
 *   an array      -> ""     same
 *   the number 7  -> "7"    harmless; the input coerces it
 *
 * So the rule is narrow on purpose. A structured value cannot stand in for a
 * primitive — React renders it as nothing and the field silently starts empty
 * instead of at its default. A number where a string was expected is fine and
 * is deliberately still accepted; tightening that would blank fields that
 * currently work, which is the defect rather than the fix.
 *
 * Found because a test that could not fail was noticed: the savings-goal
 * degradation cases assert the field ends up empty, which is true with or
 * without the fallback, since that default IS "". Removing `?? defaultValue`
 * left all eight green. The chama field, defaulting to "12", is what
 * discriminates — and it failed.
 */
function usableAsDefault<T>(stored: unknown, defaultValue: T): stored is T {
  if (stored === null || stored === undefined) return false;
  const defaultIsStructured = typeof defaultValue === "object" && defaultValue !== null;
  const storedIsStructured = typeof stored === "object";
  if (storedIsStructured !== defaultIsStructured) return false;
  if (defaultIsStructured && Array.isArray(defaultValue) !== Array.isArray(stored)) return false;
  return true;
}

/**
 * Persists a state value to localStorage, kept in sync via
 * useSyncExternalStore. Falls back to defaultValue on the server render and
 * on any storage error. The stored value is restored after hydration so the
 * server and client first-pass HTML always match.
 */
export function useStickyState<T>(key: string, defaultValue: T) {
  /* Returns either the cached parsed value or the caller's own defaultValue,
   * both referentially stable — which useSyncExternalStore requires of
   * getSnapshot for object values. */
  const read = useCallback((): T => {
    const stored = readAny<unknown>(key);
    return usableAsDefault(stored, defaultValue) ? stored : defaultValue;
  }, [key, defaultValue]);

  const getSnapshot = read;
  const getServerSnapshot = useCallback(() => defaultValue, [defaultValue]);
  const value = useSyncExternalStore(subscribeToStorage, getSnapshot, getServerSnapshot);

  const setAndPersist = useCallback(
    (next: T | ((prev: T) => T)) => {
      const prev = read();
      const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
      writeAny(key, resolved);
    },
    [key, read]
  );

  return [value, setAndPersist] as const;
}

/**
 * Returns a ref to attach to the results container.
 * Smoothly scrolls it into view the first time `ready` becomes true,
 * then resets so it will scroll again if the user clears and recalculates.
 */
export function useScrollIntoView<T extends HTMLElement>(ready: boolean) {
  const ref = useRef<T>(null);
  const triggered = useRef(false);

  useEffect(() => {
    if (ready && !triggered.current && ref.current) {
      triggered.current = true;
      setTimeout(() => ref.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 50);
    }
    if (!ready) triggered.current = false;
  }, [ready]);

  return ref;
}
