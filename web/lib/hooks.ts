import { useEffect, useRef, useState } from "react";

/**
 * Persists a state value to localStorage. Falls back to defaultValue on the
 * server render and on any storage error. The stored value is restored after
 * hydration so the server and client first-pass HTML always match.
 */
export function useStickyState<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(defaultValue);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored !== null) setValue(JSON.parse(stored) as T);
    } catch {}
  }, [key]);

  function setAndPersist(next: T | ((prev: T) => T)) {
    setValue((prev) => {
      const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
      try {
        localStorage.setItem(key, JSON.stringify(resolved));
      } catch {}
      return resolved;
    });
  }

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
