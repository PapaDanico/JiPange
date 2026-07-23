"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Animates a number from its currently-displayed value to `target` over
 * `durationMs`, using an ease-out curve. Pass `null` while the real value
 * isn't available yet (e.g. still loading) — the hook adopts the first real
 * value it sees immediately, without animating, then animates subsequent
 * changes. Snaps straight to `target` for users who've requested reduced
 * motion.
 */
export function useCountUp(target: number | null, durationMs = 700): number {
  const [value, setValue] = useState(0);
  const [adoptedTarget, setAdoptedTarget] = useState<number | null>(null);
  const rafId = useRef<number | undefined>(undefined);

  // Adopt the first real value immediately (no animation) the moment it's
  // available. This is React's own sanctioned pattern for "adjust state
  // when a prop changes" — calling setState during render is safe (React
  // re-renders before committing/painting); mutating a *ref* during render
  // is not, since a render can be thrown away and retried without ever
  // committing. https://react.dev/learn/you-might-not-need-an-effect
  if (target !== null && adoptedTarget === null) {
    setAdoptedTarget(target);
    setValue(target);
  }

  useEffect(() => {
    if (target === null || value === target) return;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      setValue(target);
      return;
    }

    const start = value;
    const end = target;
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(start + (end - start) * eased);

      if (progress < 1) {
        rafId.current = requestAnimationFrame(tick);
      }
    }

    rafId.current = requestAnimationFrame(tick);
    return () => {
      if (rafId.current !== undefined) cancelAnimationFrame(rafId.current);
    };
    // `value` is deliberately excluded — it's read only as the animation's
    // starting point when `target`/`durationMs` change, not something the
    // effect should re-run for (it changes every animation frame).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, durationMs]);

  return value;
}
