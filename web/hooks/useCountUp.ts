"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Animates a number from its currently-displayed value to `target` over
 * `durationMs`, using an ease-out curve. Pass `null` while the real value
 * isn't available yet (e.g. still loading) — the hook adopts the first real
 * value it sees immediately, without animating, then animates subsequent
 * changes. Snaps straight to `target` for users who've requested reduced
 * motion. Tracks the actual displayed value (not just the last completed
 * target) so a re-triggered animation continues smoothly even if it
 * interrupts one already in flight.
 */
export function useCountUp(target: number | null, durationMs = 700): number {
  const [value, setValue] = useState(0);
  const valueRef = useRef(0);
  const hasAdoptedRealValue = useRef(false);
  const rafId = useRef<number>();

  const setAnimatedValue = (next: number) => {
    valueRef.current = next;
    setValue(next);
  };

  if (target !== null && !hasAdoptedRealValue.current) {
    hasAdoptedRealValue.current = true;
    valueRef.current = target;
    if (value !== target) setValue(target);
  }

  useEffect(() => {
    if (target === null || valueRef.current === target) return;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      setAnimatedValue(target);
      return;
    }

    const start = valueRef.current;
    const end = target;
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedValue(start + (end - start) * eased);

      if (progress < 1) {
        rafId.current = requestAnimationFrame(tick);
      }
    }

    rafId.current = requestAnimationFrame(tick);
    return () => {
      if (rafId.current !== undefined) cancelAnimationFrame(rafId.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, durationMs]);

  return value;
}
