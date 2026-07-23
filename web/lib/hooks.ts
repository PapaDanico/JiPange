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
 * Persists a state value to localStorage, kept in sync via
 * useSyncExternalStore. Falls back to defaultValue on the server render and
 * on any storage error. The stored value is restored after hydration so the
 * server and client first-pass HTML always match.
 */
export function useStickyState<T>(key: string, defaultValue: T) {
  const getSnapshot = useCallback(() => readAny<T>(key) ?? defaultValue, [key, defaultValue]);
  const getServerSnapshot = useCallback(() => defaultValue, [defaultValue]);
  const value = useSyncExternalStore(subscribeToStorage, getSnapshot, getServerSnapshot);

  const setAndPersist = useCallback(
    (next: T | ((prev: T) => T)) => {
      const prev = readAny<T>(key) ?? defaultValue;
      const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
      writeAny(key, resolved);
    },
    [key, defaultValue]
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
